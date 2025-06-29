import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  generateImages,
  generateVariations,
  editImage,
  generateEnhancedImages,
  generateSocialMediaImages,
  generateBlogImages,
  validatePrompt,
  getAvailableModels,
} from '../controllers/imageGenerationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Generate images with DALL-E
router.post('/generate', generateImages);

// Generate image variations
router.post('/variations', generateVariations);

// Edit existing image
router.post('/edit', editImage);

// Generate enhanced images with prompt engineering
router.post('/enhanced', generateEnhancedImages);

// Generate social media optimized images
router.post('/social-media', generateSocialMediaImages);

// Generate blog header images
router.post('/blog', generateBlogImages);

// Validate prompt for content policy
router.post('/validate-prompt', validatePrompt);

// Get available models and capabilities
router.get('/models', getAvailableModels);

export default router; 