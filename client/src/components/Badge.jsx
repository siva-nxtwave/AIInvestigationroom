import React from 'react';

export function DifficultyBadge({ difficulty }) {
  const styles = {
    easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    hard: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  const labels = {
    easy: 'Easy Case',
    medium: 'Medium Case',
    hard: 'Hard Case',
  };

  const style = styles[difficulty] || styles.medium;
  const label = labels[difficulty] || difficulty;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border uppercase tracking-wider ${style}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      Active Investigation
    </span>
  );
}

