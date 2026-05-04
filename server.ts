import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Initialize Firebase Admin for token verification using default credentials
// (Cloud Run injected service account will be used automatically)
if (process.env.NODE_ENV === 'production' && process.env.CLOUD_RUN) {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
}

const app = express();
const PORT = parseInt(process.env.PORT as string, 10) || 8080; // Cloud run default is 8080 or port from env

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later' }
});

app.use('/api/', apiLimiter);
app.use(express.json({ limit: '3mb' }));

// Middleware to verify Firebase Auth token
const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In development, allow bypass if needed, but strict in production
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  if (process.env.NODE_ENV === 'production' && process.env.CLOUD_RUN) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      console.error('Auth verification failed:', error);
      return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
  } else {
    // In local dev without service account, assume token is valid if present
    next();
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'zeroprompt-ai-backend' });
});

function setRateLimitHeaders(res: express.Response, limit: number, count: number, resetMs: number) {
  res.setHeader('X-RateLimit-Limit', limit);
  const remaining = Math.max(0, limit - Math.min(count, limit));
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetMs / 1000));
  
  if (remaining === 0) {
    const retrySeconds = Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
    res.setHeader('Retry-After', retrySeconds);
  }
}

// Middleware to check user quota via Firestore
const checkUserQuota = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  
  if (!user || !user.uid) {
    if (process.env.NODE_ENV !== 'production' || !process.env.CLOUD_RUN) {
      return next(); // Bypass in local dev when token verification is bypassed
    }
    return res.status(401).json({ error: 'Unauthorized: Missing user information' });
  }

  if (admin.apps.length === 0) {
    return next(); // Bypass if Firestore isn't initialized
  }

  const LIMIT = 20;

  try {
    const db = admin.firestore();
    const usageRef = db.collection('usage').doc(user.uid);
    
    const stats = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);
      const now = admin.firestore.Timestamp.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (!doc.exists) {
        transaction.set(usageRef, {
          count: 1,
          lastReset: now
        });
        return { count: 1, resetMs: Date.now() + oneDayInMs };
      } else {
        const data = doc.data();
        if (!data) throw new Error('No data');
        
        const lastResetDate = data.lastReset.toDate ? data.lastReset.toDate() : new Date(data.lastReset);
        const resetMs = lastResetDate.getTime() + oneDayInMs;
        
        if (Date.now() > resetMs) {
          transaction.set(usageRef, {
            count: 1,
            lastReset: now
          });
          return { count: 1, resetMs: Date.now() + oneDayInMs };
        } else {
          if (data.count >= LIMIT) {
            const err = new Error('QUOTA_EXCEEDED');
            (err as any).resetMs = resetMs;
            (err as any).count = data.count; // Add count to error for remaining calculation
            throw err;
          }
          transaction.update(usageRef, {
            count: admin.firestore.FieldValue.increment(1)
          });
          return { count: data.count + 1, resetMs };
        }
      }
    });

    setRateLimitHeaders(res, LIMIT, stats.count, stats.resetMs);
    next();
  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') {
      const resetMs = error.resetMs || (Date.now() + 24 * 60 * 60 * 1000);
      const count = error.count || LIMIT;
      setRateLimitHeaders(res, LIMIT, count, resetMs);
      return res.status(429).json({ error: 'Daily usage limit reached' });
    }
    console.error('Error checking quota:', error);
    return res.status(500).json({ error: 'Internal server error while checking quota' });
  }
};

