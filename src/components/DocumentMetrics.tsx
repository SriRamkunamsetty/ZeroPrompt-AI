import React from 'react';
import { motion } from 'motion/react';
import { Clock, Database, CheckCircle, Zap } from 'lucide-react';

interface MetricsProps {
  metrics: {
    timeMs: number;
    tokens: number;
    cost: string;
    confidence: number;
    cached: boolean;
  };
}

export const DocumentMetrics = React.memo(function DocumentMetrics({ metrics }: MetricsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
    >
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
        <div className="flex items-center text-gray-500 mb-1 text-sm">
          <Clock className="w-4 h-4 mr-2" />
          Processing Time
        </div>
        <div className="text-xl font-bold text-gray-900">{metrics.timeMs}ms</div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
        <div className="flex items-center text-gray-500 mb-1 text-sm">
          <Database className="w-4 h-4 mr-2" />
          Estimated Tokens
        </div>
        <div className="text-xl font-bold text-gray-900" title={`Estimated Cost: $${metrics.cost}`}>
          ~{metrics.tokens.toLocaleString()}
        </div>
      </div>
      <div className={`p-4 rounded-xl shadow-sm border flex flex-col transition-all hover:shadow-md ${metrics.cached ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center text-gray-500 mb-1 text-sm">
          <Zap className={`w-4 h-4 mr-2 ${metrics.cached ? 'text-amber-500' : 'text-gray-400'}`} />
          Cache Hit
        </div>
        <div className={`text-xl font-bold ${metrics.cached ? 'text-amber-600' : 'text-gray-900'}`}>
          {metrics.cached ? 'Yes (0 API Cost)' : 'No'}
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
        <div className="flex items-center text-gray-500 mb-1 text-sm">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
          AI Confidence
        </div>
        <div className="flex items-center">
          <div className="text-xl font-bold text-emerald-600 mr-2">{metrics.confidence}%</div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(0, metrics.confidence))}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
});
