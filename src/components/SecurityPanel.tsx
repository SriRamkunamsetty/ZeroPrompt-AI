import React from 'react';
import { motion } from 'motion/react';
import { Shield, Check, Lock, Server, FileCheck, Key } from 'lucide-react';

export const SecurityPanel = React.memo(function SecurityPanel() {
  const securityFeatures = [
    { label: 'File constraints enforced (MIME, <5MB)', icon: <FileCheck className="w-4 h-4 text-emerald-600" /> },
    { label: 'User-isolated storage (Firebase Rules)', icon: <Lock className="w-4 h-4 text-emerald-600" /> },
    { label: 'Secure artifact storage (Firebase Storage)', icon: <Server className="w-4 h-4 text-emerald-600" /> },
    { label: 'No raw file sent to AI (Extracted text only)', icon: <Shield className="w-4 h-4 text-emerald-600" /> },
    { label: 'API keys protected via environment', icon: <Key className="w-4 h-4 text-emerald-600" /> },
    { label: 'Cloud-cached response protection', icon: <Check className="w-4 h-4 text-emerald-600" /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-6 p-5 bg-white border border-emerald-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
      tabIndex={0}
      aria-label="Security and System Integrity Information"
    >
      <div className="flex items-center mb-4 border-b border-emerald-50 pb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
          <Shield className="w-4 h-4 text-emerald-700" />
        </div>
        <h3 className="font-semibold text-gray-900">Security & System Integrity</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
        {securityFeatures.map((feature, idx) => (
          <div key={idx} className="flex items-start">
            <div className="mt-0.5 mr-2 shrink-0">{feature.icon}</div>
            <span className="text-sm text-gray-600 leading-tight">{feature.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
