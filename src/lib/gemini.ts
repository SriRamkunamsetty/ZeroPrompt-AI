import { GoogleGenAI } from '@google/genai';

// Initialize the API using the API key injected by the platform.
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
