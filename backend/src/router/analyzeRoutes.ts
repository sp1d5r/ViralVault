import { Router } from 'express';
import { analyzePerformance } from '../controllers/analyzeController';

const router = Router();

router.post('/analyze', analyzePerformance);

export default router; 