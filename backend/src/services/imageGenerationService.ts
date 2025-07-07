import OpenAI from 'openai';
import { FirebaseDatabaseService } from 'shared';

export interface ImageGenerationOptions {
  prompt: string;
  size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
  compression?: number; // 0-100 for JPEG and WebP
  background?: 'auto' | 'transparent' | 'opaque';
}

export interface ImageGenerationResult {
  base64Data: string;
  revisedPrompt?: string;
  size: string;
  model: string;
  created: number;
  format: string;
}

export interface ImageEditOptions {
  prompt: string;
  base64Image: string;
  base64Mask?: string;
  size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
}

export interface BackgroundJob {
  id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'incomplete';
  result?: ImageGenerationResult[];
  error?: string;
  created_at: number;
  completed_at?: number;
}

export class ImageGenerationService {
  private client: OpenAI;
  private defaultModel = 'gpt-4o-mini';

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log(process.env.OPENAI_API_KEY);
  }

  /**
   * Create a background job for image generation
   */
  async createImageGenerationJob(options: ImageGenerationOptions): Promise<BackgroundJob> {
    const {
      prompt,
      size = 'auto',
      quality = 'auto',
      format = 'png',
      compression,
      background = 'auto',
    } = options;

    try {
      // Build the image generation tool configuration
      const imageGenerationTool: any = {
        type: 'image_generation',
      };

      // Only add properties if they're not 'auto' or default
      if (size !== 'auto') imageGenerationTool.size = size;
      if (quality !== 'auto') imageGenerationTool.quality = quality;
      if (format !== 'png') imageGenerationTool.output_format = format;
      if (background !== 'auto') imageGenerationTool.background = background;
      if (compression !== undefined && (format === 'jpeg' || format === 'webp')) {
        imageGenerationTool.output_compression = compression;
      }

      // Create background job using OpenAI's Responses API
      const response = await this.client.responses.create({
        model: this.defaultModel,
        input: prompt,
        tools: [imageGenerationTool],
        background: true, // This enables background processing
      });

      return {
        id: response.id,
        status: response.status || 'queued',
        created_at: response.created_at,
      };
    } catch (error) {
      console.error('Error creating background job:', error);
      throw new Error(`Failed to create background job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the status of a background job
   */
  async getJobStatus(jobId: string): Promise<BackgroundJob> {
    try {
      const response = await this.client.responses.retrieve(jobId);

      
      let result: ImageGenerationResult[] | undefined;
      let error: string | undefined;

      if (response.status === 'completed' && response.output) {
        try {
          result = this.extractImageResults(response);
        } catch (extractError) {
          error = extractError instanceof Error ? extractError.message : 'Failed to extract image results';
        }
      } else if (response.status === 'failed' && response.error) {
        error = response.error.message;
      }

      return {
        id: response.id,
        status: response.status || 'queued',
        result,
        error,
        created_at: response.created_at,
        completed_at: response.status === 'completed' || response.status === 'failed' ? Date.now() : undefined,
      };
    } catch (error) {
      console.error('Error retrieving job status:', error);
      throw new Error(`Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel a background job
   */
  async cancelJob(jobId: string): Promise<BackgroundJob> {
    try {
      await this.client.responses.cancel(jobId);
      
      // Get the updated status after cancellation
      return this.getJobStatus(jobId);
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw new Error(`Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract image results from a completed response
   */
  extractImageResults(response: any): ImageGenerationResult[] {
    if (response.status !== 'completed' || !response.output) {
      throw new Error('Response not completed or no output available');
    }

    // Extract image generation results from the response output
    const imageResults = response.output
      .filter((output: any) => output.type === 'image_generation_call')
      .map((output: any) => ({
        base64Data: output.result || '',
        revisedPrompt: output.revised_prompt,
        size: output.size || 'auto',
        model: 'gpt-image-1',
        created: response.created_at,
        format: output.format || 'png',
      }));

    if (imageResults.length === 0) {
      throw new Error('No images were generated');
    }

    return imageResults;
  }

  /**
   * Generate images synchronously (fallback for simple cases)
   */
  async generateImages(options: ImageGenerationOptions): Promise<ImageGenerationResult[]> {
    const {
      prompt,
      size = 'auto',
      quality = 'auto',
      format = 'png',
      compression,
      background = 'auto',
    } = options;

    try {
      // Build the image generation tool configuration
      const imageGenerationTool: any = {
        type: 'image_generation',
      };

      // Only add properties if they're not 'auto' or default
      if (size !== 'auto') imageGenerationTool.size = size;
      if (quality !== 'auto') imageGenerationTool.quality = quality;
      if (format !== 'png') imageGenerationTool.output_format = format;
      if (background !== 'auto') imageGenerationTool.background = background;
      if (compression !== undefined && (format === 'jpeg' || format === 'webp')) {
        imageGenerationTool.output_compression = compression;
      }

      const response = await this.client.responses.create({
        model: this.defaultModel,
        input: prompt,
        tools: [imageGenerationTool],
        background: false, // Synchronous processing
      });

      return this.extractImageResults(response);
    } catch (error) {
      console.error('Error generating images:', error);
      throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Edit an existing image using the Responses API
   */
  async editImage(options: ImageEditOptions): Promise<ImageGenerationResult[]> {
    const { prompt, base64Image, base64Mask, size = 'auto', quality = 'auto', format = 'png' } = options;

    try {
      // Build the image generation tool configuration
      const imageGenerationTool: any = {
        type: 'image_generation',
      };

      // Only add properties if they're not 'auto' or default
      if (size !== 'auto') imageGenerationTool.size = size;
      if (quality !== 'auto') imageGenerationTool.quality = quality;
      if (format !== 'png') imageGenerationTool.output_format = format;

      // Create the input with the image
      const inputs: any[] = [
        { type: 'text', text: prompt },
        { type: 'image', image: { data: base64Image } }
      ];

      // Add mask if provided
      if (base64Mask) {
        inputs.push({ type: 'image', image: { data: base64Mask } });
      }

      const response = await this.client.responses.create({
        model: this.defaultModel,
        input: inputs,
        tools: [imageGenerationTool],
        background: false, // Synchronous processing
      });

      return this.extractImageResults(response);
    } catch (error) {
      console.error('Error editing image:', error);
      throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate image variations using multi-turn conversation
   */
  async generateVariations(
    base64Image: string,
    variationPrompt: string,
    options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult[]> {
    try {
      // For variations, we'll use a different approach - just generate a new image
      // based on the variation prompt, since the Responses API doesn't support
      // direct image input in the same way as the old DALL-E API
      const enhancedPrompt = `${variationPrompt}, based on the reference image style and composition`;

      return this.generateImages({
        prompt: enhancedPrompt,
        size: options?.size || 'auto',
        quality: options?.quality || 'auto',
        format: options?.format || 'png',
        compression: options?.compression,
        background: options?.background || 'auto',
      });
    } catch (error) {
      console.error('Error generating image variations:', error);
      throw new Error(`Failed to generate variations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate images with enhanced prompt engineering
   */
  async generateEnhancedImages(
    basePrompt: string,
    style?: string,
    options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult[]> {
    let enhancedPrompt = basePrompt;

    // Add style enhancements if provided
    if (style) {
      enhancedPrompt = `${basePrompt}, ${style}`;
    }

    // Add quality enhancements for better results
    enhancedPrompt += ', high quality, detailed, professional';

    return this.generateImages({
      prompt: enhancedPrompt,
      size: '1024x1024',
      quality: 'high',
      format: 'png',
      ...options,
    });
  }

  /**
   * Generate images for social media posts
   */
  async generateSocialMediaImages(
    prompt: string,
    platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook'
  ): Promise<ImageGenerationResult[]> {
    const platformPrompts = {
      instagram: `${prompt}, Instagram aesthetic, trendy, visually appealing`,
      twitter: `${prompt}, Twitter post, clean design, professional`,
      linkedin: `${prompt}, LinkedIn professional, business appropriate`,
      facebook: `${prompt}, Facebook post, engaging, colorful`,
    };

    return this.generateImages({
      prompt: platformPrompts[platform],
      size: '1024x1024',
      quality: 'high',
      format: 'png',
    });
  }

  /**
   * Generate images for blog posts
   */
  async generateBlogImages(
    title: string,
    category?: string
  ): Promise<ImageGenerationResult[]> {
    let prompt = `Blog header image for: "${title}"`;

    if (category) {
      prompt += `, ${category} theme`;
    }

    prompt += ', modern design, clean layout, professional, suitable for blog header';

    return this.generateImages({
      prompt,
      size: '1536x1024', // Wide format for blog headers
      quality: 'high',
      format: 'png',
    });
  }

  /**
   * Validate prompt for content policy
   */
  async validatePrompt(prompt: string): Promise<{ isValid: boolean; reason?: string }> {
    // Basic content policy validation
    const forbiddenTerms = [
      'nude', 'naked', 'explicit', 'pornographic', 'violence', 'gore',
      'hate', 'discrimination', 'illegal', 'weapon', 'drug'
    ];

    const lowerPrompt = prompt.toLowerCase();
    for (const term of forbiddenTerms) {
      if (lowerPrompt.includes(term)) {
        return {
          isValid: false,
          reason: `Prompt contains forbidden term: ${term}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Convert base64 image data to a data URL
   */
  base64ToDataUrl(base64Data: string, format: string = 'png'): string {
    return `data:image/${format};base64,${base64Data}`;
  }

  /**
   * Convert data URL to base64
   */
  dataUrlToBase64(dataUrl: string): string {
    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid data URL format');
    }
    return matches[2];
  }

  /**
   * Get available models and their capabilities
   */
  getAvailableModels() {
    return {
      'gpt-4o': {
        name: 'GPT-4o',
        description: 'Latest model with highest quality',
        supportsImageGeneration: true,
      },
      'gpt-4o-mini': {
        name: 'GPT-4o Mini',
        description: 'Fast and efficient model',
        supportsImageGeneration: true,
      },
      'gpt-4.1': {
        name: 'GPT-4.1',
        description: 'High performance model',
        supportsImageGeneration: true,
      },
      'gpt-4.1-mini': {
        name: 'GPT-4.1 Mini',
        description: 'Balanced performance and speed',
        supportsImageGeneration: true,
      },
      'gpt-4.1-nano': {
        name: 'GPT-4.1 Nano',
        description: 'Fastest model',
        supportsImageGeneration: true,
      },
      'o3': {
        name: 'O3',
        description: 'Latest experimental model',
        supportsImageGeneration: true,
      },
    };
  }

  /**
   * Get available image generation options
   */
  getImageGenerationOptions() {
    return {
      sizes: ['auto', '1024x1024', '1024x1536', '1536x1024'],
      qualities: ['auto', 'low', 'medium', 'high'],
      formats: ['png', 'jpeg', 'webp'],
      backgrounds: ['auto', 'transparent', 'opaque'],
      compression: '0-100 (for JPEG and WebP)',
    };
  }

  /**
   * Download image from URL and convert to base64
   */
  async downloadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      console.log('Downloading image from URL:', imageUrl);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      
      console.log('Successfully converted image to base64, length:', base64.length);
      return base64;
    } catch (error) {
      console.error('Error downloading image as base64:', error);
      throw new Error(`Failed to download image as base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the most recent successful image URL from a specific slide for character consistency
   */
  async getReferenceImageForSlide(storyId: string, slideNumber: number, userId: string): Promise<string | null> {
    try {
      console.log('Getting reference image for slide:', { storyId, slideNumber, userId });
      
      // Get all jobs for this story and slide
      const jobs = await new Promise<any[]>((resolve, reject) => {
        FirebaseDatabaseService.queryDocuments(
          'image-generation-jobs',
          'userId',
          'createdAt',
          userId,
          (docs: any[]) => {
            const filteredJobs = docs?.filter((job: any) => {
              const storyIdMatch = job.storyId === storyId;
              const jobSlideNumber = typeof job.slideNumber === 'string' ? parseInt(job.slideNumber) : job.slideNumber;
              const targetSlideNumber = slideNumber;
              return storyIdMatch && jobSlideNumber === targetSlideNumber;
            }) || [];
            resolve(filteredJobs);
          },
          (error: Error) => reject(error)
        );
      });

      if (jobs.length === 0) {
        console.log('No jobs found for slide:', slideNumber);
        return null;
      }

      // Sort by creation date (most recent first) and find the first successful one with an image URL
      const sortedJobs = jobs.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log('Available jobs for slide', slideNumber, ':', sortedJobs.map(job => ({
        jobId: job.jobId,
        status: job.status,
        hasResult: !!job.result,
        hasImageUrl: !!job.result?.imageUrl,
        createdAt: job.createdAt
      })));
      
      // First, try to find the most recent completed job with an image URL
      let successfulJob = sortedJobs.find(job => 
        job.status === 'completed' && 
        job.result && 
        job.result.imageUrl
      );
      
      // If no completed job with image URL found, look for any job with image URL
      // (this handles cases where a job might be completed but not yet updated in Firebase)
      if (!successfulJob) {
        successfulJob = sortedJobs.find(job => 
          job.result && 
          job.result.imageUrl
        );
      }
      
      // If still no job with image URL, look for the most recent completed job
      // (it might have the image URL in a different format or we can try to refresh it)
      if (!successfulJob) {
        successfulJob = sortedJobs.find(job => 
          job.status === 'completed'
        );
      }

      if (!successfulJob) {
        console.log('No successful jobs found for slide:', slideNumber);
        return null;
      }

      console.log('Found successful job for reference:', {
        jobId: successfulJob.jobId,
        status: successfulJob.status,
        hasResult: !!successfulJob.result,
        hasImageUrl: !!successfulJob.result?.imageUrl,
        imageUrl: successfulJob.result?.imageUrl
      });

      // Return the image URL directly
      return successfulJob.result.imageUrl;
    } catch (error) {
      console.error('Error getting reference image:', error);
      return null;
    }
  }

  /**
   * Create a background job for image generation with character consistency
   */
  async createImageGenerationJobWithConsistency(
    options: ImageGenerationOptions & { 
      storyId?: string; 
      slideNumber?: number; 
      userId?: string;
      useReferenceImage?: boolean;
    }
  ): Promise<BackgroundJob> {
    const {
      prompt,
      size = 'auto',
      quality = 'auto',
      format = 'png',
      compression,
      background = 'auto',
      storyId,
      slideNumber,
      userId,
      useReferenceImage = true,
    } = options;

    try {
      let referenceImage: string | null = null;

      // If we should use a reference image and we have the necessary parameters
      if (useReferenceImage && storyId && slideNumber && userId) {
        // Try to get reference image from the previous slide (slideNumber - 1)
        const referenceSlideNumber = slideNumber - 1;
        if (referenceSlideNumber > 0) {
          console.log('Attempting to get reference image from slide:', referenceSlideNumber);
          referenceImage = await this.getReferenceImageForSlide(storyId, referenceSlideNumber, userId);
        }
      }

      // Build the image generation tool configuration
      const imageGenerationTool: any = {
        type: 'image_generation',
      };

      // Only add properties if they're not 'auto' or default
      if (size !== 'auto') imageGenerationTool.size = size;
      if (quality !== 'auto') imageGenerationTool.quality = quality;
      if (format !== 'png') imageGenerationTool.output_format = format;
      if (background !== 'auto') imageGenerationTool.background = background;
      if (compression !== undefined && (format === 'jpeg' || format === 'webp')) {
        imageGenerationTool.output_compression = compression;
      }

      // If we have a reference image, create a multi-input request with the image
      if (referenceImage) {
        console.log('Using reference image for consistency, image URL:', referenceImage);
        const enhancedPrompt = `${prompt}, maintain character consistency with the reference image, same character design and style`;
        
        // Check if it's a URL or base64 data
        const imageInput: any = referenceImage.startsWith('http') 
          ? { type: "input_image", image_url: referenceImage, detail: "low" as const }
          : { type: "input_image", image_url: `data:image/jpeg;base64,${referenceImage}`, detail: "low" as const };
        
        const response = await this.client.responses.create({
          model: this.defaultModel,
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: enhancedPrompt },
                imageInput,
              ],
            },
          ],
          tools: [imageGenerationTool],
          background: true, // Background processing
        });

        return {
          id: response.id,
          status: response.status || 'queued',
          created_at: response.created_at,
        };
      }

      // If no reference image, use text-only input
      const response = await this.client.responses.create({
        model: this.defaultModel,
        input: prompt,
        tools: [imageGenerationTool],
        background: true, // Background processing
      });

      return {
        id: response.id,
        status: response.status || 'queued',
        created_at: response.created_at,
      };
    } catch (error) {
      console.error('Error creating background job with consistency:', error);
      throw new Error(`Failed to create background job with consistency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate images with character consistency using a reference image (synchronous fallback)
   */
  async generateImagesWithConsistency(
    options: ImageGenerationOptions & { 
      storyId?: string; 
      slideNumber?: number; 
      userId?: string;
      useReferenceImage?: boolean;
    }
  ): Promise<ImageGenerationResult[]> {
    const {
      prompt,
      size = 'auto',
      quality = 'auto',
      format = 'png',
      compression,
      background = 'auto',
      storyId,
      slideNumber,
      userId,
      useReferenceImage = true,
    } = options;

    try {
      let referenceImage: string | null = null;

      // If we should use a reference image and we have the necessary parameters
      if (useReferenceImage && storyId && slideNumber && userId) {
        // Try to get reference image from the previous slide (slideNumber - 1)
        const referenceSlideNumber = slideNumber - 1;
        if (referenceSlideNumber > 0) {
          console.log('Attempting to get reference image from slide:', referenceSlideNumber);
          referenceImage = await this.getReferenceImageForSlide(storyId, referenceSlideNumber, userId);
        }
      }

      // Build the image generation tool configuration
      const imageGenerationTool: any = {
        type: 'image_generation',
      };

      // Only add properties if they're not 'auto' or default
      if (size !== 'auto') imageGenerationTool.size = size;
      if (quality !== 'auto') imageGenerationTool.quality = quality;
      if (format !== 'png') imageGenerationTool.output_format = format;
      if (background !== 'auto') imageGenerationTool.background = background;
      if (compression !== undefined && (format === 'jpeg' || format === 'webp')) {
        imageGenerationTool.output_compression = compression;
      }

      // If we have a reference image, create a multi-input request with the image
      if (referenceImage) {
        console.log('Using reference image for consistency, image URL:', referenceImage);
        const enhancedPrompt = `${prompt}, maintain character consistency with the reference image, same character design and style`;
        
        // Check if it's a URL or base64 data
        const imageInput: any = referenceImage.startsWith('http') 
          ? { type: "input_image", image_url: referenceImage, detail: "low" as const }
          : { type: "input_image", image_url: `data:image/jpeg;base64,${referenceImage}`, detail: "low" as const };
        
        const response = await this.client.responses.create({
          model: this.defaultModel,
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: enhancedPrompt },
                imageInput,
              ],
            },
          ],
          tools: [imageGenerationTool],
          background: false, // Synchronous processing
        });

        return this.extractImageResults(response);
      }

      // If no reference image, use text-only input
      const response = await this.client.responses.create({
        model: this.defaultModel,
        input: prompt,
        tools: [imageGenerationTool],
        background: false, // Synchronous processing
      });

      return this.extractImageResults(response);
    } catch (error) {
      console.error('Error generating images with consistency:', error);
      throw new Error(`Failed to generate images with consistency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create singleton instance
export const imageGenerationService = new ImageGenerationService(); 