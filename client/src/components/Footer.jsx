import React from 'react';
import { Shield, Sparkles, BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-noir-950 py-8 mt-auto text-slate-400 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500/70" />
          <span>Server-Enforced Secrecy &bull; Autoritative Scoring &bull; Gemini 2.0 AI</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>AI Mystery Investigation Game &bull; V1.0</span>
        </div>
      </div>
    </footer>
  );
}

