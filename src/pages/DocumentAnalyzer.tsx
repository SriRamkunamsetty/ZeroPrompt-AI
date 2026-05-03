import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, UploadCloud, CheckCircle2, AlertCircle, Volume2, RefreshCw } from 'lucide-react';
import { analyzeDocumentText } from '../services/ai_service';
import { extractTextFromFile } from '../lib/file_parser';
import { db, auth, storage } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../lib/error';
import { DocumentMetrics } from '../components/DocumentMetrics';
import { ProcessVisualization } from '../components/ProcessVisualization';
import { SuggestedActions } from '../components/SuggestedActions';
import { SecurityPanel } from '../components/SecurityPanel';
import { TestingStatus } from '../components/TestingStatus';
import { BeforeAfterPanel } from '../components/BeforeAfterPanel';
import { ImpactPanel } from '../components/ImpactPanel';

export function DocumentAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const validMimeTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      const fileType = selectedFile.type;
      const isDocxExt = selectedFile.name.endsWith('.docx');
      
      const isValid = validMimeTypes.includes(fileType) || isDocxExt;

      if (!isValid) {
        setError('Unsupported file format. Please upload PDF, TXT, or DOCX files only.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be strictly under 5MB.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const uploadFileToStorage = async (): Promise<string | null> => {
    if (!auth.currentUser || !file) return null;
    try {
      const storageRef = ref(storage, `users/${auth.currentUser.uid}/uploads/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.warn("Failed to upload to storage", err);
      return null;
    }
  };

  const saveHistory = async (status: string, analysisResult?: any, fileUrl?: string | null) => {
    if (!auth.currentUser || !file) return;
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/history`), {
        userId: auth.currentUser.uid,
        type: 'document',
        fileName: file.name,
        fileSize: file.size,
        fileUrl: fileUrl || null,
        status,
        result: analysisResult || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/history`, auth);
    }
  };

  const checkCache = async () => {
    if (!auth.currentUser || !file) return null;
    try {
      const q = query(
        collection(db, `users/${auth.currentUser.uid}/history`),
        where('fileName', '==', file.name),
        where('type', '==', 'document'),
        where('status', '==', 'completed'),
        limit(10) // fetch a few to find exact size match if multiple exists
      );
      const snapshot = await getDocs(q);
      const exactMatch = snapshot.docs.find(doc => doc.data().fileSize === file.size);
      if (exactMatch) {
         return exactMatch.data().result;
      }
    } catch (err) {
      // Ignoring cache fetch error
    }
    return null;
  };

  const handleActionClick = (action: string) => {
    alert(`Started action: ${action}. Implementation to be added based on product needs.`);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setProgress(10);
    setError('');

    try {
      setProgress(20);
      const cachedResult = await checkCache();
      if (cachedResult) {
        setResult({ ...cachedResult, metrics: { ...cachedResult.metrics, cached: true } });
        setProgress(100);
        setAnalyzing(false);
        return;
      }

      const uploadPromise = uploadFileToStorage();

      setProgress(40);
      const textContent = await extractTextFromFile(file);
      
      if (!textContent.trim()) {
         throw new Error('No readable text could be extracted from this document.');
      }
      
      setProgress(70);
      const data = await analyzeDocumentText(textContent);
      
      if (!data.summary || !data.keyPoints) {
        throw new Error('AI response was incomplete or malformed.');
      }
      
      setProgress(90);
      setResult(data);
      const fileUrl = await uploadPromise;
      await saveHistory('completed', data, fileUrl);
      setProgress(100);
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred during analysis.';
      if (errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        setError('Network error: Unable to reach the processing server. Please check your connection and retry.');
      } else if (errorMsg.includes('timeout') || errorMsg.includes('deadline')) {
        setError('The AI took too long to respond. The document may be too large. Please retry or upload a smaller file.');
      } else {
        setError(errorMsg);
      }
      await saveHistory('failed');
    } finally {
      setTimeout(() => setAnalyzing(false), 500);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Document Intelligence</h1>
          <p className="mt-2 text-lg text-gray-600">Upload a PDF or document and let AI extract key insights without writing prompts.</p>
        </div>
        <div className="hidden sm:flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">Systems Online</span>
          </div>
          {result?.metrics?.demoMode && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200 shadow-sm animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">Demo Mode Activated (Offline-safe fallback)</span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <div 
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-colors relative focus-within:ring-2 focus-within:ring-blue-500 focus-within:outline-none ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} ${analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
          >
            <input
              type="file"
              accept=".pdf,.txt,.docx"
              className={`absolute inset-0 w-full h-full opacity-0 ${analyzing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              id="file-upload"
              onChange={handleFileChange}
              aria-label="Upload a PDF, TXT, or DOCX document up to 5MB"
              title="Upload document"
              disabled={analyzing}
            />
            <div className="pointer-events-none flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">Click or drag to upload document</p>
                <p className="text-sm text-gray-500">PDF, TXT, DOCX up to 5MB</p>
              </div>
            </div>

            {file && (
              <div className="mt-6 flex items-center space-x-3 bg-white px-4 py-3 rounded-lg shadow-sm w-full max-w-md border">
                <FileText className="w-6 h-6 text-blue-500" />
                <span className="flex-1 truncate font-medium text-sm">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
            
            {error && (
              <div className="mt-4 flex flex-col items-start p-3 bg-red-50 text-red-700 rounded-md w-full max-w-md border border-red-200">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 bg-white text-red-700 border-red-200 hover:bg-red-50"
                  onClick={handleAnalyze}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Analysis
                </Button>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleAnalyze} 
              disabled={!file || analyzing}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
            >
              {analyzing ? 'Analyzing...' : 'Generate Insights'}
            </Button>
          </div>

          {analyzing && (
            <div className="mt-6 space-y-2">
              <ProcessVisualization progress={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {!result && !analyzing && (
        <div className="mt-8">
          <BeforeAfterPanel />
          <ImpactPanel />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <SecurityPanel />
            <TestingStatus />
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700" aria-live="polite">
          
          {result.metrics && <DocumentMetrics metrics={result.metrics} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SecurityPanel />
            <TestingStatus />
          </div>

          <Card className="border-l-4 border-l-blue-500 relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xl">
                <div className="flex items-center">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 mr-2" />
                  Executive Summary
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onClick={() => handleSpeak(result.summary || '')}
                  aria-label="Read summary aloud"
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">{result.topic}</h3>
              <p className="text-gray-700 leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>

          <SuggestedActions 
            contentType={result.detectedContentType}
            actions={result.suggestedActions}
            explanation={result.suggestionExplanation}
            onActionClick={handleActionClick}
          />

          <Card>
            <CardHeader>
              <CardTitle>Key Takeaways</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.keyPoints?.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {result.quiz && result.quiz.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Check</CardTitle>
                <CardDescription>Auto-generated quiz to test your understanding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.quiz.map((q: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-6 rounded-xl border">
                    <p className="font-medium text-gray-900 mb-4">{idx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className="px-4 py-3 bg-white border rounded-lg text-sm text-gray-700">
                          {opt}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg inline-block">
                      Answer: {q.answer}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
