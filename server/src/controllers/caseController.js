import mongoose from 'mongoose';
import { Case } from '../models/Case.js';
import { createCaseSchema, accuseSchema } from '../validators/caseValidators.js';
import { generateMysteryWithAI } from '../services/geminiService.js';
import { calculateProvisionalScore, calculateFinalScore } from '../services/scoringService.js';
import { serializeActiveCase, serializeCompletedResult } from '../utils/serializers.js';

export async function createCase(req, res, next) {
  try {
    const parseResult = createCaseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid input data',
          details: parseResult.error.errors,
        },
      });
    }

    const { premise, difficulty } = parseResult.data;

    let generatedMystery;
    try {
      generatedMystery = await generateMysteryWithAI(premise, difficulty);
    } catch (aiErr) {
      console.error('[CaseController] AI generation error:', aiErr.message);
      return res.status(502).json({
        error: {
          code: 'AI_GENERATION_FAILED',
          message: "We couldn't generate a valid mystery at this time. Please try again.",
        },
      });
    }

    const newCase = new Case({
      premise,
      difficulty,
      title: generatedMystery.title,
      story: generatedMystery.story,
      suspects: generatedMystery.suspects,
      clues: generatedMystery.clues.map(c => ({
        id: c.id,
        title: c.title,
        teaser: c.teaser,
        text: c.text,
        discovered: false,
      })),
      hints: generatedMystery.hints,
      solution: generatedMystery.solution,
      discoveredClueIds: [],
      usedHintCount: 0,
      status: 'active',
    });

    await newCase.save();

    return res.status(201).json(serializeActiveCase(newCase));
  } catch (err) {
    next(err);
  }
}

export async function getCaseById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CASE_ID',
          message: 'The requested case ID is not valid.',
        },
      });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({
        error: {
          code: 'CASE_NOT_FOUND',
          message: 'Case not found.',
        },
      });
    }

    // Never expose private solution fields in GET /api/cases/:id
    return res.status(200).json(serializeActiveCase(caseDoc));
  } catch (err) {
    next(err);
  }
}

export async function discoverClue(req, res, next) {
  try {
    const { id, clueId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !clueId) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid case ID or clue ID.',
        },
      });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({
        error: {
          code: 'CASE_NOT_FOUND',
          message: 'Case not found.',
        },
      });
    }

    if (caseDoc.status === 'completed') {
      return res.status(409).json({
        error: {
          code: 'CASE_COMPLETED',
          message: 'This case is already completed and cannot be modified.',
        },
      });
    }

    const clue = caseDoc.clues.find(c => c.id === clueId);
    if (!clue) {
      return res.status(404).json({
        error: {
          code: 'CLUE_NOT_FOUND',
          message: 'Clue does not belong to this case.',
        },
      });
    }

    // If not already discovered, add it
    const alreadyDiscovered = caseDoc.discoveredClueIds.includes(clueId);
    if (!alreadyDiscovered) {
      caseDoc.discoveredClueIds.push(clueId);
      clue.discovered = true;
      await caseDoc.save();
    }

    const score = calculateProvisionalScore(caseDoc.discoveredClueIds.length, caseDoc.usedHintCount);

    return res.status(200).json({
      clue: {
        id: clue.id,
        title: clue.title,
        text: clue.text,
      },
      progress: {
        discoveredClueIds: caseDoc.discoveredClueIds,
        discoveredClueCount: caseDoc.discoveredClueIds.length,
        totalClueCount: caseDoc.clues.length,
        score,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function requestHint(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid case ID.',
        },
      });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({
        error: {
          code: 'CASE_NOT_FOUND',
          message: 'Case not found.',
        },
      });
    }

    if (caseDoc.status === 'completed') {
      return res.status(409).json({
        error: {
          code: 'CASE_COMPLETED',
          message: 'This case is already completed.',
        },
      });
    }

    const totalHints = caseDoc.hints.length;
    if (caseDoc.usedHintCount >= totalHints) {
      return res.status(409).json({
        error: {
          code: 'NO_HINTS_REMAINING',
          message: 'No hints remaining for this case.',
        },
      });
    }

    const hintIndex = caseDoc.usedHintCount;
    const nextHintText = caseDoc.hints[hintIndex];
    caseDoc.usedHintCount += 1;
    await caseDoc.save();

    const score = calculateProvisionalScore(caseDoc.discoveredClueIds.length, caseDoc.usedHintCount);

    return res.status(200).json({
      hint: {
        index: caseDoc.usedHintCount,
        text: nextHintText,
      },
      progress: {
        usedHintCount: caseDoc.usedHintCount,
        remainingHints: Math.max(0, totalHints - caseDoc.usedHintCount),
        score,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function submitAccusation(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid case ID.',
        },
      });
    }

    const parseResult = accuseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid accusation data',
          details: parseResult.error.errors,
        },
      });
    }

    const { suspectId } = parseResult.data;

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({
        error: {
          code: 'CASE_NOT_FOUND',
          message: 'Case not found.',
        },
      });
    }

    // If case is already completed, return persisted result
    if (caseDoc.status === 'completed' && caseDoc.result) {
      return res.status(200).json(serializeCompletedResult(caseDoc));
    }

    // Check if suspect belongs to case
    const suspect = caseDoc.suspects.find(s => s.id === suspectId);
    if (!suspect) {
      return res.status(400).json({
        error: {
          code: 'INVALID_SUSPECT',
          message: 'The accused suspect does not belong to this case.',
        },
      });
    }

    const culpritSuspect = caseDoc.suspects.find(s => s.id === caseDoc.solution.culpritId);
    const isCorrect = caseDoc.solution.culpritId === suspectId;

    const scoreBreakdown = calculateFinalScore(
      caseDoc.difficulty,
      isCorrect,
      caseDoc.discoveredClueIds.length,
      caseDoc.usedHintCount
    );

    const fullExplanation = `${caseDoc.solution.explanation} ${caseDoc.solution.reasoning}`.trim();

    caseDoc.status = 'completed';
    caseDoc.accusation = {
      suspectId,
      submittedAt: new Date(),
    };
    caseDoc.score = scoreBreakdown;
    caseDoc.result = {
      correct: isCorrect,
      accusedSuspectId: suspectId,
      culprit: {
        id: culpritSuspect ? culpritSuspect.id : caseDoc.solution.culpritId,
        name: culpritSuspect ? culpritSuspect.name : 'Unknown Culprit',
      },
      culpritId: caseDoc.solution.culpritId,
      explanation: fullExplanation,
      supportingClueIds: caseDoc.solution.supportingClueIds || [],
      score: scoreBreakdown.finalScore,
      scoreBreakdown,
    };

    await caseDoc.save();

    return res.status(200).json(serializeCompletedResult(caseDoc));
  } catch (err) {
    next(err);
  }
}

export async function getCaseResult(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid case ID.',
        },
      });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({
        error: {
          code: 'CASE_NOT_FOUND',
          message: 'Case not found.',
        },
      });
    }

    if (caseDoc.status !== 'completed' || !caseDoc.result) {
      return res.status(409).json({
        error: {
          code: 'CASE_NOT_COMPLETED',
          message: 'This case is still active. The result is only available after submitting an accusation.',
        },
      });
    }

    return res.status(200).json(serializeCompletedResult(caseDoc));
  } catch (err) {
    next(err);
  }
}

