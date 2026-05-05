import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CsvAnalyzer } from '../pages/CsvAnalyzer';
import { BrowserRouter } from 'react-router';
import { analyzeCsvData } from '../services/ai_service';
import { auth } from '../lib/firebase';

// Mock dependencies
jest.mock('../services/ai_service');
jest.mock('../lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-user' } },
  db: {}
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  limit: jest.fn()
}));

const mockAnalyzeCsvData = analyzeCsvData as jest.Mock;

describe('CsvAnalyzer', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <CsvAnalyzer />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload area', () => {
    renderComponent();
    expect(screen.getByText(/Click to upload CSV/i)).toBeInTheDocument();
  });

  test('shows error if no file selected', async () => {
    renderComponent();
    const button = screen.getByText(/Analyze Data/i);
    fireEvent.click(button);
    // Button is disabled by default if no file
    expect(button).toBeDisabled();
  });

  test('handles file upload and analysis flow', async () => {
    mockAnalyzeCsvData.mockResolvedValueOnce({
      summary: 'Test summary',
      trends: ['Trend 1'],
      charts: [{ title: 'Chart 1', type: 'bar', labels: ['A'], data: [1] }]
    });

    renderComponent();
    
    const file = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Upload a CSV spreadsheet/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText('test.csv')).toBeInTheDocument();
    
    const button = screen.getByText(/Analyze Data/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Test summary')).toBeInTheDocument();
      expect(screen.getByText('Trend 1')).toBeInTheDocument();
    });
  });
});
