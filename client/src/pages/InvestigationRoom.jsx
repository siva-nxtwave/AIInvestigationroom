import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Lock,
  Unlock,
  AlertTriangle,
  Lightbulb,
  Award,
  Users,
  ShieldAlert,
  ArrowRight,
  Eye,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client.js';
import { DifficultyBadge, StatusBadge } from '../components/Badge.jsx';
import { LoadingIndicator } from '../components/LoadingIndicator.jsx';
import { ErrorMessage } from '../components/ErrorMessage.jsx';
import { AccusationModal } from '../components/AccusationModal.jsx';

export function InvestigationRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clue discovery state tracking
  const [discoveringClueId, setDiscoveringClueId] = useState(null);

  // Hint requesting state tracking
  const [requestingHint, setRequestingHint] = useState(false);
  const [hintMessage, setHintMessage] = useState(null);

  // Accusation modal state
  const [showAccusationModal, setShowAccusationModal] = useState(false);
  const [submittingAccusation, setSubmittingAccusation] = useState(false);

  const fetchCase = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCase(id);
      const fetchedCase = res?.case;

      if (!fetchedCase) {
        throw new Error('Case data not found.');
      }

      // If already completed, redirect directly to results
      if (fetchedCase.status === 'completed') {
        navigate(`/case/${id}/result`, { replace: true });
        return;
      }

      setCaseData(fetchedCase);
    } catch (err) {
      console.error('Failed to load case:', err);
      setError({
        code: err.code || 'CASE_LOAD_FAILED',
        message: err.message || 'Unable to load investigation file.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  // Discover clue handler
  const handleDiscoverClue = async clueId => {
    if (discoveringClueId) return;
    setDiscoveringClueId(clueId);

    try {
      const res = await api.discoverClue(id, clueId);
      const updatedClue = res?.clue;
      const updatedProgress = res?.progress;

      setCaseData(prev => {
        if (!prev) return prev;
        const newClues = prev.clues.map(c => {
          if (c.id === clueId) {
            return {
              ...c,
              discovered: true,
              text: updatedClue.text,
            };
          }
          return c;
        });

        return {
          ...prev,
          clues: newClues,
          progress: {
            ...prev.progress,
            discoveredClueIds: updatedProgress.discoveredClueIds,
            discoveredClueCount: updatedProgress.discoveredClueCount,
            score: updatedProgress.score,
          },
        };
      });
    } catch (err) {
      console.error('Clue discovery failed:', err);
      alert(err.message || 'Failed to discover clue.');
    } finally {
      setDiscoveringClueId(null);
    }
  };

  // Request hint handler
  const handleRequestHint = async () => {
    if (requestingHint) return;
    setRequestingHint(true);
    setHintMessage(null);

    try {
      const res = await api.requestHint(id);
      const newHint = res?.hint;
      const updatedProgress = res?.progress;

      setCaseData(prev => {
        if (!prev) return prev;
        const existingHints = prev.hints || [];
        return {
          ...prev,
          hints: [...existingHints, newHint],
          progress: {
            ...prev.progress,
            usedHintCount: updatedProgress.usedHintCount,
            remainingHints: updatedProgress.remainingHints,
            score: updatedProgress.score,
          },
        };
      });
      setHintMessage(`Hint #${newHint.index} recorded! A 10 point deduction has been applied.`);
    } catch (err) {
      console.error('Hint request failed:', err);
      setHintMessage(err.message || 'Could not retrieve hint.');
    } finally {
      setRequestingHint(false);
    }
  };

  // Accusation submission handler
  const handleAccusationSubmit = async suspectId => {
    setSubmittingAccusation(true);
    try {
      await api.submitAccusation(id, suspectId);
      // Navigate to result view immediately
      navigate(`/case/${id}/result`);
    } catch (err) {
      console.error('Accusation failed:', err);
      alert(err.message || 'Failed to submit accusation.');
      setSubmittingAccusation(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16">
        <LoadingIndicator title="Opening Authoritative Case Dossier..." />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <ErrorMessage error={error} onRetry={fetchCase} />
        <div className="text-center">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 hover:underline"
          >
            <span>&larr; Start a New Investigation Instead</span>
          </Link>
        </div>
      </div>
    );
  }

  const { title, story, difficulty, suspects, clues, hints, progress } = caseData;
  const discoveredCluesCount = progress.discoveredClueCount ?? progress.discoveredClueIds?.length ?? 0;
  const totalClues = clues.length;
  const remainingHints = progress.remainingHints ?? 0;

  return (
    <div className="space-y-8 py-6 pb-24">
      {/* Top Dossier Header Card */}
      <section className="dossier-card rounded-2xl p-6 sm:p-8 border border-amber-500/20 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                CASE #{id.slice(-6).toUpperCase()}
              </span>
              <DifficultyBadge difficulty={difficulty} />
              <StatusBadge status={caseData.status} />
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-slate-100">{title}</h1>
          </div>

          {/* Provisional Score & Progress Header Pill */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-noir-900 border border-slate-700/80 text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Provisional Score
              </span>
              <span className="font-mono font-black text-xl text-amber-400">
                {progress.score} <span className="text-xs font-normal text-slate-400">PTS</span>
              </span>
            </div>

            <button
              onClick={() => setShowAccusationModal(true)}
              className="px-5 py-3 rounded-xl font-serif font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Make Accusation</span>
            </button>
          </div>
        </div>

        {/* Story / Incident Narrative */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Detective's Crime Scene Briefing</span>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light bg-noir-950/40 p-4 sm:p-6 rounded-xl border border-slate-800/80">
            {story}
          </p>
        </div>

        {/* Investigation Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Evidence Recovered: <strong className="text-slate-100">{discoveredCluesCount}</strong> of{' '}
              <strong className="text-slate-100">{totalClues}</strong> pieces
            </span>
            <span>
              Hints Used: <strong className="text-slate-100">{progress.usedHintCount || 0}</strong> ({remainingHints} remaining)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-noir-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
              style={{ width: `${(discoveredCluesCount / Math.max(1, totalClues)) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* Suspects Lineup Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-slate-100">Suspect Lineup</h2>
              <p className="text-xs font-mono text-slate-400">Examine backgrounds, demeanor, and claimed alibis</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">{suspects.length} Persons of Interest</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suspects.map(suspect => (
            <div
              key={suspect.id}
              className="dossier-card rounded-xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h3 className="font-serif font-bold text-lg text-slate-100">{suspect.name}</h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {suspect.id}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Profile & Demeanor</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{suspect.description}</p>
                </div>

                <div className="space-y-1 bg-noir-950/60 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase text-amber-400/90 tracking-wider">Claimed Alibi</span>
                  <p className="text-xs text-slate-200 italic">&ldquo;{suspect.alibi}&rdquo;</p>
                </div>
              </div>

              <button
                onClick={() => setShowAccusationModal(true)}
                className="w-full py-2 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Accuse {suspect.name.split(' ')[0]}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Evidence Board / Clues Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-slate-100">Crime Scene Evidence Board</h2>
              <p className="text-xs font-mono text-slate-400">Discover hidden clues to uncover inconsistencies in suspect alibis</p>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-400 font-semibold">+5 PTS PER UNIQUE CLUE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clues.map((clue, idx) => {
            const isDiscovered = clue.discovered;
            const isBusy = discoveringClueId === clue.id;

            return (
              <div
                key={clue.id}
                className={`rounded-xl p-5 border transition-all ${
                  isDiscovered
                    ? 'bg-noir-900/90 border-amber-500/40 shadow-md shadow-amber-500/5'
                    : 'bg-noir-950/80 border-slate-800/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      EXHIBIT #{idx + 1}
                    </span>
                    <h3 className="font-serif font-bold text-base text-slate-100">{clue.title}</h3>
                  </div>

                  {isDiscovered ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Discovered (+5)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      <Lock className="w-3.5 h-3.5" />
                      Undiscovered
                    </span>
                  )}
                </div>

                {/* Teaser */}
                <p className="text-xs text-slate-400 mb-3 italic">
                  &ldquo;{clue.teaser}&rdquo;
                </p>

                {/* Content */}
                {isDiscovered ? (
                  <div className="p-3.5 rounded-lg bg-noir-950 border border-amber-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                      CLASSIFIED EVIDENCE REPORT:
                    </span>
                    {clue.text}
                  </div>
                ) : (
                  <button
                    onClick={() => handleDiscoverClue(clue.id)}
                    disabled={isBusy}
                    className="w-full py-2.5 rounded-lg text-xs font-mono font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isBusy ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Inspecting evidence...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Evidence (+5 PTS)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Detective Hint Notebook Section */}
      <section className="rounded-xl bg-noir-900 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-100">Detective Bureau Hotline & Hints</h2>
              <p className="text-xs font-mono text-slate-400">
                Request guidance from senior inspectors. Caution: <strong className="text-rose-400">-10 points per hint</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-mono text-slate-300">
              {remainingHints} hints remaining
            </span>

            <button
              onClick={handleRequestHint}
              disabled={requestingHint || remainingHints <= 0}
              className="px-4 py-2 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 border border-slate-700 hover:border-amber-500/40 flex items-center gap-2 transition-colors"
            >
              {requestingHint ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Request Hint (-10 PTS)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {hintMessage && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            {hintMessage}
          </div>
        )}

        {/* Revealed Hints List */}
        {hints && hints.length > 0 ? (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono uppercase text-slate-400 block tracking-wider">
              Consulted Hints Archive:
            </span>
            <div className="space-y-2">
              {hints.map((hint, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-noir-950 border border-slate-800 text-xs sm:text-sm text-slate-200 font-mono flex items-start gap-3"
                >
                  <span className="text-amber-400 font-bold">#{hint.index || idx + 1}:</span>
                  <span className="flex-1">{hint.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-400 italic">
            No hints have been requested yet. Solve the mystery without hints for maximum score!
          </p>
        )}
      </section>

      {/* Floating Accusation CTA Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-xl w-full px-4">
        <div className="rounded-xl bg-noir-900/95 backdrop-blur-md border border-amber-500/30 p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <span className="text-xs font-serif font-bold text-slate-100 block">Ready to declare your verdict?</span>
            <span className="text-[11px] font-mono text-slate-400 block">
              Current score: <strong className="text-amber-400">{progress.score} pts</strong>
            </span>
          </div>

          <button
            onClick={() => setShowAccusationModal(true)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/30 flex items-center justify-center gap-2 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Make Final Accusation</span>
          </button>
        </div>
      </div>

      {/* Accusation Modal */}
      <AccusationModal
        isOpen={showAccusationModal}
        onClose={() => setShowAccusationModal(false)}
        suspects={suspects}
        onSubmit={handleAccusationSubmit}
        submitting={submittingAccusation}
      />
    </div>
  );
}

