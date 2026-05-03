import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Table, Code2, Wand2, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/error';

interface HistoryItem {
  id: string;
  type: string;
  status: string;
  createdAt: any;
  fileName?: string;
  result?: any;
}

export function Dashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, `users/${auth.currentUser.uid}/history`),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as HistoryItem[];
        setHistory(items);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser.uid}/history`, auth);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const tools = [
    {
      title: 'Document Intelligence',
      description: 'Automatically extract insights, summaries, and quizzes from PDFs and text files.',
      icon: FileText,
      path: '/document',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'CSV Analyzer',
      description: 'Upload spreadsheets to instantly generate charts, trends, and data insights.',
      icon: Table,
      path: '/csv',
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Code Analyzer',
      description: 'Drop in your code to find bugs, get explanations, and discover improvements.',
      icon: Code2,
      path: '/code',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'Guided Wizard',
      description: 'A step-by-step assistant that helps you achieve goals without writing prompts.',
      icon: Wand2,
      path: '/wizard',
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome to ZeroPrompt</h1>
        <p className="mt-2 text-lg text-gray-600">Choose a smart tool below. We will handle the prompts for you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.path} to={tool.path}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-gray-200">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${tool.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-sm mt-2 text-gray-600">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-500" />
          Recent Interactions
        </h2>
        
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p>No history yet. Try using one of the tools above!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {history.map((item) => (
                  <li key={item.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {item.type} Analysis
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {item.fileName || 'Untitled File'}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium mr-4 ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                      {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
