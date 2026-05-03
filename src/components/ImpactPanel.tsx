import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';

export const ImpactPanel = React.memo(function ImpactPanel() {
  const impacts = [
    { label: 'Democratizes AI access for non-technical users', icon: <Users className="w-5 h-5 text-purple-500" /> },
    { label: 'Saves 3+ hours weekly per employee in reading time', icon: <Clock className="w-5 h-5 text-blue-500" /> },
    { label: 'Eliminates error-prone copy/pasting via structural UI', icon: <Target className="w-5 h-5 text-emerald-500" /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm"
    >
      <div className="flex items-center mb-5">
        <TrendingUp className="w-5 h-5 text-gray-700 mr-2" />
        <h3 className="font-semibold text-gray-900">Why this matters (Real-world Impact)</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {impacts.map((impact, idx) => (
          <div key={idx} className="flex flex-col items-center text-center p-5 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              {impact.icon}
            </div>
            <p className="text-sm font-medium text-gray-700">{impact.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
