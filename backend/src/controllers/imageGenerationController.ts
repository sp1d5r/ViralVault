import { Request, Response } from 'express';
import { imageGenerationService } from '../services/imageGenerationService';
import { FirebaseDatabaseService } from 'shared';

export const generateImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, size, quality, format, compression, background, async = false } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
      return;
    }

    if (async) {
      // For now, we'll simulate async behavior by storing the job in Firebase
      // and returning immediately. In a real implementation, you'd use OpenAI's Background Jobs API
      const jobId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store job in Firebase
      const jobData = {
        jobId,
        userId,
        prompt,
        options: { size, quality, format, compression, background },
        status: 'pending',
        progress: 0,
        createdAt: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        FirebaseDatabaseService.addDocument(
          'image-generation-jobs',
          jobData,
          () => resolve(),
          (error) => reject(error)
        );
      });

      // Start the actual generation in the background
      generateImageInBackground(jobId, prompt, { size, quality, format, compression, background });

      res.json({
        success: true,
        jobId,
        status: 'pending',
        message: 'Image generation started. Use the jobId to check status.',
      });
    } else {
      // Synchronous generation
      const result = await imageGenerationService.generateImages({
        prompt,
        size,
        quality,
        format,
        compression,
        background,
      });

      res.json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    console.error('Error generating images:', error);
    res.status(500).json({ 
      error: 'Failed to generate images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Background image generation function
async function generateImageInBackground(
  jobId: string, 
  prompt: string, 
  options: any
): Promise<void> {
  try {
    // Update status to processing
    await updateJobStatus(jobId, 'processing', 50);

    // Generate the image
    const result = await imageGenerationService.generateImages({
      prompt,
      ...options,
    });

    // Update status to completed
    await updateJobStatus(jobId, 'completed', 100, result);
  } catch (error) {
    console.error(`Background job ${jobId} failed:`, error);
    await updateJobStatus(jobId, 'failed', undefined, undefined, error instanceof Error ? error.message : 'Unknown error');
  }
}

// Update job status in Firebase
async function updateJobStatus(
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress?: number,
  result?: any,
  error?: string
): Promise<void> {
  const updateData: any = {
    status,
    progress,
    updatedAt: Date.now(),
  };

  if (result) {
    updateData.result = result;
  }

  if (error) {
    updateData.error = error;
  }

  if (status === 'completed' || status === 'failed') {
    updateData.completedAt = Date.now();
  }

  await new Promise<void>((resolve, reject) => {
    FirebaseDatabaseService.updateDocument(
      'image-generation-jobs',
      jobId,
      updateData,
      () => resolve(),
      (error) => reject(error)
    );
  });
}

// Get job status
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }

    // Get job from Firebase
    const job = await new Promise<any>((resolve, reject) => {
      FirebaseDatabaseService.getDocument(
        'image-generation-jobs',
        jobId,
        (doc) => resolve(doc),
        (error) => reject(error)
      );
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Check if user owns this job
    if (job.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ 
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get user's jobs
export const getUserJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get user's jobs from Firebase
    const jobs = await new Promise<any[]>((resolve, reject) => {
      FirebaseDatabaseService.queryDocuments(
        'image-generation-jobs',
        'userId',
        'createdAt',
        userId,
        (docs) => resolve(docs || []),
        (error) => reject(error)
      );
    });

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error('Error getting user jobs:', error);
    res.status(500).json({ 
      error: 'Failed to get user jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Cancel a job
export const cancelJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }

    // Get job from Firebase
    const job = await new Promise<any>((resolve, reject) => {
      FirebaseDatabaseService.getDocument(
        'image-generation-jobs',
        jobId,
        (doc) => resolve(doc),
        (error) => reject(error)
      );
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Check if user owns this job
    if (job.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Only allow cancellation of pending or processing jobs
    if (job.status !== 'pending' && job.status !== 'processing') {
      res.status(400).json({ error: 'Cannot cancel completed or failed jobs' });
      return;
    }

    // Update job status to cancelled
    await updateJobStatus(jobId, 'failed', undefined, undefined, 'Job cancelled by user');

    res.json({
      success: true,
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ 
      error: 'Failed to cancel job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const generateVariations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { base64Image, variationPrompt, size, quality, format, compression, background } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!base64Image || !variationPrompt) {
      res.status(400).json({ error: 'Base64 image data and variation prompt are required' });
      return;
    }

    const result = await imageGenerationService.generateVariations(
      base64Image,
      variationPrompt,
      { size, quality, format, compression, background }
    );

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error generating variations:', error);
    res.status(500).json({ 
      error: 'Failed to generate variations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const editImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, base64Image, base64Mask, size, quality, format } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!prompt || !base64Image) {
      res.status(400).json({ error: 'Prompt and base64 image data are required' });
      return;
    }

    const result = await imageGenerationService.editImage({
      prompt,
      base64Image,
      base64Mask,
      size,
      quality,
      format,
    });

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error editing image:', error);
    res.status(500).json({ 
      error: 'Failed to edit image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const generateEnhancedImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, style, size, quality, format, compression, background } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
      return;
    }

    const result = await imageGenerationService.generateEnhancedImages(
      prompt,
      style,
      { size, quality, format, compression, background }
    );

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error generating enhanced images:', error);
    res.status(500).json({ 
      error: 'Failed to generate enhanced images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const generateSocialMediaImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, platform } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!prompt || !platform) {
      res.status(400).json({ error: 'Prompt and platform are required' });
      return;
    }

    if (!['instagram', 'twitter', 'linkedin', 'facebook'].includes(platform)) {
      res.status(400).json({ error: 'Invalid platform. Must be instagram, twitter, linkedin, or facebook' });
      return;
    }

    const result = await imageGenerationService.generateSocialMediaImages(prompt, platform);

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error generating social media images:', error);
    res.status(500).json({ 
      error: 'Failed to generate social media images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const generateBlogImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const result = await imageGenerationService.generateBlogImages(title, category);

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error generating blog images:', error);
    res.status(500).json({ 
      error: 'Failed to generate blog images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const getAvailableModels = async (req: Request, res: Response): Promise<void> => {
  try {
    const models = imageGenerationService.getAvailableModels();
    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error('Error getting available models:', error);
    res.status(500).json({ 
      error: 'Failed to get available models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getImageGenerationOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const options = imageGenerationService.getImageGenerationOptions();
    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Error getting image generation options:', error);
    res.status(500).json({ 
      error: 'Failed to get image generation options',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const convertBase64ToDataUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { base64Data, format } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!base64Data) {
      res.status(400).json({ error: 'Base64 data is required' });
      return;
    }

    const dataUrl = imageGenerationService.base64ToDataUrl(base64Data, format);

    res.json({
      success: true,
      data: { dataUrl },
    });
    return;
  } catch (error) {
    console.error('Error converting base64 to data URL:', error);
    res.status(500).json({ 
      error: 'Failed to convert base64 to data URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const convertDataUrlToBase64 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataUrl } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!dataUrl) {
      res.status(400).json({ error: 'Data URL is required' });
      return;
    }

    const base64Data = imageGenerationService.dataUrlToBase64(dataUrl);

    res.json({
      success: true,
      data: { base64Data },
    });
    return;
  } catch (error) {
    console.error('Error converting data URL to base64:', error);
    res.status(500).json({ 
      error: 'Failed to convert data URL to base64',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
}; 