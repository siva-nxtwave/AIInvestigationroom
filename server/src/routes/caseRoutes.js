import { Router } from 'express';
import {
  createCase,
  getCaseById,
  discoverClue,
  requestHint,
  submitAccusation,
  getCaseResult,
} from '../controllers/caseController.js';
import { creationLimiter, hintLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/cases', creationLimiter, createCase);
router.get('/cases/:id', getCaseById);
router.post('/cases/:id/clues/:clueId/discover', discoverClue);
router.post('/cases/:id/hints', hintLimiter, requestHint);
router.post('/cases/:id/accuse', submitAccusation);
router.get('/cases/:id/result', getCaseResult);

export default router;

