import { Request, Response } from 'express';
import { imageGenerationService } from '../services/imageGenerationService';
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
        slideNumber: slideNumber ? parseInt(slideNumber.toString()) : null,
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
        
        // Check if the signed URL is about to expire (within 1 hour)
        try {
          const url = new URL(job.result.imageUrl);
          const expiresParam = url.searchParams.get('X-Amz-Date');
          if (expiresParam) {
            const expiresDate = new Date(expiresParam.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
            const now = new Date();
            const hoursUntilExpiry = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            
            if (hoursUntilExpiry < 1) {
              console.log('Signed URL expires soon, refreshing...');
              const key = url.pathname.substring(1);
              const signedUrl = await r2Service.generateDownloadUrl(key, 24 * 60 * 60);
              
              // Update Firebase with the new URL
              const updateData = {
                result: {
                  ...job.result,
                  imageUrl: signedUrl.url,
                },
                updatedAt: Date.now(),
              };

              await new Promise<void>((resolve, reject) => {
                FirebaseDatabaseService.updateDocument(
                  'image-generation-jobs',
                  job.id,
                  updateData,
                  () => resolve(),
                  (error) => reject(error)
                );
              });

              // Return the updated job with new URL
              const updatedJob = {
                ...job,
                ...updateData,
              };

              res.json({
                success: true,
                job: updatedJob,
                warning: 'Image URL was automatically refreshed',
              });
              return;
            }
          }
        } catch (urlError) {
          console.log('Could not parse URL expiration, continuing with existing URL');
        }
        
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

    console.log('=== getJobsByStoryAndSlide START ===');
    console.log('Request params:', req.params);
    console.log('Request user:', req.user);
    console.log('Extracted values:', { storyId, slideNumber, userId });

    if (!userId) {
      console.log('No userId found, returning 401');
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!storyId) {
      console.log('Missing storyId, returning 400');
      res.status(400).json({ error: 'Story ID is required' });
      return;
    }

    console.log('getJobsByStoryAndSlide called with:', { storyId, slideNumber, userId });

    // Get all jobs for this user, then filter by storyId and optionally slideNumber
    const jobs = await new Promise<any[]>((resolve, reject) => {
      console.log('Querying Firebase for userId:', userId);
      FirebaseDatabaseService.queryDocuments(
        'image-generation-jobs',
        'userId',
        'createdAt',
        userId,
        (docs) => {
          console.log('Raw jobs from Firebase:', docs?.length || 0);
          console.log('Sample job data:', docs?.[0]);
          
          // Filter by storyId and optionally slideNumber
          const filteredJobs = docs?.filter((job: any) => {
            const storyIdMatch = job.storyId === storyId;
            
            // If slideNumber is provided, filter by it as well
            if (slideNumber) {
              // Ensure both values are numbers for comparison
              const jobSlideNumber = typeof job.slideNumber === 'string' ? parseInt(job.slideNumber) : job.slideNumber;
              const targetSlideNumber = parseInt(slideNumber);
              
              console.log('Checking job:', {
                jobStoryId: job.storyId,
                jobSlideNumber: job.slideNumber,
                jobSlideNumberParsed: jobSlideNumber,
                targetStoryId: storyId,
                targetSlideNumber: targetSlideNumber,
                storyIdMatch: storyIdMatch,
                slideNumberMatch: jobSlideNumber === targetSlideNumber,
                slideNumberType: typeof job.slideNumber
              });
              
              return storyIdMatch && jobSlideNumber === targetSlideNumber;
            } else {
              // Only filter by storyId
              console.log('Checking job (story only):', {
                jobStoryId: job.storyId,
                targetStoryId: storyId,
                storyIdMatch: storyIdMatch
              });
              
              return storyIdMatch;
            }
          }) || [];
          
          console.log('Filtered jobs:', filteredJobs.length);
          console.log('Filtered job details:', filteredJobs.map((job: any) => ({
            jobId: job.jobId,
            status: job.status,
            hasResult: !!job.result,
            hasImageUrl: !!job.result?.imageUrl
          })));
          resolve(filteredJobs);
        },
        (error) => {
          console.error('Firebase query error:', error);
          reject(error);
        }
      );
    });

    console.log('Final result:', jobs.length, 'jobs found');
    console.log('=== getJobsByStoryAndSlide END ===');

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

// Refresh expired signed URLs for images
export const refreshImageUrl = async (req: Request, res: Response): Promise<void> => {
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

    // Check if job has a result with an image URL
    if (!job.result || !job.result.imageUrl) {
      res.status(400).json({ error: 'Job does not have an image URL to refresh' });
      return;
    }

    // Extract the R2 key from the existing URL
    const url = new URL(job.result.imageUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    console.log('Refreshing signed URL for key:', key);

    try {
      // Generate a new signed URL
      const signedUrl = await r2Service.generateDownloadUrl(key, 24 * 60 * 60); // 24 hours
      
      // Update Firebase with the new URL
      const updateData = {
        result: {
          ...job.result,
          imageUrl: signedUrl.url,
        },
        updatedAt: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        FirebaseDatabaseService.updateDocument(
          'image-generation-jobs',
          job.id,
          updateData,
          () => resolve(),
          (error) => reject(error)
        );
      });

      console.log('Successfully refreshed image URL');

      res.json({
        success: true,
        data: {
          imageUrl: signedUrl.url,
          expiresIn: signedUrl.expiresIn,
        },
      });
    } catch (refreshError) {
      console.error('Error refreshing image URL:', refreshError);
      res.status(500).json({ 
        error: 'Failed to refresh image URL',
        details: refreshError instanceof Error ? refreshError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error refreshing image URL:', error);
    res.status(500).json({ 
      error: 'Failed to refresh image URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 

export const generateImagesWithConsistency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      prompt, 
      size, 
      quality, 
      format, 
      compression, 
      background, 
      storyId, 
      slideNumber, 
      useReferenceImage = true,
      async = false
    } = req.body;
    const userId = req.user?.uid;

    console.log('generateImagesWithConsistency called with:', { 
      prompt: prompt?.substring(0, 100) + '...', 
      size, 
      quality, 
      format, 
      storyId, 
      slideNumber,
      useReferenceImage,
      async,
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

    if (!storyId || !slideNumber) {
      res.status(400).json({ error: 'Story ID and slide number are required for consistency' });
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
        slideNumber: slideNumber ? parseInt(slideNumber.toString()) : null,
        options: Object.fromEntries(
          Object.entries({ size, quality, format, compression, background })
            .filter(([_, value]) => value !== undefined)
        ),
        status: backgroundJob.status,
        progress: 0,
        createdAt: backgroundJob.created_at,
        updatedAt: Date.now(),
      };

      console.log('Creating consistency job with data:', { 
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
          message: 'Image generation job created with consistency. Use the jobId to check status.',
        },
      });
    } else {
      // Synchronous generation
      const result = await imageGenerationService.generateImagesWithConsistency({
        prompt,
        size,
        quality,
        format,
        compression,
        background,
        storyId,
        slideNumber: parseInt(slideNumber.toString()),
        userId,
        useReferenceImage,
      });

      res.json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    console.error('Error generating images with consistency:', error);
    res.status(500).json({ 
      error: 'Failed to generate images with consistency',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 

// Generate all images automatically for a story
export const generateAllImagesAutomatically = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storyId, useCharacterConsistency = true } = req.body;
    const userId = req.user?.uid;

    console.log('generateAllImagesAutomatically called with:', { 
      storyId, 
      useCharacterConsistency,
      userId 
    });

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!storyId) {
      res.status(400).json({ error: 'Story ID is required' });
      return;
    }

    // Get story details to understand how many slides need images
    const story = await new Promise<any>((resolve, reject) => {
      FirebaseDatabaseService.getDocument(
        'stories',
        storyId,
        (doc) => resolve(doc),
        (error) => reject(error)
      );
    });

    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }

    if (story.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const slides = story.generatedStory?.slides || [];
    if (slides.length === 0) {
      res.status(400).json({ error: 'No slides found in story' });
      return;
    }

    // Create a master job record for tracking the entire sequence
    const masterJobId = `auto-gen-${storyId}-${Date.now()}`;
    const masterJobData = {
      jobId: masterJobId,
      type: 'auto-generation-sequence',
      userId,
      storyId,
      totalSlides: slides.length,
      currentSlide: 0,
      status: 'starting',
      progress: 0,
      slideJobs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Store master job in Firebase
    await new Promise<void>((resolve, reject) => {
      FirebaseDatabaseService.addDocument(
        'image-generation-jobs',
        masterJobData,
        () => resolve(),
        (error) => reject(error)
      );
    });

    // Immediately return response to client
    res.json({
      success: true,
      data: {
        masterJobId,
        message: 'Automatic image generation started. Images will be generated sequentially.',
        totalSlides: slides.length,
        estimatedTime: `${Math.ceil(slides.length * 2)} minutes`,
      },
    });

    // Continue processing in background (Lambda will continue running)
    // This is the key - we return the response but keep the Lambda alive
    setImmediate(async () => {
      try {
        console.log(`Starting automatic generation for story ${storyId} with ${slides.length} slides`);
        
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const slideNumber = slide.slideNumber;
          
          console.log(`Processing slide ${slideNumber}/${slides.length}`);
          
          // Update master job status
          await new Promise<void>((resolve, reject) => {
            FirebaseDatabaseService.updateDocument(
              'image-generation-jobs',
              masterJobId,
              {
                currentSlide: slideNumber,
                status: 'generating',
                progress: Math.round((i / slides.length) * 100),
                updatedAt: Date.now(),
              },
              () => resolve(),
              (error) => reject(error)
            );
          });

          try {
            // Generate image for this slide
            let imageResult;
            
            if (useCharacterConsistency && slideNumber > 1) {
              // Use character consistency for subsequent slides
              imageResult = await imageGenerationService.generateImagesWithConsistency({
                prompt: slide.imagePrompt,
                storyId,
                slideNumber,
                userId,
                useReferenceImage: true,
              });
            } else {
              // Generate first slide normally
              imageResult = await imageGenerationService.generateImages({
                prompt: slide.imagePrompt,
              });
            }

            if (imageResult && imageResult.length > 0) {
              // Upload image to R2
              const imageData = imageResult[0];
              const fileName = `auto-generated-${Date.now()}.${imageData.format}`;
              
              const imageUrl = await r2Service.uploadBase64Image(
                imageData.base64Data,
                fileName,
                userId,
                `image/${imageData.format}`
              );

              if (imageUrl) {
                // Create individual job record for this slide
                const slideJobData = {
                  jobId: `${masterJobId}-slide-${slideNumber}`,
                  masterJobId,
                  openaiJobId: 'auto-generated',
                  userId,
                  prompt: slide.imagePrompt,
                  storyId,
                  slideNumber,
                  status: 'completed',
                  progress: 100,
                  result: {
                    imageUrl: imageUrl,
                    size: imageData.size,
                    model: imageData.model,
                    format: imageData.format,
                  },
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };

                await new Promise<void>((resolve, reject) => {
                  FirebaseDatabaseService.addDocument(
                    'image-generation-jobs',
                    slideJobData,
                    () => resolve(),
                    (error) => reject(error)
                  );
                });

                console.log(`Successfully generated and uploaded image for slide ${slideNumber}`);
              }
            }

            // Add delay between generations to avoid rate limits
            if (i < slides.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }

          } catch (slideError) {
            console.error(`Error generating image for slide ${slideNumber}:`, slideError);
            
            // Create error job record
            const errorJobData = {
              jobId: `${masterJobId}-slide-${slideNumber}-error`,
              masterJobId,
              openaiJobId: 'auto-generated',
              userId,
              prompt: slide.imagePrompt,
              storyId,
              slideNumber,
              status: 'error',
              progress: 0,
              error: slideError instanceof Error ? slideError.message : 'Unknown error',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            await new Promise<void>((resolve, reject) => {
              FirebaseDatabaseService.addDocument(
                'image-generation-jobs',
                errorJobData,
                () => resolve(),
                (error) => reject(error)
              );
            });
          }
        }

        // Update master job as completed
        await new Promise<void>((resolve, reject) => {
          FirebaseDatabaseService.updateDocument(
            'image-generation-jobs',
            masterJobId,
            {
              status: 'completed',
              progress: 100,
              currentSlide: slides.length,
              completedAt: Date.now(),
              updatedAt: Date.now(),
            },
            () => resolve(),
            (error) => reject(error)
          );
        });

        console.log(`Automatic generation completed for story ${storyId}`);

      } catch (error) {
        console.error('Error in background automatic generation:', error);
        
        // Update master job as failed
        await new Promise<void>((resolve, reject) => {
          FirebaseDatabaseService.updateDocument(
            'image-generation-jobs',
            masterJobId,
            {
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              updatedAt: Date.now(),
            },
            () => resolve(),
            (error) => reject(error)
          );
        });
      }
    });

  } catch (error) {
    console.error('Error starting automatic image generation:', error);
    // Note: We don't send an error response here since we already sent a success response
    // The error will be logged and handled in the background
  }
}; 

// Get master job status for automatic generation
export const getMasterJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { masterJobId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!masterJobId) {
      res.status(400).json({ error: 'Master Job ID is required' });
      return;
    }

    // Get master job from Firebase
    const masterJob = await new Promise<any>((resolve, reject) => {
      FirebaseDatabaseService.getDocument(
        'image-generation-jobs',
        masterJobId,
        (doc) => resolve(doc),
        (error) => reject(error)
      );
    });

    if (!masterJob) {
      res.status(404).json({ error: 'Master job not found' });
      return;
    }

    // Check if user owns this job
    if (masterJob.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get all slide jobs for this master job
    const slideJobs = await new Promise<any[]>((resolve, reject) => {
      FirebaseDatabaseService.queryDocuments(
        'image-generation-jobs',
        'masterJobId',
        'createdAt',
        masterJobId,
        (docs) => resolve(docs || []),
        (error) => reject(error)
      );
    });

    // Calculate overall progress
    const completedJobs = slideJobs.filter(job => job.status === 'completed');
    const errorJobs = slideJobs.filter(job => job.status === 'error');
    const totalProgress = slideJobs.length > 0 ? Math.round((completedJobs.length / slideJobs.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        masterJob: {
          ...masterJob,
          progress: totalProgress,
        },
        slideJobs: slideJobs.map(job => ({
          jobId: job.jobId,
          slideNumber: job.slideNumber,
          status: job.status,
          progress: job.progress,
          result: job.result,
          error: job.error,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        })),
        summary: {
          totalSlides: masterJob.totalSlides,
          completed: completedJobs.length,
          errors: errorJobs.length,
          inProgress: slideJobs.length - completedJobs.length - errorJobs.length,
          overallProgress: totalProgress,
        },
      },
    });
  } catch (error) {
    console.error('Error getting master job status:', error);
    res.status(500).json({ 
      error: 'Failed to get master job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 