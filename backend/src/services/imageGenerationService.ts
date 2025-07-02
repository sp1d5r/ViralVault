import OpenAI from 'openai';

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
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  result?: any;
  error?: any;
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
      // Build the tool configuration
      const toolConfig: any = {
        type: 'image_generation',
      };

      // Only add properties if they're not 'auto' or default
      if (size !== 'auto') toolConfig.size = size;
      if (quality !== 'auto') toolConfig.quality = quality;
      if (format !== 'png') toolConfig.format = format;
      if (background !== 'auto') toolConfig.background = background;
      if (compression !== undefined && (format === 'jpeg' || format === 'webp')) {
        toolConfig.compression = compression;
      }

      // Create background job using OpenAI's Background Jobs API
      const job = await this.client.beta.backgroundJobs.create({
        model: this.defaultModel,
        input: prompt,
        tools: [toolConfig],
      });

      return {
        id: job.id,
        status: job.status,
        created_at: job.created_at,
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
      const job = await this.client.beta.backgroundJobs.retrieve(jobId);
      
      return {
        id: job.id,
        status: job.status,
        result: job.result,
        error: job.error,
        created_at: job.created_at,
        completed_at: job.completed_at,
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
      const job = await this.client.beta.backgroundJobs.cancel(jobId);
      
      return {
        id: job.id,
        status: job.status,
        result: job.result,
        error: job.error,
        created_at: job.created_at,
        completed_at: job.completed_at,
      };
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw new Error(`Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract image results from a completed job
   */
  extractImageResults(job: BackgroundJob): ImageGenerationResult[] {
    if (job.status !== 'succeeded' || !job.result) {
      throw new Error('Job not completed or no result available');
    }

    // Extract image generation results from the job result
    const imageResults = job.result.output
      .filter((output: any) => output.type === 'image_generation_call')
      .map((output: any) => ({
        base64Data: output.result,
        revisedPrompt: output.revised_prompt,
        size: output.size || 'auto',
        model: 'gpt-image-1',
        created: job.created_at,
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
      // Build the tool configuration - keeping it simple like the example
      const toolConfig: any = {
        type: 'image_generation',
      };

      // Only add properties if they're not 'auto' or default
      if (size !== 'auto') toolConfig.size = size;
      if (quality !== 'auto') toolConfig.quality = quality;
      if (format !== 'png') toolConfig.format = format;
      if (background !== 'auto') toolConfig.background = background;
      if (compression !== undefined && (format === 'jpeg' || format === 'webp')) {
        toolConfig.compression = compression;
      }

      const response = await this.client.responses.create({
        model: this.defaultModel,
        input: prompt,
        tools: [toolConfig],
      });

      // Extract image generation results following the example pattern
      const imageResults = response.output
        .filter((output: any) => output.type === 'image_generation_call')
        .map((output: any) => ({
          base64Data: output.result,
          revisedPrompt: output.revised_prompt,
          size: output.size || size,
          model: 'gpt-image-1',
          created: Date.now(),
          format: output.format || format,
        }));

      if (imageResults.length === 0) {
        throw new Error('No images were generated');
      }

      return imageResults;
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
      // Build the tool configuration
      const toolConfig: any = {
        type: 'image_generation',
      };

      // Only add properties if they're not 'auto' or default
      if (size !== 'auto') toolConfig.size = size;
      if (quality !== 'auto') toolConfig.quality = quality;
      if (format !== 'png') toolConfig.format = format;

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
        tools: [toolConfig],
      });

      // Extract image generation results
      const imageResults = response.output
        .filter((output: any) => output.type === 'image_generation_call')
        .map((output: any) => ({
          base64Data: output.result,
          revisedPrompt: output.revised_prompt,
          size: output.size || size,
          model: 'gpt-image-1',
          created: Date.now(),
          format: output.format || format,
        }));

      if (imageResults.length === 0) {
        throw new Error('No images were generated from edit');
      }

      return imageResults;
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
}

// Create singleton instance
export const imageGenerationService = new ImageGenerationService(); 