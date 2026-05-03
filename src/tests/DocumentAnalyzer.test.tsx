import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { DocumentAnalyzer } from '../pages/DocumentAnalyzer';

vi.mock('pdfjs-dist', () => ({
  version: 'mock-version',
  GlobalWorkerOptions: { workerSrc: '' },
}));

// Mocks to prevent auth and db errors
vi.mock('../lib/firebase', () => ({
  auth: { currentUser: { uid: '123' } },
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ empty: true }),
  query: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(),
  limit: vi.fn()
}));

describe('DocumentAnalyzer Upload Validation', () => {
  it('should reject invalid file types', () => {
    render(<DocumentAnalyzer />);
    
    const uploader = document.getElementById('file-upload') as HTMLInputElement;
    const file = new File(['dummy'], 'image.png', { type: 'image/png' });
    
    fireEvent.change(uploader, { target: { files: [file] } });
    
    // Check for error message
    expect(screen.getByText(/Unsupported file format/i)).toBeTruthy();
  });

  it('should reject files over 5MB', () => {
    render(<DocumentAnalyzer />);
    
    const uploader = document.getElementById('file-upload') as HTMLInputElement;
    
    // Create a 6MB file mock
    const largeContent = new ArrayBuffer(6 * 1024 * 1024);
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    
    fireEvent.change(uploader, { target: { files: [file] } });
    
    expect(screen.getByText(/File size must be strictly under 5MB/i)).toBeTruthy();
  });

  it('should accept valid PDF under 5MB', () => {
    render(<DocumentAnalyzer />);
    
    const uploader = document.getElementById('file-upload') as HTMLInputElement;
    
    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(uploader, { target: { files: [file] } });
    
    // The error message should NOT be present.
    // Instead we should ideally see the file name rendered if accepted.
    expect(screen.queryByText(/Unsupported file format/i)).toBeNull();
    expect(screen.queryByText(/strictly under 5MB/i)).toBeNull();
    
    // Check if file name is rendered
    expect(screen.getByText('test.pdf')).toBeTruthy();
  });
});
