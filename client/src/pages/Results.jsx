import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  XCircle,
  Award,
  RefreshCw,
  Home as HomeIcon,
  Search,
  FileText,
  KeyRound,
  Shield,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client.js';
import { DifficultyBadge } from '../components/Badge.jsx';
import { LoadingIndicator } from '../components/LoadingIndicator.jsx';
import { ErrorMessage } from '../components/ErrorMessage.jsx';

export function Results() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch case and result in parallel
      const [caseRes, resultRes] = await Promise.all([
        api.getCase(id),
        api.getCaseResult(id),
      ]);

      setCaseData(caseRes?.case);
      setResultData(resultRes?.result);

      // Trigger confetti on correct accusation!
      if (resultRes?.result?.correct) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6'],
        });
      }
    } catch (err) {
      console.error('Failed to retrieve case results:', err);
      if (err.code === 'CASE_NOT_COMPLETED') {
        // Redirect back to investigation room if case is not yet accused
        navigate(`/case/${id}`, { replace: true });
        return;
      }
      setError({
        code: err.code || 'RESULT_FETCH_FAILED',
        message: err.message || 'Unable to retrieve the final case results.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16">
        <LoadingIndicator title="Evaluating Evidence & Generating Final Verdict..." />
      </div>
    );
  }

  if (error || !resultData || !caseData) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <ErrorMessage error={error} onRetry={fetchResults} />
        <div className="text-center">
          <Link
            to={`/case/${id}`}
            className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 hover:underline"
          >
            <span>&larr; Return to Active Investigation</span>
          </Link>
        </div>
      </div>
    );
  }

  const { correct, culprit, accusedSuspectId, explanation, scoreBreakdown, supportingClueIds = [] } = resultData;
  const accusedSuspect = caseData.suspects.find(s => s.id === accusedSuspectId);
  const trueCulpritSuspect = caseData.suspects.find(s => s.id === culprit.id);

  const supportingClueIdSet = new Set(supportingClueIds);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-16">
      {/* Top Solved/Cold Case Verdict Card */}
      <section
        className={`rounded-2xl p-6 sm:p-10 border shadow-2xl relative overflow-hidden ${
          correct
            ? 'bg-gradient-to-b from-emerald-950/40 via-noir-900 to-noir-950 border-emerald-500/40'
            : 'bg-gradient-to-b from-rose-950/40 via-noir-900 to-noir-950 border-rose-500/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
                correct
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {correct ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  CASE #{id.slice(-6).toUpperCase()} &bull; VERDICT DELIVERED
                </span>
                <DifficultyBadge difficulty={caseData.difficulty} />
              </div>
              <h1 className="font-serif font-black text-3xl sm:text-4xl text-slate-100">
                {correct ? 'Case Solved!' : 'The Culprit Evaded Justice'}
              </h1>
              <p className="text-sm font-mono mt-1 text-slate-300">
                {correct
                  ? 'Your deduction was airtight. The suspect was unable to dispute the evidence.'
                  : `You accused ${accusedSuspect?.name || accusedSuspectId}, but the real culprit was ${culprit.name}.`}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 w-full sm:w-auto">
            <span className="text-[11px] font-mono uppercase text-slate-400 block tracking-wider">
              Authoritative Score
            </span>
            <div className="font-mono font-black text-4xl text-amber-400">
              {scoreBreakdown.finalScore} <span className="text-sm font-normal text-slate-400">PTS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Score Breakdown Card */}
      <section className="dossier-card rounded-xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="font-serif font-bold text-lg text-slate-100">Official Score Breakdown</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-noir-950 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Accusation Verdict</span>
            <span className={`text-base font-bold ${correct ? 'text-emerald-400' : 'text-slate-400'}`}>
              +{scoreBreakdown.correctAccusationPoints} PTS
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {correct ? `${caseData.difficulty} difficulty bonus` : 'Incorrect deduction (0 bonus)'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-noir-950 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Evidence Discovered</span>
            <span className="text-base font-bold text-amber-400">
              +{scoreBreakdown.discoveredCluePoints} PTS
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {scoreBreakdown.discoveredCluePoints / 5} clues &times; 5 pts
            </span>
          </div>

          <div className="p-4 rounded-lg bg-noir-950 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Hints Requested</span>
            <span className={`text-base font-bold ${scoreBreakdown.hintPenalty > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              -{scoreBreakdown.hintPenalty} PTS
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {scoreBreakdown.hintPenalty / 10} hints &times; 10 penalty
            </span>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <span className="text-amber-400 block text-[10px] uppercase tracking-wider mb-1">Final Total</span>
            <span className="text-xl font-black text-amber-300 font-mono">
              {scoreBreakdown.finalScore} PTS
            </span>
            <span className="text-[11px] text-amber-200/80 block mt-1 font-sans">
              {scoreBreakdown.finalScore >= 150
                ? 'Master Sleuth 🌟'
                : scoreBreakdown.finalScore >= 80
                ? 'Senior Inspector 🕵️'
                : 'Detective Trainee 🔍'}
            </span>
          </div>
        </div>
      </section>

      {/* Culprit Dossier & The Detective's Breakdown */}
      <section className="dossier-card rounded-xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Forensic Debrief</span>
            <h2 className="font-serif font-bold text-xl text-slate-100">The Unsealed Investigation Report</h2>
          </div>
        </div>

        {/* The True Culprit Card */}
        <div className="p-5 rounded-xl bg-noir-950/80 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold block">
                The Actual Perpetrator
              </span>
              <h3 className="font-serif font-bold text-2xl text-slate-100">
                {culprit.name}
              </h3>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
              ID: {culprit.id}
            </span>
          </div>

          {trueCulpritSuspect && (
            <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-slate-800/80">
              <p><strong className="text-slate-400">Background:</strong> {trueCulpritSuspect.description}</p>
              <p><strong className="text-slate-400">Claimed Alibi:</strong> <span className="italic text-rose-300/80">&ldquo;{trueCulpritSuspect.alibi}&rdquo;</span></p>
            </div>
          )}
        </div>

        {/* Narrative Deduction & Evidence Logic */}
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-base text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>How the Crime Was Committed & Proven</span>
          </h4>
          <div className="p-5 rounded-xl bg-noir-950 border border-slate-800/90 text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-line">
            {explanation}
          </div>
        </div>
      </section>

      {/* Clues Audit Board */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-xl text-slate-100">Complete Evidence Audit</h2>
            <p className="text-xs font-mono text-slate-400">Review all clues, including key exhibits that solved the case</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{caseData.clues.length} Total Exhibits</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caseData.clues.map((clue, idx) => {
            const isSupporting = supportingClueIdSet.has(clue.id);
            const wasDiscovered = clue.discovered;

            return (
              <div
                key={clue.id}
                className={`rounded-xl p-5 border transition-all ${
                  isSupporting
                    ? 'bg-amber-500/5 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-noir-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      EXHIBIT #{idx + 1}
                    </span>
                    <h4 className="font-serif font-bold text-slate-100">{clue.title}</h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSupporting && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        KEY EVIDENCE
                      </span>
                    )}
                    {wasDiscovered ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Found
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Unfound
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-2 italic">&ldquo;{clue.teaser}&rdquo;</p>
                {clue.text ? (
                  <p className="text-xs font-mono text-slate-300 bg-noir-950 p-3 rounded-lg border border-slate-800/80">
                    {clue.text}
                  </p>
                ) : (
                  <p className="text-xs font-mono text-slate-400 italic">
                    (This clue was not discovered during your investigation)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Action Navigation */}
      <section className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/create"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-amber-500 hover:bg-amber-400 text-noir-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 transition-transform hover:-translate-y-0.5"
        >
          <Sparkles className="w-5 h-5" />
          <span>Investigate Another Mystery</span>
        </Link>

        <Link
          to="/"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
        >
          <HomeIcon className="w-4 h-4" />
          <span>Return to Detective's Desk</span>
        </Link>
      </section>
    </div>
  );
}

