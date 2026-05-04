import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeDocumentText } from '../services/ai_service';

describe('AI Response Format Validation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should parse well-structured JSON correctly and calculate metrics', async () => {
    const mockData = {
      summary: "This is a summary",
      keyPoints: ["Point 1"],
      quiz: [],
      detectedContentType: "Education",
      suggestedActions: [{ title: "Quiz", action: "quiz" }]
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    });
    
    const result = await analyzeDocumentText('Some fake content to analyze');
    
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('keyPoints');
    expect(result).toHaveProperty('metrics');
    expect(result.metrics).toHaveProperty('tokens');
    expect(result.metrics).toHaveProperty('cost');
    expect(result.suggestedActions.length).toBeGreaterThan(0);
    expect(result.summary).toBe('This is a summary');
  });

  it('should trigger fail-safe fallback if api fails (simulating timeout/500)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error"
    });
    
    const result = await analyzeDocumentText('content');
    expect(result.summary).toContain('fail-safe demo response');
    expect(result.metrics.demoMode).toBe(true);
  });
});
