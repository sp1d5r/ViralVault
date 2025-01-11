import { Router } from 'express';
import { analyzePerformance } from '../controllers/analyzeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, analyzePerformance);

export default router; 