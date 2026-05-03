import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTextFromFile } from '../lib/file_parser';

// Mock mammoth and pdfjs so we test the parsing logic dispatch
vi.mock('mammoth', () => ({
  extractRawText: vi.fn().mockResolvedValue({ value: 'Parsed DOCX content' })
}));

vi.mock('pdfjs-dist', () => ({
  version: 'mock-version',
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn().mockImplementation(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Parsed PDF content' }]
        })
      })
    })
  }))
}));

describe('File Parsing Logic', () => {
  it('should read text files directly', async () => {
    const file = new File(['Hello text'], 'test.txt', { type: 'text/plain' });
    const text = await extractTextFromFile(file);
    expect(text).toBe('Hello text');
  });

  it('should call mammoth for DOCX files', async () => {
    const file = new File(['fake docx'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    // Mock the arrayBuffer since node env might not implement it in the same way for File
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    
    const text = await extractTextFromFile(file);
    expect(text).toBe('Parsed DOCX content');
  });

  it('should parse PDF files', async () => {
    const file = new File(['fake pdf'], 'test.pdf', { type: 'application/pdf' });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    
    const text = await extractTextFromFile(file);
    // Based on the mock, it returns "Parsed PDF content\n"
    expect(text).toContain('Parsed PDF content');
  });

  it('should reject unsupported file types', async () => {
    const file = new File(['fake'], 'test.csv', { type: 'text/csv' });
    await expect(extractTextFromFile(file)).rejects.toThrow('Unsupported file type: text/csv');
  });
});
