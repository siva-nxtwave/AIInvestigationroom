import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY_CONFIG,
  createCaseSchema,
  accuseSchema,
  validateAiMystery,
} from '../../src/validators/caseValidators.js';
import {
  calculateProvisionalScore,
  calculateFinalScore,
} from '../../src/services/scoringService.js';
import { serializeActiveCase } from '../../src/utils/serializers.js';

test('DIFFICULTY_CONFIG exact counts & bonuses', () => {
  assert.deepEqual(DIFFICULTY_CONFIG.easy, { suspects: 3, clues: 5, hints: 2, bonus: 100 });
  assert.deepEqual(DIFFICULTY_CONFIG.medium, { suspects: 4, clues: 7, hints: 3, bonus: 150 });
  assert.deepEqual(DIFFICULTY_CONFIG.hard, { suspects: 5, clues: 9, hints: 3, bonus: 200 });
});

test('createCaseSchema validates premise and difficulty', () => {
  // Valid
  const valid = createCaseSchema.safeParse({
    premise: 'A priceless sapphire vanishes from a locked museum display.',
    difficulty: 'medium',
  });
  assert.equal(valid.success, true);

  // Too short premise
  const shortPremise = createCaseSchema.safeParse({
    premise: 'Too short',
    difficulty: 'easy',
  });
  assert.equal(shortPremise.success, false);

  // Invalid difficulty
  const badDiff = createCaseSchema.safeParse({
    premise: 'A valid premise that is long enough to meet the 20 character requirement.',
    difficulty: 'super-hard',
  });
  assert.equal(badDiff.success, false);
});

test('accuseSchema requires non-empty suspectId', () => {
  assert.equal(accuseSchema.safeParse({ suspectId: 'suspect_1' }).success, true);
  assert.equal(accuseSchema.safeParse({ suspectId: '' }).success, false);
  assert.equal(accuseSchema.safeParse({}).success, false);
});

test('validateAiMystery detects counts and referential integrity', () => {
  const validData = {
    title: 'The Stolen Diamond',
    story: 'On a dark and stormy night, Lord Harrington was discovered missing his diamond.',
    suspects: [
      { id: 'suspect_1', name: 'Al', description: 'The Butler', alibi: 'Polishing silver in pantry.' },
      { id: 'suspect_2', name: 'Bob', description: 'The Guest', alibi: 'Reading in parlor.' },
      { id: 'suspect_3', name: 'Charlie', description: 'The Driver', alibi: 'Resting in quarters.' },
    ],
    clues: [
      { id: 'clue_1', title: 'Muddy Shoe', teaser: 'Tracks near door.', text: 'River silt on sole.' },
      { id: 'clue_2', title: 'Torn Coat', teaser: 'Fabric on latch.', text: 'Tweed matching butler.' },
      { id: 'clue_3', title: 'Ledger', teaser: 'Debts noted.', text: 'Massive card debt.' },
      { id: 'clue_4', title: 'Clock', teaser: 'Frozen hands.', text: 'Stopped at 11:15.' },
      { id: 'clue_5', title: 'Key', teaser: 'Duplicate key.', text: 'Brass key to safe.' },
    ],
    hints: ['Check the footwear.', 'Look at the fabric.'],
    solution: {
      culpritId: 'suspect_1',
      explanation: 'The butler took it using a spare key.',
      reasoning: 'The mud and fabric prove he was outside when he claimed to be in the pantry.',
      supportingClueIds: ['clue_1', 'clue_2'],
    },
  };

  // Valid for easy (3 suspects, 5 clues, 2 hints)
  const result = validateAiMystery(validData, 'easy');
  assert.equal(result.valid, true);

  // Invalid for medium (expects 4 suspects, 7 clues, 3 hints)
  const medResult = validateAiMystery(validData, 'medium');
  assert.equal(medResult.valid, false);

  // Invalid culprit reference
  const badCulprit = JSON.parse(JSON.stringify(validData));
  badCulprit.solution.culpritId = 'non_existent_suspect';
  const culpritCheck = validateAiMystery(badCulprit, 'easy');
  assert.equal(culpritCheck.valid, false);

  // Invalid supporting clue reference
  const badClueRef = JSON.parse(JSON.stringify(validData));
  badClueRef.solution.supportingClueIds = ['clue_999'];
  const clueRefCheck = validateAiMystery(badClueRef, 'easy');
  assert.equal(clueRefCheck.valid, false);
});

