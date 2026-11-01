import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

const isTest = config.nodeEnv === 'test';

export const creationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 20, // 20 mystery generations per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Case creation limit reached. Please wait a few minutes before generating another mystery.',
      },
    });
  },
  skip: () => isTest,
});

export const hintLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isTest ? 1000 : 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Hint request limit reached. Please wait a moment.',
      },
    });
  },
  skip: () => isTest,
});

