import React from 'react';
import { motion } from 'motion/react';
import { FileWarning, Zap, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export const BeforeAfterPanel = React.memo(function BeforeAfterPanel() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Without ZeroPrompt */}
        <div className="p-6 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200">
          <div className="flex items-center text-gray-500 mb-4">
            <FileWarning className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Without ZeroPrompt</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start text-sm text-gray-600">
              <XCircle className="w-4 h-4 text-red-400 mr-2 shrink-0 mt-0.5" />
              Users must write perfect prompts (trial & error)
            </li>
            <li className="flex items-start text-sm text-gray-600">
              <XCircle className="w-4 h-4 text-red-400 mr-2 shrink-0 mt-0.5" />
              Unpredictable markdown outputs
            </li>
            <li className="flex items-start text-sm text-gray-600">
              <XCircle className="w-4 h-4 text-red-400 mr-2 shrink-0 mt-0.5" />
              Zero structure for downstream automation
            </li>
          </ul>
        </div>
        
        {/* With ZeroPrompt */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 relative group">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm z-10 hidden md:flex">
            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="flex items-center text-indigo-700 mb-4">
            <Zap className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">With ZeroPrompt</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start text-sm text-indigo-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" />
              Zero prompting required (Just upload)
            </li>
            <li className="flex items-start text-sm text-indigo-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" />
              Deterministic, structured JSON output
            </li>
            <li className="flex items-start text-sm text-indigo-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" />
              Intelligent suggested actions with reasoning
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
});
