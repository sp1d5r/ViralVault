import { Router } from 'express';
import { getSystemPrompts, updateSystemPrompt, toggleSystemPrompt, createSystemPrompt } from '../controllers/systemPromptController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All system prompt routes require authentication
router.use(authenticateToken);

// Get all system prompts for the user
router.get('/', getSystemPrompts);

// Create a new system prompt
router.post('/', createSystemPrompt);

// Update an existing system prompt
router.put('/', updateSystemPrompt);

// Toggle system prompt active status
router.post('/toggle', toggleSystemPrompt);

export default router; 