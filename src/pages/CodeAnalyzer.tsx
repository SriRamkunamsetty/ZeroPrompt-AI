import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Code2, Github, AlertTriangle, Lightbulb, Zap } from 'lucide-react';
import { analyzeCode } from '../services/ai_service';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error';

export function CodeAnalyzer() {
  const [code, setCode] = useState('');
  const [fileName, setFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const saveHistory = async (status: string, analysisResult?: any) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/history`), {
        userId: auth.currentUser.uid,
        type: 'code',
        fileName: fileName || 'snippet.txt',
        codeLength: code.length,
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
    if (!auth.currentUser || !code.trim()) return null;
    try {
      const q = query(
        collection(db, `users/${auth.currentUser.uid}/history`),
        where('codeLength', '==', code.length),
        where('type', '==', 'code'),
        where('status', '==', 'completed'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      // For code, we want a bit more assurance, but length + filename is okay for free tier hackathon
      const match = snapshot.docs.find(doc => doc.data().fileName === (fileName || 'snippet.txt'));
      if (match) return match.data().result;
    } catch (err) {
      console.warn("Code cache check failed", err);
    }
    return null;
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }
    setAnalyzing(true);
    setProgress(20);
    setError('');

    try {
      setProgress(30);
      const cached = await checkCache();
      if (cached) {
        setResult(cached);
        setProgress(100);
        setAnalyzing(false);
        return;
      }

      setProgress(50);
      const data = await analyzeCode(code, fileName || 'snippet.txt');
      setProgress(90);
      setResult(data);
      await saveHistory('completed', data);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
      await saveHistory('failed');
    } finally {
      setTimeout(() => setAnalyzing(false), 500);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Code Analyzer</h1>
        <p className="mt-2 text-lg text-gray-600">Drop in your code to instantly spot bugs, find vulnerabilities, and get plain-English explanations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-full flex flex-col shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-sm font-medium flex items-center text-gray-700">
                <Github className="w-4 h-4 mr-2" />
                Input Source
              </CardTitle>
            </div>
            <input
              type="text"
              placeholder="Filename (optional, e.g., app.py)"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 text-sm border font-mono rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Code filename"
            />
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <textarea
              className="w-full flex-1 min-h-[400px] p-4 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] focus:outline-none resize-y"
              placeholder="Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              aria-label="Code editor"
            />
            <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
              {error && <span className="text-xs text-red-600">{error}</span>}
              {!error && <span className="text-xs text-gray-500">{code.length} characters</span>}
              <Button 
                onClick={handleAnalyze} 
                disabled={!code.trim() || analyzing}
                className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
              >
                {analyzing ? 'Scanning...' : 'Review Code'}
              </Button>
            </div>
            {analyzing && (
              <Progress value={progress} className="h-1 rounded-none bg-purple-100" />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!result && !analyzing && (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400 border-dashed border-2 bg-gray-50/50">
              <Code2 className="w-16 h-16 mb-4 text-gray-300" />
              <p>Analysis insights will appear here.</p>
            </Card>
          )}

          {result && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-700 h-full overflow-y-auto pr-2" aria-live="polite">
              <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center text-purple-900">
                      <Zap className="w-5 h-5 mr-2 text-purple-500" />
                      Code Summary
                    </CardTitle>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-bold font-mono text-purple-600">{result.qualityScore}</span>
                      <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">Quality Score</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{result.explanation}</p>
                </CardContent>
              </Card>

              {result.bugs && result.bugs.length > 0 && (
                <Card className="border-red-200 bg-red-50/30">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center text-red-800">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                      Bugs & Vulnerabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.bugs.map((bug: string, idx: number) => (
                        <li key={idx} className="flex items-start text-sm">
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 mt-2 mr-3"></span>
                          <span className="text-gray-800 bg-white px-3 py-2 rounded-md shadow-sm border border-red-100 flex-1">{bug}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {result.improvements && result.improvements.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center text-amber-800">
                      <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                      Suggested Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.improvements.map((imp: string, idx: number) => (
                        <li key={idx} className="flex items-start text-sm">
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-3"></span>
                          <span className="text-gray-800 bg-white px-3 py-2 rounded-md shadow-sm border border-amber-100 flex-1">{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
