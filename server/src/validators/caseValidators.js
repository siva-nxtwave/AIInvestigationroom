import { z } from 'zod';

export const DIFFICULTY_CONFIG = {
  easy: {
    suspects: 3,
    clues: 5,
    hints: 2,
    bonus: 100,
  },
  medium: {
    suspects: 4,
    clues: 7,
    hints: 3,
    bonus: 150,
  },
  hard: {
    suspects: 5,
    clues: 9,
    hints: 3,
    bonus: 200,
  },
};

export const createCaseSchema = z.object({
  premise: z
    .string({ required_error: 'Premise is required' })
    .trim()
    .min(20, 'Premise must be at least 20 characters')
    .max(500, 'Premise cannot exceed 500 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Choose a valid difficulty: easy, medium, or hard' }),
  }),
});

export const accuseSchema = z.object({
  suspectId: z
    .string({ required_error: 'Suspect ID is required' })
    .trim()
    .min(1, 'Suspect ID cannot be empty'),
});

const SuspectSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(5).max(400),
  alibi: z.string().trim().min(5).max(400),
});

const ClueSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(2).max(100),
  teaser: z.string().trim().min(5).max(250),
  text: z.string().trim().min(10).max(600),
});

const SolutionSchema = z.object({
  culpritId: z.string().trim().min(1),
  explanation: z.string().trim().min(10).max(1500),
  reasoning: z.string().trim().min(10).max(1500),
  supportingClueIds: z.array(z.string().trim().min(1)).min(1),
});

export const rawAiCaseOutputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  story: z.string().trim().min(30).max(2000),
  suspects: z.array(SuspectSchema),
  clues: z.array(ClueSchema),
  hints: z.array(z.string().trim().min(5).max(300)),
  solution: SolutionSchema,
});

/**
 * Validates generated mystery data against difficulty requirements and referential integrity.
 * Returns { valid: true, data } or { valid: false, errors: string[] }
 */
export function validateAiMystery(rawData, difficulty) {
  const parseResult = rawAiCaseOutputSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      valid: false,
      errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const data = parseResult.data;
  const config = DIFFICULTY_CONFIG[difficulty];
  const errors = [];

  // Exact count checks
  if (data.suspects.length !== config.suspects) {
    errors.push(
      `Difficulty '${difficulty}' requires exactly ${config.suspects} suspects, got ${data.suspects.length}`
    );
  }
  if (data.clues.length !== config.clues) {
    errors.push(
      `Difficulty '${difficulty}' requires exactly ${config.clues} clues, got ${data.clues.length}`
    );
  }
  if (data.hints.length !== config.hints) {
    errors.push(
      `Difficulty '${difficulty}' requires exactly ${config.hints} hints, got ${data.hints.length}`
    );
  }

  // Unique suspect IDs
  const suspectIds = new Set(data.suspects.map(s => s.id));
  if (suspectIds.size !== data.suspects.length) {
    errors.push('Suspect IDs must be unique');
  }

  // Unique clue IDs
  const clueIds = new Set(data.clues.map(c => c.id));
  if (clueIds.size !== data.clues.length) {
    errors.push('Clue IDs must be unique');
  }

  // Culprit must exist among suspects
  if (!suspectIds.has(data.solution.culpritId)) {
    errors.push(
      `solution.culpritId '${data.solution.culpritId}' does not match any suspect ID (${Array.from(suspectIds).join(', ')})`
    );
  }

  // Supporting clues must exist among clues
  const supportingClueIdSet = new Set(data.solution.supportingClueIds);
  if (supportingClueIdSet.size !== data.solution.supportingClueIds.length) {
    errors.push('solution.supportingClueIds contains duplicate IDs');
  }
  for (const cid of data.solution.supportingClueIds) {
    if (!clueIds.has(cid)) {
      errors.push(`Supporting clue ID '${cid}' does not match any clue in the case`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}

