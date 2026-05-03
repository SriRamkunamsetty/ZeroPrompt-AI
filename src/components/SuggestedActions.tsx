import React from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

interface Action {
  title: string;
  action: string;
}

interface SuggestedActionsProps {
  contentType?: string;
  actions: Action[];
  explanation?: string;
  onActionClick: (action: string) => void;
}

export function SuggestedActions({ contentType, actions, explanation, onActionClick }: SuggestedActionsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100 shadow-sm transition-all hover:shadow-md"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="font-semibold text-gray-900">
              AI Suggested Actions {contentType ? `for ${contentType} Content` : ''}
            </h3>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-6">
          {actions.map((actionItem, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="bg-white hover:bg-indigo-600 hover:text-white transition-all duration-300 border-indigo-200 shadow-sm hover:shadow group focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              onClick={() => onActionClick(actionItem.action)}
              aria-label={`Execute suggestion: ${actionItem.title}`}
            >
              {actionItem.title}
              <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
            </Button>
          ))}
        </div>

        {explanation && (
          <div className="mt-4 p-4 bg-white/60 rounded-lg border border-indigo-100 backdrop-blur-sm">
            <h4 className="flex items-center text-sm font-semibold text-indigo-900 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mr-2" />
              Why these suggestions?
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explanation}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
