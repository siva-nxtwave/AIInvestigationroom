import mongoose from 'mongoose';

const SuspectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    alibi: { type: String, required: true },
  },
  { _id: false }
);

const ClueSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    teaser: { type: String, required: true },
    text: { type: String, required: true },
    discovered: { type: Boolean, default: false },
  },
  { _id: false }
);

const SolutionSchema = new mongoose.Schema(
  {
    culpritId: { type: String, required: true },
    explanation: { type: String, required: true },
    reasoning: { type: String, required: true },
    supportingClueIds: [{ type: String }],
  },
  { _id: false }
);

const ScoreSchema = new mongoose.Schema(
  {
    correctAccusationPoints: { type: Number, default: 0 },
    cluePoints: { type: Number, default: 0 },
    hintPenalty: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 },
  },
  { _id: false }
);

const ResultSchema = new mongoose.Schema(
  {
    correct: { type: Boolean, required: true },
    accusedSuspectId: { type: String, required: true },
    culprit: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    culpritId: { type: String },
    explanation: { type: String, required: true },
    supportingClueIds: [{ type: String }],
    score: { type: Number, required: true },
    scoreBreakdown: {
      correctAccusationPoints: { type: Number, required: true },
      discoveredCluePoints: { type: Number, required: true },
      hintPenalty: { type: Number, required: true },
      finalScore: { type: Number, required: true },
    },
  },
  { _id: false }
);

const CaseSchema = new mongoose.Schema(
  {
    premise: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 500,
    },
    title: { type: String, required: true, trim: true },
    story: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    suspects: {
      type: [SuspectSchema],
      required: true,
      validate: [v => Array.isArray(v) && v.length >= 3, 'Must have at least 3 suspects'],
    },
    clues: {
      type: [ClueSchema],
      required: true,
      validate: [v => Array.isArray(v) && v.length >= 5, 'Must have at least 5 clues'],
    },
    hints: {
      type: [String],
      required: true,
    },
    usedHintCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discoveredClueIds: {
      type: [String],
      default: [],
    },
    solution: {
      type: SolutionSchema,
      required: true,
    },
    accusation: {
      suspectId: { type: String },
      submittedAt: { type: Date },
    },
    score: {
      type: ScoreSchema,
      default: () => ({
        correctAccusationPoints: 0,
        cluePoints: 0,
        hintPenalty: 0,
        finalScore: 0,
      }),
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
      index: true,
    },
    result: {
      type: ResultSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Case = mongoose.model('Case', CaseSchema);

