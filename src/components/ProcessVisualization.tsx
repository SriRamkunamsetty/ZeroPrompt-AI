import React from 'react';
import { motion } from 'motion/react';
import { FileSearch, BrainCircuit, Sparkles, LayoutList } from 'lucide-react';

interface ProcessVisualizationProps {
  progress: number;
}

export function ProcessVisualization({ progress }: ProcessVisualizationProps) {
  const steps = [
    { label: 'Extracting Text', icon: <FileSearch className="w-5 h-5" />, threshold: 20 },
    { label: 'Analyzing Context', icon: <BrainCircuit className="w-5 h-5" />, threshold: 40 },
    { label: 'Generating Insights', icon: <Sparkles className="w-5 h-5" />, threshold: 70 },
    { label: 'Structuring Output', icon: <LayoutList className="w-5 h-5" />, threshold: 90 },
  ];

  return (
    <div className="w-full mt-8 p-6 bg-gray-50 border rounded-xl">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-6">AI Processing Flow</h3>
      <div className="relative flex justify-between items-center w-full">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full" />
        <motion.div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
        
        {steps.map((step, idx) => {
          const isActive = progress >= step.threshold;
          const isCurrent = progress >= step.threshold && progress < (steps[idx+1]?.threshold || 100);
          
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <motion.div 
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                }`}
                animate={{
                  scale: isCurrent ? 1.2 : 1,
                  boxShadow: isCurrent ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none'
                }}
              >
                {step.icon}
              </motion.div>
              <div className="absolute top-12 whitespace-nowrap text-xs font-medium text-gray-600">
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-12 text-center text-sm font-medium text-blue-600 animate-pulse">
        {progress < 100 ? 'Processing document...' : 'Complete!'}
      </div>
    </div>
  );
}
