import { ai } from '../lib/gemini';
import { auth } from '../lib/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://zeroprompt-api-1076783333102.us-central1.run.app';

async function fetchFromBackend(endpoint: string, body: any) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    let errorMessage = `Backend error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      }
    } catch (e) {
      // Fallback to statusText if body is not JSON
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

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
  const startTime = Date.now();
  
  const timeoutPromise = new Promise<any>((_, reject) => {
    setTimeout(() => reject(new Error('timeout: API took too long to respond (45s limit)')), 45000);
  });

  try {
    const data = await Promise.race([
      fetchFromBackend('/api/analyze-document', { textContent }),
      timeoutPromise
    ]);
    
    // The backend already returns the parsed JSON, so we just calculate metrics
    const endTime = Date.now();
    const estimatedTokens = Math.ceil(textContent.length / 4);
    const estimatedCost = (estimatedTokens * 0.000015).toFixed(4);
    
    return {
      ...data,
      metrics: {
        timeMs: endTime - startTime,
        tokens: estimatedTokens,
        cost: estimatedCost,
        confidence: data.confidenceScore || 85,
        cached: false,
        demoMode: false
      }
    };
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
}

export async function analyzeCsvData(csvText: string) {
  return fetchFromBackend('/api/analyze-csv', { csvText });
}

export async function analyzeCode(code: string, fileName: string) {
  return fetchFromBackend('/api/analyze-code', { code, fileName });
}

export async function runGuidedWizard(goal: string, scope: string, urgency: string) {
  return fetchFromBackend('/api/guided-wizard', { goal, scope, urgency });
}
