import { Router } from 'express';
import { analyzePerformance } from '../controllers/analyzeController';

const router = Router();

router.post('/', analyzePerformance);

export default router; 