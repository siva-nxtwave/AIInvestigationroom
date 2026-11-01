import { DIFFICULTY_CONFIG } from '../validators/caseValidators.js';

/**
 * Calculate provisional score for an active case.
 * Score is never negative.
 */
export function calculateProvisionalScore(discoveredClueCount, usedHintCount) {
  const cluePoints = (discoveredClueCount || 0) * 5;
  const hintPenalty = (usedHintCount || 0) * 10;
  return Math.max(0, cluePoints - hintPenalty);
}

/**
 * Calculate final score and breakdown upon accusation submission.
 * Formula: max(0, bonus + cluePoints - hintPenalty)
 */
export function calculateFinalScore(difficulty, isCorrect, discoveredClueCount, usedHintCount) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const correctAccusationPoints = isCorrect && config ? config.bonus : 0;
  const cluePoints = (discoveredClueCount || 0) * 5;
  const hintPenalty = (usedHintCount || 0) * 10;
  const finalScore = Math.max(0, correctAccusationPoints + cluePoints - hintPenalty);

  return {
    correctAccusationPoints,
    cluePoints,
    discoveredCluePoints: cluePoints,
    hintPenalty,
    finalScore,
  };
}
