import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Wand2, Activity, Target, Clock, ArrowRight, Layers, CheckCircle } from 'lucide-react';
import { runGuidedWizard } from '../services/ai_service';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error';

const GOALS = [
  'Launch a new business',
  'Learn a new skill',
  'Organize an event',
  'Plan a vacation',
  'Build a software app',
  'Improve personal health'
];

const SCOPES = [
  'Small & Simple (Just the basics)',
  'Medium (Standard features, balanced)',
  'Large & Complex (Extensive details)',
  'Massive Enterprise Scale'
];

const URGENCIES = [
  'Very Urgent (Under 1 week)',
  'Fast (1 - 4 weeks)',
  'Standard (1 - 3 months)',
  'Long-term (3+ months)'
];

export function GuidedWizard() {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({ goal: '', scope: '', urgency: '' });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSelect = (key: keyof typeof selections, value: string) => {
    setSelections({ ...selections, [key]: value });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const saveHistory = async (status: string, analysisResult?: any) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/history`), {
        userId: auth.currentUser.uid,
        type: 'wizard',
        fileName: 'Goal: ' + selections.goal,
        status,
        result: analysisResult || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/history`, auth);
    }
  };

  const handleGenerate = async () => {
    setAnalyzing(true);
    setStep(4);
    setError('');

    try {
      const data = await runGuidedWizard(selections.goal, selections.scope, selections.urgency);
      setResult(data);
      setStep(5);
      await saveHistory('completed', data);
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
      setStep(3); // Go back if fail
      await saveHistory('failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600 mb-4 shadow-sm border border-orange-200">
          <Wand2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Guided Vision Planner</h1>
        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          No typing required. Just make a few structural choices, and our AI will build a comprehensive, step-by-step master plan for you.
        </p>
      </div>

      <div className="mb-8">
        <Progress value={(step / 5) * 100} className="h-2 bg-orange-100" />
        <div className="flex justify-between text-xs font-medium text-gray-400 mt-2">
          <span className={step >= 1 ? 'text-orange-600' : ''}>Goal</span>
          <span className={step >= 2 ? 'text-orange-600' : ''}>Scope</span>
          <span className={step >= 3 ? 'text-orange-600' : ''}>Timeline</span>
          <span className={step >= 4 ? 'text-orange-600' : ''}>Generation</span>
          <span className={step >= 5 ? 'text-orange-600' : ''}>Result</span>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-white">
        {step === 1 && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <CardHeader className="text-center pb-2">
              <Target className="w-10 h-10 mx-auto text-orange-500 mb-2" />
              <CardTitle className="text-2xl">What is your primary goal?</CardTitle>
              <CardDescription>Select the path that matches what you want to accomplish.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GOALS.map(g => (
                  <button
                    key={g}
                    onClick={() => handleSelect('goal', g)}
                    className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${
                      selections.goal === g 
                        ? 'border-orange-500 bg-orange-50 text-orange-900' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 flex justify-end p-6 rounded-b-xl">
              <Button onClick={nextStep} disabled={!selections.goal} className="bg-orange-600 hover:bg-orange-700">
                Continue Setup <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <CardHeader className="text-center pb-2">
              <Layers className="w-10 h-10 mx-auto text-orange-500 mb-2" />
              <CardTitle className="text-2xl">Determine the Scale</CardTitle>
              <CardDescription>How big is this operation?</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                {SCOPES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSelect('scope', s)}
                    className={`p-5 rounded-xl border-2 text-center font-medium transition-all ${
                      selections.scope === s 
                        ? 'border-orange-500 bg-orange-50 text-orange-900' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 flex justify-between p-6 rounded-b-xl">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button onClick={nextStep} disabled={!selections.scope} className="bg-orange-600 hover:bg-orange-700">
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <CardHeader className="text-center pb-2">
              <Clock className="w-10 h-10 mx-auto text-orange-500 mb-2" />
              <CardTitle className="text-2xl">Set the Timeline</CardTitle>
              <CardDescription>When does this need to be finished?</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                {URGENCIES.map(u => (
                  <button
                    key={u}
                    onClick={() => handleSelect('urgency', u)}
                    className={`p-5 rounded-xl border-2 text-center font-medium transition-all ${
                      selections.urgency === u 
                        ? 'border-orange-500 bg-orange-50 text-orange-900' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              {error && <p className="text-center text-red-600 mt-4 text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="bg-gray-50 flex justify-between p-6 rounded-b-xl">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button onClick={handleGenerate} disabled={!selections.urgency} className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-md">
                <Wand2 className="w-4 h-4 mr-2" /> Generate Master Plan
              </Button>
            </CardFooter>
          </div>
        )}

        {step === 4 && analyzing && (
          <div className="p-16 text-center animate-pulse">
            <Activity className="w-16 h-16 mx-auto text-orange-400 mb-6 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Designing your roadmap...</h2>
            <p className="text-gray-500">Connecting priorities, mapping resources, and defining phases.</p>
          </div>
        )}

        {step === 5 && result && (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8 text-center">
                <h2 className="text-xl font-bold text-orange-900 mb-2">{result.overview}</h2>
                <div className="inline-flex items-center text-sm font-medium text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4 mr-1.5" />
                  Estimated Time: {result.estimatedDuration}
                </div>
              </div>

              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                {result.phases?.map((phase: any, idx: number) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-orange-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <span className="font-bold text-sm">{idx + 1}</span>
                    </div>
                    
                    <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] shadow-sm hover:shadow-md transition-shadow border-gray-200">
                      <CardHeader className="bg-gray-50 pb-4 border-b">
                        <CardTitle className="text-lg text-gray-900">{phase.name}</CardTitle>
                        <CardDescription className="text-gray-600 mt-1">{phase.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {phase.tasks.map((task: string, tIdx: number) => (
                            <li key={tIdx} className="flex items-start text-sm text-gray-700 bg-white border rounded-md p-3">
                              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 mr-2 shrink-0" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <Button variant="outline" onClick={() => { setStep(1); setSelections({goal:'', scope:'', urgency:''}); setResult(null); }}>
                  Create Another Plan
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
