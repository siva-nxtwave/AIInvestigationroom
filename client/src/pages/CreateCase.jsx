import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FilePlus,
  ArrowLeft,
  Search,
  Sparkles,
  Users,
  KeyRound,
  HelpCircle,
  Award,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { api } from '../api/client.js';
import { LoadingIndicator } from '../components/LoadingIndicator.jsx';
import { ErrorMessage } from '../components/ErrorMessage.jsx';

const DIFFICULTY_DETAILS = {
  easy: {
    label: 'Easy',
    suspects: 3,
    clues: 5,
    hints: 2,
    bonus: 100,
    desc: 'Ideal for novice sleuths. Clear inconsistencies and direct evidence.',
    color: 'emerald',
  },
  medium: {
    label: 'Medium',
    suspects: 4,
    clues: 7,
    hints: 3,
    bonus: 150,
    desc: 'A tangled web of alibis. Requires cross-referencing timestamps and physical clues.',
    color: 'amber',
  },
  hard: {
    label: 'Hard',
    suspects: 5,
    clues: 9,
    hints: 3,
    bonus: 200,
    desc: 'Subtle contradictions, conflicting testimonies, and deceptive motives.',
    color: 'rose',
  },
};

const SUGGESTED_PREMISES = [
  'A priceless diamond pendant goes missing from a secure vault during an aristocratic masquerade ball.',
  'The chief curator of the antiquity museum is found locked in the mummy vault without the master key.',
  'During a severe blizzard at an isolated mountain chalet, the wealthy patriarch is found poisoned in his study.',
  'An experimental AI server chip is stolen from a silicon lab right before the morning product launch.',
];

export function CreateCase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [premise, setPremise] = useState(searchParams.get('premise') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || 'medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const qPremise = searchParams.get('premise');
    const qDiff = searchParams.get('difficulty');
    if (qPremise) setPremise(qPremise);
    if (qDiff && ['easy', 'medium', 'hard'].includes(qDiff.toLowerCase())) {
      setDifficulty(qDiff.toLowerCase());
    }
  }, [searchParams]);

  const trimmed = premise.trim();
  const charCount = trimmed.length;
  const isTooShort = charCount > 0 && charCount < 20;
  const isTooLong = charCount > 500;
  const isValid = charCount >= 20 && charCount <= 500;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.createCase(trimmed, difficulty);
      const caseId = response?.case?.id;
      if (caseId) {
        navigate(`/case/${caseId}`);
      } else {
        throw new Error('Server did not return a valid case identifier.');
      }
    } catch (err) {
      console.error('Case generation failed:', err);
      setError({
        code: err.code || 'AI_GENERATION_FAILED',
        message: err.message || "We couldn't generate a valid mystery. Please try again or modify your premise.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="dossier-card rounded-2xl p-6 sm:p-12 border border-amber-500/30">
          <LoadingIndicator title="Opening New Investigation File..." />
        </div>
      </div>
    );
  }

  const currentDiff = DIFFICULTY_DETAILS[difficulty] || DIFFICULTY_DETAILS.medium;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home Desk</span>
        </Link>
      </div>

      <div className="dossier-card rounded-2xl p-6 sm:p-10 border border-slate-800 space-y-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <FilePlus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">File Inception</span>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-slate-100">Commission a New Mystery</h1>
          </div>
        </div>

        {error && (
          <ErrorMessage
            error={error}
            onRetry={handleSubmit}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Premise Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="premiseInput" className="font-serif font-bold text-slate-200 text-base">
                Case Premise or Incident Summary
              </label>
              <span
                className={`text-xs font-mono ${
                  charCount === 0
                    ? 'text-slate-400'
                    : isTooShort || isTooLong
                    ? 'text-rose-400 font-bold'
                    : 'text-amber-400'
                }`}
              >
                {charCount}/500 chars (min 20)
              </span>
            </div>

            <textarea
              id="premiseInput"
              rows={4}
              value={premise}
              onChange={e => setPremise(e.target.value)}
              placeholder="e.g. A priceless sapphire necklace vanishes from Lord Sterling's locked penthouse suite while twenty distinguished guests dine in the adjoining room..."
              className="w-full rounded-xl bg-noir-900 border border-slate-700 p-4 text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm leading-relaxed transition-all resize-y"
              disabled={loading}
              required
            />

            {/* Validation helper message */}
            {isTooShort && (
              <p className="text-xs text-rose-400 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>The premise must be at least 20 characters long to provide sufficient story context.</span>
              </p>
            )}
            {isTooLong && (
              <p className="text-xs text-rose-400 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Premise exceeds the maximum length of 500 characters.</span>
              </p>
            )}

            {/* Quick Suggestion Chips */}
            <div className="pt-2">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Or select a classic mystery trope to get started:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PREMISES.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPremise(s)}
                    className="text-xs text-left px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors"
                  >
                    &ldquo;{s.slice(0, 50)}...&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="space-y-4">
            <label className="font-serif font-bold text-slate-200 text-base block">
              Investigative Difficulty Level
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(DIFFICULTY_DETAILS).map(([key, details]) => {
                const isSelected = difficulty === key;
                return (
                  <div
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`cursor-pointer rounded-xl p-5 border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                        : 'bg-noir-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-serif font-bold text-lg text-slate-100">{details.label}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                          +{details.bonus} PTS
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">{details.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">SUSPECTS</span>
                        <span className="text-slate-200 font-bold">{details.suspects}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">CLUES</span>
                        <span className="text-slate-200 font-bold">{details.clues}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">HINTS</span>
                        <span className="text-slate-200 font-bold">{details.hints}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Case Summary Pill */}
          <div className="p-4 rounded-xl bg-noir-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <strong>{currentDiff.suspects}</strong> Suspects Lineup
              </span>
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <strong>{currentDiff.clues}</strong> Hidden Clues (+5 pts ea)
              </span>
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <strong>{currentDiff.hints}</strong> Available Hints (-10 pts ea)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Award className="w-4 h-4" />
              <span>Correct Accusation Bonus: <strong>+{currentDiff.bonus} pts</strong></span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <Link
              to="/"
              className="text-xs font-mono text-slate-400 hover:text-slate-300 transition-colors"
            >
              Cancel and Return
            </Link>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-noir-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5" />
              <span>Generate Mystery</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

