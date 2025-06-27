import { Router } from 'express';
import { generateStory, getStories, getStoryById } from '../controllers/storyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All story routes require authentication
router.use(authenticateToken);

// Generate a new story
router.post('/generate', generateStory);

// Get all stories for the authenticated user
router.get('/', getStories);

// Get a specific story by ID
router.get('/:id', getStoryById);

export default router; 