import React, { useState, useEffect } from 'react';
import { Search, FileSearch, Sparkles } from 'lucide-react';

export function LoadingIndicator({ title = 'Building your case file...' }) {
  const steps = [
    'Securing the crime scene perimeter...',
    'Interviewing first responders and witnesses...',
    'Cataloging physical evidence and forensic traces...',
    'Reviewing suspect timelines and alibis...',
    'Gemini AI is assembling a fair, solvable puzzle...',
    'Sealing the authoritative solution on the server...',
  ];

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex(prev => (prev + 1) % steps.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-500 animate-pulse">
          <FileSearch className="w-8 h-8" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-amber-500 flex items-center justify-center text-amber-400 animate-spin">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <h3 className="font-serif font-bold text-xl text-slate-100 mb-2">{title}</h3>
      <p className="text-sm font-mono text-amber-400 min-h-[1.5rem] transition-opacity duration-300">
        &bull; {steps[stepIndex]}
      </p>

      <div className="w-48 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 animate-[shimmer_2s_infinite]" />
      </div>
    </div>
  );
}

