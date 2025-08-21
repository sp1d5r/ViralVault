import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  generateImages,
  generateImagesWithConsistency,
  generateVariations,
  editImage,
  generateEnhancedImages,
  generateSocialMediaImages,
  generateBlogImages,
  getJobStatus,
  getUserJobs,
  getJobsByStoryAndSlide,
  cancelJob,
  cleanupContradictoryJobs,
  refreshImageUrl,
  generateAllImagesAutomatically,
  // validatePrompt,
  getAvailableModels,
  convertBase64ToDataUrl,
  convertDataUrlToBase64,
  getMasterJobStatus,
} from '../controllers/imageGenerationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Generate images with DALL-E
router.post('/generate', generateImages);

// Generate images with character consistency
router.post('/generate-with-consistency', generateImagesWithConsistency);

// Generate all images automatically for a story
router.post('/generate-all-automatically', generateAllImagesAutomatically);

// Get master job status for automatic generation
router.get('/master-job/:masterJobId', getMasterJobStatus);

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

// Job management routes
router.get('/jobs/:jobId', getJobStatus);
router.get('/jobs', getUserJobs);
router.get('/jobs/story/:storyId/slide/:slideNumber', getJobsByStoryAndSlide);
router.get('/jobs/story/:storyId', getJobsByStoryAndSlide);
router.post('/jobs/:jobId/cancel', cancelJob);
router.post('/jobs/:jobId/refresh-url', refreshImageUrl);

// Utility routes
router.post('/jobs/cleanup-contradictory', cleanupContradictoryJobs);

// Validate prompt for content policy
// router.post('/validate-prompt', validatePrompt);

// Get available models and capabilities
router.get('/models', getAvailableModels);

// Utility routes for base64 conversion
router.post('/convert/base64-to-data-url', convertBase64ToDataUrl);
router.post('/convert/data-url-to-base64', convertDataUrlToBase64);

export default router; 