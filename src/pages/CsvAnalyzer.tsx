import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table as TableIcon, UploadCloud, TrendingUp, BarChart, FileSpreadsheet } from 'lucide-react';
import { analyzeCsvData } from '../services/ai_service';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import Papa from 'papaparse';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend
);

export function CsvAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024 || !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file under 5MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const saveHistory = async (status: string, analysisResult?: any) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/history`), {
        userId: auth.currentUser.uid,
        type: 'csv',
        fileName: file?.name,
        status,
        result: analysisResult || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/history`, auth);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setAnalyzing(true);
    setProgress(10);
    setError('');

    // Parse CSV to get raw text
    Papa.parse(file, {
      complete: async (results) => {
        setProgress(30);
        const textData = file.name + '\\n' + Papa.unparse(results.data.slice(0, 100)); // Send title and first 100 rows for context
        try {
          setProgress(60);
          const aiData = await analyzeCsvData(textData);
          setProgress(90);
          setResult(aiData);
          await saveHistory('completed', aiData);
          setProgress(100);
        } catch (err: any) {
          setError(err.message || 'Analysis failed. Please try again.');
          await saveHistory('failed');
        } finally {
          setTimeout(() => setAnalyzing(false), 500);
        }
      },
      error: (err) => {
        setError(err.message);
        setAnalyzing(false);
      }
    });
  };

  const renderChart = (chartConfig: any) => {
    const data = {
      labels: chartConfig.labels,
      datasets: [
        {
          label: chartConfig.datasetLabel || 'Data',
          data: chartConfig.data,
          backgroundColor: [
            'rgba(16, 185, 129, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(139, 92, 246, 0.6)',
            'rgba(236, 72, 153, 0.6)',
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(59, 130, 246)',
            'rgb(245, 158, 11)',
            'rgb(139, 92, 246)',
            'rgb(236, 72, 153)',
          ],
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
        title: { display: true, text: chartConfig.title },
      },
    };

    if (chartConfig.type === 'line') return <Line options={options} data={data} />;
    if (chartConfig.type === 'pie') return <Pie options={options} data={data} />;
    return <Bar options={options} data={data} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">CSV Analyzer</h1>
        <p className="mt-2 text-lg text-gray-600">Upload a spreadsheet and get instant charts, trends, and visual insights.</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gray-50 transition-colors hover:bg-gray-100">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="csv-upload"
              onChange={handleFileChange}
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">Click to upload CSV</p>
                <p className="text-sm text-gray-500">Max size 5MB</p>
              </div>
            </label>

            {file && (
              <div className="mt-6 flex items-center space-x-3 bg-white px-4 py-3 rounded-lg shadow-sm w-full max-w-md border">
                <TableIcon className="w-6 h-6 text-emerald-500" />
                <span className="flex-1 truncate font-medium text-sm">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
              </div>
            )}
            
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleAnalyze} 
              disabled={!file || analyzing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]"
            >
              {analyzing ? 'Visualizing Data...' : 'Analyze Data'}
            </Button>
          </div>

          {analyzing && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Parsing metrics and discovering patterns...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-emerald-100" />
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700" aria-live="polite">
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BarChart className="w-6 h-6 text-emerald-500 mr-2" />
                Data Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-lg leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.charts?.map((chart: any, idx: number) => (
              <Card key={idx} className="shadow-sm">
                <CardContent className="p-6">
                  {renderChart(chart)}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                Key Trends & Observations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {result.trends?.map((trend: string, idx: number) => (
                  <li key={idx} className="flex items-start bg-gray-50 p-4 rounded-lg border">
                    <span className="text-gray-700 font-medium">{trend}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
