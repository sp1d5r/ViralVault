import { Request, Response } from 'express';
import { imageGenerationService, ImageGenerationResult } from '../services/imageGenerationService';
import { FirebaseDatabaseService } from 'shared';
import { r2Service } from '../services/r2Service';

export const generateImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, size, quality, format, compression, background, async = false, storyId, slideNumber } = req.body;
    const userId = req.user?.uid;

    console.log('generateImages called with:', { 
      prompt: prompt?.substring(0, 100) + '...', 
      size, 
      quality, 
      format, 
      async, 
      storyId, 
      slideNumber,
      userId 
    });

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
        storyId: storyId || null,
        slideNumber: slideNumber || null,
        options: Object.fromEntries(
          Object.entries({ size, quality, format, compression, background })
            .filter(([_, value]) => value !== undefined)
        ),
        status: backgroundJob.status,
        progress: 0,
        createdAt: backgroundJob.created_at,
        updatedAt: Date.now(),
      };

      console.log('Creating job with data:', { 
        jobId: jobData.jobId, 
        storyId: jobData.storyId, 
        slideNumber: jobData.slideNumber 
      });

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
        data: {
          jobId: backgroundJob.id,
          status: backgroundJob.status,
          message: 'Image generation job created. Use the jobId to check status.',
        },
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

    // Get job from Firebase by querying the jobId field
    const jobs = await new Promise<any[]>((resolve, reject) => {
      FirebaseDatabaseService.queryDocuments(
        'image-generation-jobs',
        'jobId',
        'createdAt',
        jobId,
        (docs) => resolve(docs || []),
        (error) => reject(error)
      );
    });

    const job = jobs.length > 0 ? jobs[0] : null;

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
      // Skip OpenAI polling if job is already completed in Firebase
      if (job.status === 'completed' && job.result && job.result.imageUrl) {
        console.log('Job already completed in Firebase, skipping OpenAI poll');
        res.json({
          success: true,
          job,
        });
        return;
      }

      console.log('Polling OpenAI for job status:', jobId);
      const openaiJobStatus = await imageGenerationService.getJobStatus(jobId);
      console.log('OpenAI job status received:', {
        status: openaiJobStatus.status,
        hasResult: !!openaiJobStatus.result,
        resultLength: openaiJobStatus.result?.length,
        error: openaiJobStatus.error,
        completedAt: openaiJobStatus.completed_at
      });
      
      // Update Firebase with the latest status
      const updateData: {
        status: string;
        updatedAt: number;
        result?: any;
        completedAt?: number;
        progress?: number;
        error?: string;
      } = {
        status: openaiJobStatus.status,
        updatedAt: Date.now(),
      };

      if (openaiJobStatus.status === 'completed' && openaiJobStatus.result) {
        console.log('Result type:', typeof openaiJobStatus.result);
        console.log('Result is array:', Array.isArray(openaiJobStatus.result));
        console.log('Result length:', openaiJobStatus.result.length);
        console.log('First item keys:', Object.keys(openaiJobStatus.result[0] || {}));
        console.log('First item types:', Object.fromEntries(
          Object.entries(openaiJobStatus.result[0] || {}).map(([key, value]) => [key, typeof value])
        ));
        
        // Check if we already have a result with an imageUrl (prevent duplicate uploads)
        if (job.result && job.result.imageUrl) {
          console.log('Job already has an image URL, skipping upload:', job.result.imageUrl);
          updateData.result = job.result;
          updateData.completedAt = openaiJobStatus.completed_at;
          updateData.progress = 100;
          // Don't set error to undefined - just omit it
        } else {
          // Upload base64 image to R2 and store URL in Firebase
          const img = openaiJobStatus.result[0];
          const fileName = `slide-${job.slideNumber || 'unknown'}-${Date.now()}.png`;
          
          try {
            console.log('Uploading image to R2...');
            console.log('Base64 data length:', img.base64Data?.length || 0);
            console.log('File name:', fileName);
            console.log('User ID:', userId);
            
            const imageUrl = await r2Service.uploadBase64Image(
              img.base64Data,
              fileName,
              userId,
              'image/png'
            );
            
            console.log('R2 upload successful, URL:', imageUrl);
            
            updateData.result = {
              imageUrl: imageUrl,
              revisedPrompt: String(img.revisedPrompt || ''),
              size: String(img.size || 'auto'),
              model: String(img.model || 'gpt-image-1'),
              created: Number(img.created || Date.now()),
              format: String(img.format || 'png'),
            };
            updateData.completedAt = openaiJobStatus.completed_at;
            updateData.progress = 100;
            // Don't set error to undefined - just omit it
            
            console.log('Updated result data:', updateData.result);
          } catch (uploadError) {
            console.error('Error uploading image to R2:', uploadError);
            updateData.error = 'Failed to upload image to storage';
            updateData.completedAt = openaiJobStatus.completed_at;
            // Don't set result to undefined - just omit it
          }
        }
      } else if (openaiJobStatus.status === 'failed' && openaiJobStatus.error) {
        console.log('OpenAI job failed:', openaiJobStatus.error);
        updateData.error = openaiJobStatus.error;
        updateData.completedAt = openaiJobStatus.completed_at;
        // Don't set result to undefined - just omit it
      } else if (openaiJobStatus.status === 'in_progress') {
        console.log('OpenAI job still in progress');
        updateData.progress = 50; // Estimate progress
      } else {
        console.log('OpenAI job status:', openaiJobStatus.status, 'but no result or error');
      }

      // Remove undefined values before updating Firebase
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      // Update Firebase using the document ID from the job
      await new Promise<void>((resolve, reject) => {
        FirebaseDatabaseService.updateDocument(
          'image-generation-jobs',
          job.id, // Use the Firebase document ID, not the OpenAI job ID
          cleanUpdateData,
          () => resolve(),
          (error) => reject(error)
        );
      });

      // Return the updated job data
      const updatedJob = {
        ...job,
        ...cleanUpdateData,
      };

      res.json({
        success: true,
        job: updatedJob,
      });
    } catch (openaiError) {
      console.error('Error polling OpenAI job status:', openaiError);
      console.error('Error details:', {
        message: openaiError instanceof Error ? openaiError.message : 'Unknown error',
        stack: openaiError instanceof Error ? openaiError.stack : undefined,
        jobId,
        currentJobStatus: job.status,
        hasResult: !!job.result,
        hasError: !!job.error,
        lastUpdated: job.updatedAt
      });
      
      // Check if the job is already completed in Firebase
      if (job.status === 'completed' && job.result && job.result.imageUrl) {
        console.log('Job already completed in Firebase, returning cached data');
        res.json({
          success: true,
          job,
          warning: 'OpenAI API temporarily unavailable - using cached completed data',
        });
      } else if (job.status === 'failed' && job.error) {
        console.log('Job already failed in Firebase, returning cached data');
        res.json({
          success: true,
          job,
          warning: 'OpenAI API temporarily unavailable - using cached failed data',
        });
      } else if (job.status === 'in_progress' || job.status === 'queued' || job.status === 'processing') {
        // Job is still pending but we can't reach OpenAI
        console.log('Job still pending, but OpenAI API unavailable');
        res.json({
          success: true,
          job,
          warning: 'OpenAI API temporarily unavailable - job may still be processing',
        });
      } else {
        // Unknown status
        console.log('Unknown job status, returning cached data');
        res.json({
          success: true,
          job,
          warning: 'OpenAI API temporarily unavailable - using cached data',
        });
      }
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

// Get jobs by story and slide
export const getJobsByStoryAndSlide = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storyId, slideNumber } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!storyId || !slideNumber) {
      res.status(400).json({ error: 'Story ID and slide number are required' });
      return;
    }

    console.log('getJobsByStoryAndSlide called with:', { storyId, slideNumber, userId });

    // Get jobs for specific story and slide from Firebase
    const jobs = await new Promise<any[]>((resolve, reject) => {
      FirebaseDatabaseService.queryDocuments(
        'image-generation-jobs',
        'userId',
        'createdAt',
        userId,
        (docs) => {
          console.log('Raw jobs from Firebase:', docs?.length || 0);
          console.log('Sample job data:', docs?.[0]);
          
          // Filter by storyId and slideNumber
          const filteredJobs = docs?.filter((job: any) => {
            console.log('Checking job:', {
              jobStoryId: job.storyId,
              jobSlideNumber: job.slideNumber,
              targetStoryId: storyId,
              targetSlideNumber: parseInt(slideNumber),
              storyIdMatch: job.storyId === storyId,
              slideNumberMatch: job.slideNumber === parseInt(slideNumber)
            });
            
            // Handle both null storyId and specific storyId
            const storyIdMatch = job.storyId === storyId || (storyId === 'null' && job.storyId === null);
            const slideNumberMatch = job.slideNumber === parseInt(slideNumber);
            
            return storyIdMatch && slideNumberMatch;
          }) || [];
          
          console.log('Filtered jobs:', filteredJobs.length);
          resolve(filteredJobs);
        },
        (error) => reject(error)
      );
    });

    console.log('Final result:', jobs.length, 'jobs found');

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error('Error getting jobs by story and slide:', error);
    res.status(500).json({ 
      error: 'Failed to get jobs',
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

    // Get job from Firebase by querying the jobId field
    const jobs = await new Promise<any[]>((resolve, reject) => {
      FirebaseDatabaseService.queryDocuments(
        'image-generation-jobs',
        'jobId',
        'createdAt',
        jobId,
        (docs) => resolve(docs || []),
        (error) => reject(error)
      );
    });

    const job = jobs.length > 0 ? jobs[0] : null;

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
        job.id, // Use the Firebase document ID, not the OpenAI job ID
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

// Utility function to clean up jobs with contradictory data
export const cleanupContradictoryJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get all user's jobs from Firebase
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

    let cleanedCount = 0;
    const updates: Promise<void>[] = [];

    for (const job of jobs) {
      // Check for contradictory data: both error and result exist
      if (job.status === 'completed' && job.error && job.result && job.result.imageUrl) {
        console.log('Cleaning up contradictory job:', job.jobId);
        
        // Prioritize the result and clear the error
        const updatePromise = new Promise<void>((resolve, reject) => {
          FirebaseDatabaseService.updateDocument(
            'image-generation-jobs',
            job.id,
            {
              error: undefined, // Clear the error
              updatedAt: Date.now(),
            },
            () => resolve(),
            (error) => reject(error)
          );
        });
        
        updates.push(updatePromise);
        cleanedCount++;
      }
    }

    // Wait for all updates to complete
    await Promise.all(updates);

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} jobs with contradictory data`,
      cleanedCount,
    });
  } catch (error) {
    console.error('Error cleaning up contradictory jobs:', error);
    res.status(500).json({ 
      error: 'Failed to clean up jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 