import { Router } from 'express';
import { analyzePerformance, analyzeImageWithClaude } from '../controllers/analyzeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, analyzePerformance);
router.post('/claude-image', analyzeImageWithClaude);

export default router; 