test('calculateProvisionalScore never falls below zero', () => {
  assert.equal(calculateProvisionalScore(2, 0), 10); // 2 clues * 5 = 10
  assert.equal(calculateProvisionalScore(1, 2), 0); // 5 - 20 = -15 -> max(0, -15) = 0
  assert.equal(calculateProvisionalScore(0, 3), 0);
});

test('calculateFinalScore matches specification examples', () => {
  // Example 1: Easy, correct, 4 clues, 1 hint -> max(0, 100 + 20 - 10) = 110
  const ex1 = calculateFinalScore('easy', true, 4, 1);
  assert.deepEqual(ex1, {
    correctAccusationPoints: 100,
    cluePoints: 20,
    discoveredCluePoints: 20,
    hintPenalty: 10,
    finalScore: 110,
  });

  // Example 2: Medium, incorrect, 5 clues, 2 hints -> max(0, 0 + 25 - 20) = 5
  const ex2 = calculateFinalScore('medium', false, 5, 2);
  assert.deepEqual(ex2, {
    correctAccusationPoints: 0,
    cluePoints: 25,
    discoveredCluePoints: 25,
    hintPenalty: 20,
    finalScore: 5,
  });

  // Example 3: Hard, correct, 2 clues, 3 hints -> max(0, 200 + 10 - 30) = 180
  const ex3 = calculateFinalScore('hard', true, 2, 3);
  assert.deepEqual(ex3, {
    correctAccusationPoints: 200,
    cluePoints: 10,
    discoveredCluePoints: 10,
    hintPenalty: 30,
    finalScore: 180,
  });

  // Example 4: Hard, incorrect, 0 clues, 2 hints -> max(0, 0 + 0 - 20) = 0 (never negative)
  const ex4 = calculateFinalScore('hard', false, 0, 2);
  assert.equal(ex4.finalScore, 0);
});

test('serializeActiveCase enforces server-side secrecy', () => {
  const fakeCase = {
    _id: '507f1f77bcf86cd799439011',
    title: 'The Secret Heist',
    premise: 'A jewel was taken from the display case during dinner.',
    story: 'The party was interrupted by an alarm.',
    difficulty: 'easy',
    suspects: [
      { id: 'suspect_1', name: 'Lady Gray', description: 'Aristocrat', alibi: 'At the piano' },
      { id: 'suspect_2', name: 'Mr. Black', description: 'Collector', alibi: 'In the garden' },
    ],
    clues: [
      { id: 'clue_1', title: 'Open Window', teaser: 'Slight breeze coming in', text: 'Scuff marks on the sill', discovered: true },
      { id: 'clue_2', title: 'Glove', teaser: 'A velvet glove', text: 'Monogrammed with G', discovered: false },
    ],
    hints: ['Inspect the window', 'Check initials on jewelry'],
    usedHintCount: 1,
    discoveredClueIds: ['clue_1'],
    solution: {
      culpritId: 'suspect_1',
      explanation: 'Lady Gray slipped out.',
      reasoning: 'The scuff marks and monogram point to her.',
      supportingClueIds: ['clue_1', 'clue_2'],
    },
    status: 'active',
  };

  const serialized = serializeActiveCase(fakeCase);

  // 1. Solution and culpritId MUST NOT exist in payload
  assert.equal(serialized.case.solution, undefined);
  assert.equal(serialized.case.culpritId, undefined);

  // 2. Discovered clue has text, undiscovered clue has text: null
  const clue1 = serialized.case.clues.find(c => c.id === 'clue_1');
  const clue2 = serialized.case.clues.find(c => c.id === 'clue_2');
  assert.equal(clue1.text, 'Scuff marks on the sill');
  assert.equal(clue2.text, null);

  // 3. Only used hints are included, unused hints are NOT leaked
  assert.equal(serialized.case.hints.length, 1);
  assert.equal(serialized.case.hints[0].text, 'Inspect the window');
  assert.equal(serialized.case.progress.remainingHints, 1);
});