app.post('/api/analyze-document', verifyAuth, checkUserQuota, async (req, res) => {
  try {
    const { textContent, customPrompt } = req.body;
    
    if (!textContent) {
      return res.status(400).json({ error: 'Missing textContent' });
    }

    const prompt = customPrompt || `
      Analyze this document text and provide a structured JSON response.
      Do NOT include markdown formatting like \`\`\`json in the output. Just return the raw JSON object.
      
      The JSON structure MUST be:
      {
        "topic": "Brief topic of the document",
        "summary": "A concise 2-3 paragraph summary",
        "keyPoints": ["Point 1", "Point 2", "Point 3"],
        "quiz": [
          { "question": "Q1", "options": ["A", "B", "C", "D"], "answer": "The correct option" }
        ],
        "detectedContentType": "Education | Technical | Business | Narrative | Other",
        "suggestedActions": [
          { "title": "Action Title (e.g. Generate Flashcards)", "action": "action_id" }
        ],
        "suggestionExplanation": "Explanation of why these actions were suggested based on content type and structure.",
        "confidenceScore": 95
      }
      
      Document Text:
      ${textContent.substring(0, 30000)} // truncate to prevent token limits
    `;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { responseMimeType: 'application/json' },
      contents: prompt
    });

    try {
      const data = JSON.parse(aiResponse.text || '{}');
      res.json(data);
    } catch (parseError) {
      res.status(500).json({ error: 'Failed to parse AI response as JSON.' });
    }
  } catch (err: any) {
    console.error('Error in /api/analyze-document:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.post('/api/analyze-csv', verifyAuth, checkUserQuota, async (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText) return res.status(400).json({ error: 'Missing csvText' });

    const prompt = `
      You are a data analysis engine. I am providing you with the contents of a CSV file.
      Analyze the data, detect patterns, and suggest 2 key visual charts that summarize the data.
      
      Provide the response as raw JSON (no markdown ticks).
      Structure MUST be:
      {
        "summary": "Brief analysis of the data.",
        "trends": ["Trend 1", "Trend 2"],
        "charts": [
          {
            "title": "Chart Title",
            "type": "bar", // 'bar' | 'line' | 'pie'
            "labels": ["L1", "L2", "L3"],
            "datasetLabel": "Metric Name",
            "data": [10, 20, 30]
          }
        ]
      }
      
      CSV Data (truncated if large):
      ${csvText.substring(0, 10000)}
    `;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { responseMimeType: 'application/json' },
      contents: prompt
    });

    try {
      const data = JSON.parse(aiResponse.text || '{}');
      res.json(data);
    } catch (parseError) {
      res.status(500).json({ error: 'Failed to parse AI response as JSON.' });
    }
  } catch (err: any) {
    console.error('Error in /api/analyze-csv:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.post('/api/analyze-code', verifyAuth, checkUserQuota, async (req, res) => {
  try {
    const { code, fileName } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code' });

    const prompt = `
      Analyze the provided code file named "${fileName || 'code.txt'}".
      Identify its purpose, detect any bugs, and suggest improvements.
      
      Provide the response as raw JSON (no markdown ticks).
      Structure MUST be:
      {
        "explanation": "What the code does in simple terms",
        "bugs": ["Bug 1 or vulnerability", "Bug 2"],
        "improvements": ["Suggestion 1", "Suggestion 2"],
        "qualityScore": 85 // Integer out of 100
      }
      
      Code:
      ${code.substring(0, 20000)}
    `;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { responseMimeType: 'application/json' },
      contents: prompt
    });

    try {
      const data = JSON.parse(aiResponse.text || '{}');
      res.json(data);
    } catch (parseError) {
      res.status(500).json({ error: 'Failed to parse AI response as JSON.' });
    }
  } catch (err: any) {
    console.error('Error in /api/analyze-code:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.post('/api/guided-wizard', verifyAuth, checkUserQuota, async (req, res) => {
  try {
    const { goal, scope, urgency } = req.body;
    if (!goal) return res.status(400).json({ error: 'Missing goal' });

    const prompt = `
      Act as an expert planner. The user wants to: ${goal}.
      The scope of the project is: ${scope}.
      The urgency is: ${urgency}.
      
      Create a step-by-step action plan.
      Provide the response as raw JSON (no markdown ticks).
      Structure MUST be:
      {
        "overview": "Brief strategic overview",
        "phases": [
          {
            "name": "Phase 1: Setup",
            "description": "What to do first",
            "tasks": ["Task 1", "Task 2"]
          }
        ],
        "estimatedDuration": "e.g., 2 weeks"
      }
    `;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { responseMimeType: 'application/json' },
      contents: prompt
    });

    try {
      const data = JSON.parse(aiResponse.text || '{}');
      res.json(data);
    } catch (parseError) {
      res.status(500).json({ error: 'Failed to parse AI response as JSON.' });
    }
  } catch (err: any) {
    console.error('Error in /api/guided-wizard:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// For local development with Vite
if (process.env.NODE_ENV !== 'production' && !process.env.CLOUD_RUN) {
  import('vite').then(async ({ createServer: createViteServer }) => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    const LOCAL_PORT = parseInt(process.env.PORT as string, 10) || 3000;
    app.listen(LOCAL_PORT, '0.0.0.0', () => {
      console.log(`Local dev server (Vite + Express) running on port ${LOCAL_PORT}`);
    });
  });
} else {
  // Production start for Cloud Run
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Production API server running on port ${PORT}`);
  });
}
