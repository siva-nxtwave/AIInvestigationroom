import React, { useState } from 'react';
import { UserCheck, AlertOctagon, CheckCircle2, X } from 'lucide-react';

export function AccusationModal({ isOpen, onClose, suspects = [], onSubmit, submitting }) {
  const [selectedSuspectId, setSelectedSuspectId] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleAccuse = e => {
    e.preventDefault();
    if (!selectedSuspectId || submitting) return;
    onSubmit(selectedSuspectId);
  };

  const selectedSuspect = suspects.find(s => s.id === selectedSuspectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-noir-900 border border-amber-500/30 shadow-2xl p-6 sm:p-8 my-8 text-slate-100">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Close Accusation Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-rose-400 uppercase tracking-widest">Formal Indictment</span>
            <h2 className="font-serif font-bold text-2xl text-slate-100">Submit Your Accusation</h2>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm">
          <p className="font-semibold mb-1">FINAL DECISION NOTICE:</p>
          <p className="text-amber-300/80">
            Submitting this accusation concludes the investigation and seals the case record. The server will calculate your final score and reveal the true culprit immediately.
          </p>
        </div>

        {/* Suspect Selection */}
        <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
          <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
            Select the Prime Culprit:
          </label>
          {suspects.map(suspect => {
            const isSelected = selectedSuspectId === suspect.id;
            return (
              <div
                key={suspect.id}
                onClick={() => setSelectedSuspectId(suspect.id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer flex items-start gap-4 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'border-amber-500 bg-amber-500 text-noir-950' : 'border-slate-600'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-slate-100 text-base">{suspect.name}</h4>
                    <span className="text-xs font-mono text-slate-400">ID: {suspect.id}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{suspect.description}</p>
                  <p className="text-xs text-amber-400/80 italic mt-1">&ldquo;{suspect.alibi}&rdquo;</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirmation Checkbox */}
        <div className="mb-6 flex items-start gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <input
            type="checkbox"
            id="confirmAccusation"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            disabled={!selectedSuspectId || submitting}
            className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
          />
          <label htmlFor="confirmAccusation" className="text-xs text-slate-300 cursor-pointer">
            I have analyzed the evidence, broken the alibis, and I am certain of accusing{' '}
            <strong className="text-amber-400">
              {selectedSuspect ? selectedSuspect.name : 'a suspect'}
            </strong>.
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Return to Case File
          </button>
          <button
            type="button"
            onClick={handleAccuse}
            disabled={!selectedSuspectId || !confirmed || submitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>{submitting ? 'Verifying Accusation...' : 'Issue Final Warrant'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

