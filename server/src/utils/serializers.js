import { calculateProvisionalScore } from '../services/scoringService.js';

/**
 * Serializes an active case for public consumption.
 * STRICT SECURITY: Excludes solution, culpritId, undiscovered clue text,
 * and unused hint text.
 */
export function serializeActiveCase(caseDoc) {
  const discoveredSet = new Set(caseDoc.discoveredClueIds || []);
  const usedHints = (caseDoc.hints || []).slice(0, caseDoc.usedHintCount || 0).map((text, idx) => ({
    index: idx + 1,
    text,
  }));

  const totalHints = Array.isArray(caseDoc.hints) ? caseDoc.hints.length : 0;
  const usedHintCount = caseDoc.usedHintCount || 0;
  const remainingHints = Math.max(0, totalHints - usedHintCount);

  return {
    case: {
      id: caseDoc._id.toString(),
      title: caseDoc.title,
      premise: caseDoc.premise,
      story: caseDoc.story,
      difficulty: caseDoc.difficulty,
      suspects: (caseDoc.suspects || []).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        alibi: s.alibi,
      })),
      clues: (caseDoc.clues || []).map(c => ({
        id: c.id,
        title: c.title,
        teaser: c.teaser,
        discovered: discoveredSet.has(c.id) || Boolean(c.discovered),
        text: (discoveredSet.has(c.id) || Boolean(c.discovered)) ? c.text : null,
      })),
      hints: usedHints,
      progress: {
        discoveredClueIds: Array.from(discoveredSet),
        discoveredClueCount: discoveredSet.size,
        totalClueCount: (caseDoc.clues || []).length,
        usedHintCount,
        remainingHints,
        score: calculateProvisionalScore(discoveredSet.size, usedHintCount),
      },
      status: caseDoc.status,
    },
  };
}

/**
 * Serializes the completed result of a case.
 * ONLY allowed when case is completed.
 */
export function serializeCompletedResult(caseDoc) {
  if (!caseDoc.result) {
    throw new Error('Case does not have a persisted result');
  }

  return {
    result: {
      correct: caseDoc.result.correct,
      accusedSuspectId: caseDoc.result.accusedSuspectId,
      culprit: caseDoc.result.culprit,
      score: caseDoc.result.score,
      scoreBreakdown: caseDoc.result.scoreBreakdown,
      explanation: caseDoc.result.explanation,
      supportingClueIds: caseDoc.result.supportingClueIds || [],
    },
  };
}

