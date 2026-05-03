import { ai } from '../lib/gemini';

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to read file as Base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

export async function analyzeDocumentText(textContent: string) {
  const prompt = `
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

  const startTime = Date.now();
  
  const timeoutPromise = new Promise<any>((_, reject) => {
    setTimeout(() => reject(new Error('timeout: AI took too long to respond (45s limit)')), 45000);
  });

  let response;
  try {
    response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config: { responseMimeType: 'application/json' },
        contents: prompt
      }),
      timeoutPromise
    ]);
  } catch (apiErr) {
    console.warn("API failed or timed out, returning fail-safe demo response.", apiErr);
    return {
      topic: "ZeroPrompt Architectural Resilience (Demo Mode)",
      summary: "This is a fail-safe demo response generated because the actual AI request timed out or failed. ZeroPrompt AI includes this resilience feature to ensure product demos and critical workflows never crash unexpectedly. This fallback simulates a successful, structured extraction.",
      keyPoints: [
        "Architectural resilience is active",
        "Deterministic fallback triggered instead of blank screen",
        "Zero downtime application design"
      ],
      quiz: [
        { question: "What is ZeroPrompt AI's fallback strategy?", options: ["It crashes", "It shows a blank screen", "It serves a fail-safe offline response", "It forces a refresh"], answer: "It serves a fail-safe offline response" }
      ],
      detectedContentType: "Technical Demo (Fallback)",
      suggestedActions: [
        { title: "Review Network Logs", action: "review_logs" },
        { title: "Configure Timeout Policy", action: "config_timeout" }
      ],
      suggestionExplanation: "These actions are generated dynamically to illustrate how action routing populates even during a fail-safe, offline-ready application state.",
      confidenceScore: 100,
      metrics: {
        timeMs: Date.now() - startTime,
        tokens: Math.ceil((textContent?.length || 1000) / 4),
        cost: "0.0000",
        confidence: 100,
        cached: false,
        demoMode: true
      }
    };
  }
  
  const endTime = Date.now();

  const text = response.text;
  if (!text || typeof text !== "string") {
    throw new Error("Invalid AI response format");
  }

  try {
    const rawResult = JSON.parse(text);
    const estimatedTokens = Math.ceil(textContent.length / 4);
    // Rough estimate: ~$0.000015 per token
    const estimatedCost = (estimatedTokens * 0.000015).toFixed(4);
    
    return {
      ...rawResult,
      metrics: {
        timeMs: endTime - startTime,
        tokens: estimatedTokens,
        cost: estimatedCost,
        confidence: rawResult.confidenceScore || 85,
        cached: false,
        demoMode: false
      }
    };
  } catch (err) {
    console.warn("Failed to parse AI response as JSON, falling back.", err);
    throw new Error("Failed to parse AI response as JSON");
  }
}

export async function analyzeCsvData(csvText: string) {
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: { responseMimeType: 'application/json' },
    contents: prompt
  });

  const text = response.text;
  if (!text || typeof text !== "string") {
    throw new Error("Invalid AI response format");
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Failed to parse AI response as JSON");
  }
}

export async function analyzeCode(code: string, fileName: string) {
  const prompt = `
    Analyze the provided code file named "${fileName}".
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: { responseMimeType: 'application/json' },
    contents: prompt
  });

  const text = response.text;
  if (!text || typeof text !== "string") {
    throw new Error("Invalid AI response format");
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Failed to parse AI response as JSON");
  }
}

export async function runGuidedWizard(goal: string, scope: string, urgency: string) {
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: { responseMimeType: 'application/json' },
    contents: prompt
  });

  const text = response.text;
  if (!text || typeof text !== "string") {
    throw new Error("Invalid AI response format");
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Failed to parse AI response as JSON");
  }
}
