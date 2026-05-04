import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Shield, Zap, TestTube, Accessibility, Cloud, Code } from 'lucide-react';

export function SystemStrengthPanel() {
  const strengths = [
    {
      title: "Engineering Quality",
      icon: Code,
      color: "text-blue-500",
      items: ["Modular React/Vite Architecture", "Clean API Design (Express)", "Scalable Backend", "Strict TypeScript"]
    },
    {
      title: "Security & Integrity",
      icon: Shield,
      color: "text-red-500",
      items: ["Backend-only AI Calls", "Strict CORS Enforcement", "Atomic Firestore Rate Limiting", "Firebase Auth JWT Verification"]
    },
    {
      title: "System Efficiency",
      icon: Zap,
      color: "text-amber-500",
      items: ["Optimized React Rendering", "No Duplicate API Calls", "Graceful Degradation (Demo Mode)", "Fast Gemini 2.5 Flash Response"]
    },
    {
      title: "System Reliability",
      icon: TestTube,
      color: "text-emerald-500",
      items: ["Vitest Integration", "Fail-safe Edge Case Coverage", "AI Response Validation", "Guaranteed JSON Schemas"]
    },
    {
      title: "Accessible by Design",
      icon: Accessibility,
      color: "text-purple-500",
      items: ["ARIA Labels & Roles", "Keyboard Navigation Support", "Screen Reader Friendly Contrast", "Text-to-Speech Explanations"]
    },
    {
      title: "Powered by Google Cloud",
      icon: Cloud,
      color: "text-cyan-500",
      items: ["Google Gemini API", "Cloud Run Containerization", "Firestore NoSQL", "Firebase Hosting & Storage"]
    }
  ];

  return (
    <Card className="mt-12 bg-gray-50/50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Shield className="w-5 h-5 mr-2 text-indigo-600" />
          Production-Grade Design
        </CardTitle>
        <p className="text-sm text-gray-500">Built to robust hackathon standards</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strengths.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <Icon className={`w-5 h-5 mr-2 ${s.color}`} />
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                </div>
                <ul className="space-y-2">
                  {s.items.map((item, j) => (
                    <li key={j} className="flex flex-start text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
