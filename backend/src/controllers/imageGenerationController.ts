import { Request, Response } from 'express';
import { imageGenerationService, ImageGenerationResult } from '../services/imageGenerationService';
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
      // Create background job using OpenAI's Background Jobs API
      const backgroundJob = await imageGenerationService.createImageGenerationJob({
        prompt,
        size,
        quality,
        format,
        compression,
        background,
      });
      
      // Store job in Firebase for tracking
      const jobData = {
        jobId: backgroundJob.id,
        openaiJobId: backgroundJob.id,
        userId,
        prompt,
        options: { size, quality, format, compression, background },
        status: backgroundJob.status,
        progress: 0,
        createdAt: backgroundJob.created_at,
        updatedAt: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        FirebaseDatabaseService.addDocument(
          'image-generation-jobs',
          jobData,
          () => resolve(),
          (error) => reject(error)
        );
      });

      res.json({
        success: true,
        jobId: backgroundJob.id,
        status: backgroundJob.status,
        message: 'Image generation job created. Use the jobId to check status.',
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

    // Poll OpenAI for the latest job status
    try {
      const openaiJobStatus = await imageGenerationService.getJobStatus(jobId);
      
      // Update Firebase with the latest status
      const updateData: {
        status: string;
        updatedAt: number;
        result?: ImageGenerationResult[];
        completedAt?: number;
        progress?: number;
        error?: string;
      } = {
        status: openaiJobStatus.status,
        updatedAt: Date.now(),
      };

      if (openaiJobStatus.status === 'completed' && openaiJobStatus.result) {
        updateData.result = openaiJobStatus.result;
        updateData.completedAt = openaiJobStatus.completed_at;
        updateData.progress = 100;
      } else if (openaiJobStatus.status === 'failed' && openaiJobStatus.error) {
        updateData.error = openaiJobStatus.error;
        updateData.completedAt = openaiJobStatus.completed_at;
      } else if (openaiJobStatus.status === 'in_progress') {
        updateData.progress = 50; // Estimate progress
      }

      // Update Firebase
      await new Promise<void>((resolve, reject) => {
        FirebaseDatabaseService.updateDocument(
          'image-generation-jobs',
          jobId,
          updateData,
          () => resolve(),
          (error) => reject(error)
        );
      });

      // Return the updated job data
      const updatedJob = {
        ...job,
        ...updateData,
      };

      res.json({
        success: true,
        job: updatedJob,
      });
    } catch (openaiError) {
      console.error('Error polling OpenAI job status:', openaiError);
      // Return the cached Firebase data if OpenAI polling fails
      res.json({
        success: true,
        job,
        warning: 'Unable to fetch latest status from OpenAI',
      });
    }
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
    await new Promise<void>((resolve, reject) => {
      FirebaseDatabaseService.updateDocument(
        'image-generation-jobs',
        jobId,
        {
          status: 'failed',
          error: 'Job cancelled by user',
          updatedAt: Date.now(),
          completedAt: Date.now(),
        },
        () => resolve(),
        (error) => reject(error)
      );
    });

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