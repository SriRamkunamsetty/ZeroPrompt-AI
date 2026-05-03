import { describe, it, expect } from 'vitest';
import { analyzeDocumentText } from '../services/ai_service';
import { ai } from '../lib/gemini';
import { vi } from 'vitest';

vi.mock('../lib/gemini', () => ({
  ai: {
    models: {
      generateContent: vi.fn(),
    }
  }
}));

describe('AI Response Format Validation', () => {
  it('should parse well-structured JSON correctly and calculate metrics', async () => {
    const mockResponse = {
      text: JSON.stringify({
        summary: "This is a summary",
        keyPoints: ["Point 1"],
        quiz: [],
        detectedContentType: "Education",
        suggestedActions: [{ title: "Quiz", action: "quiz" }]
      })
    };
    
    (ai.models.generateContent as any).mockResolvedValue(mockResponse);
    
    const result = await analyzeDocumentText('Some fake content to analyze');
    
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('keyPoints');
    expect(result).toHaveProperty('metrics');
    expect(result.metrics).toHaveProperty('tokens');
    expect(result.metrics).toHaveProperty('cost');
    expect(result.suggestedActions.length).toBeGreaterThan(0);
    expect(result.summary).toBe('This is a summary');
  });

  it('should handle malformed non-JSON strings gracefully by bubbling up parsing errors', async () => {
    const mockResponse = {
      text: "I am an AI, I don't follow instructions sometimes. Here is text."
    };
    
    (ai.models.generateContent as any).mockResolvedValue(mockResponse);
    
    await expect(analyzeDocumentText('content')).rejects.toThrow(); // JSON.parse will throw
  });
});
