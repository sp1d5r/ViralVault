import OpenAI from 'openai';

export interface ImageGenerationOptions {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  model?: 'dall-e-2' | 'dall-e-3';
  n?: number; // Number of images (only for DALL-E 2)
}

export interface ImageGenerationResult {
  url: string;
  revisedPrompt?: string;
  size: string;
  model: string;
  created: number;
}

export interface ImageVariationOptions {
  imageUrl: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number;
}

export interface ImageEditOptions {
  prompt: string;
  imageUrl: string;
  maskUrl?: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number;
}

export class ImageGenerationService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate images using DALL-E
   */
  async generateImages(options: ImageGenerationOptions): Promise<ImageGenerationResult[]> {
    const {
      prompt,
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      model = 'dall-e-3',
      n = 1,
    } = options;

    try {
      if (model === 'dall-e-3') {
        // DALL-E 3 only supports 1 image at a time
        const response = await this.client.images.generate({
          model: 'dall-e-3',
          prompt,
          size: size as '1024x1024' | '1792x1024' | '1024x1792',
          quality,
          style,
          n: 1,
        });

        if (!response.data) {
          throw new Error('No data received from OpenAI API');
        }

        return response.data.map((image) => ({
          url: image.url!,
          revisedPrompt: image.revised_prompt,
          size,
          model,
          created: response.created,
        }));
      } else {
        // DALL-E 2
        const response = await this.client.images.generate({
          model: 'dall-e-2',
          prompt,
          size: size as '256x256' | '512x512' | '1024x1024',
          n: Math.min(n, 10), // DALL-E 2 max is 10
        });

        if (!response.data) {
          throw new Error('No data received from OpenAI API');
        }

        return response.data.map((image) => ({
          url: image.url!,
          size,
          model,
          created: response.created,
        }));
      }
    } catch (error) {
      console.error('Error generating images:', error);
      throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate image variations
   */
  async generateVariations(options: ImageVariationOptions): Promise<ImageGenerationResult[]> {
    const { imageUrl, size = '1024x1024', n = 1 } = options;

    try {
      // For variations, we need to fetch the image as a buffer and create a File-like object
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Create a File-like object that satisfies the Uploadable interface
      const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' });

      const response = await this.client.images.createVariation({
        image: imageFile,
        size: size as '256x256' | '512x512' | '1024x1024',
        n: Math.min(n, 10), // Max is 10
      });

      if (!response.data) {
        throw new Error('No data received from OpenAI API');
      }

      return response.data.map((image) => ({
        url: image.url!,
        size,
        model: 'dall-e-2', // Variations only work with DALL-E 2
        created: response.created,
      }));
    } catch (error) {
      console.error('Error generating image variations:', error);
      throw new Error(`Failed to generate variations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Edit an existing image
   */
  async editImage(options: ImageEditOptions): Promise<ImageGenerationResult[]> {
    const { prompt, imageUrl, maskUrl, size = '1024x1024', n = 1 } = options;

    try {
      // Fetch the image as a buffer
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Create a File-like object that satisfies the Uploadable interface
      const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' });

      const editOptions: {
        image: File;
        prompt: string;
        size: '256x256' | '512x512' | '1024x1024';
        n: number;
        mask?: File;
      } = {
        image: imageFile,
        prompt,
        size: size as '256x256' | '512x512' | '1024x1024',
        n: Math.min(n, 10),
      };

      if (maskUrl) {
        const maskResponse = await fetch(maskUrl);
        const maskBuffer = await maskResponse.arrayBuffer();
        editOptions.mask = new File([maskBuffer], 'mask.png', { type: 'image/png' });
      }

      const response = await this.client.images.edit(editOptions);

      if (!response.data) {
        throw new Error('No data received from OpenAI API');
      }

      return response.data.map((image) => ({
        url: image.url!,
        size,
        model: 'dall-e-2', // Editing only works with DALL-E 2
        created: response.created,
      }));
    } catch (error) {
      console.error('Error editing image:', error);
      throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
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
    const aspectRatios = {
      instagram: '1024x1024' as const, // Square
      twitter: '1024x1024' as const,   // Square
      linkedin: '1024x1024' as const,  // Square
      facebook: '1024x1024' as const,  // Square
    };

    const platformPrompts = {
      instagram: `${prompt}, Instagram aesthetic, trendy, visually appealing`,
      twitter: `${prompt}, Twitter post, clean design, professional`,
      linkedin: `${prompt}, LinkedIn professional, business appropriate`,
      facebook: `${prompt}, Facebook post, engaging, colorful`,
    };

    return this.generateImages({
      prompt: platformPrompts[platform],
      size: aspectRatios[platform],
      model: 'dall-e-3',
      quality: 'hd',
      style: 'vivid',
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
      size: '1792x1024', // Wide format for blog headers
      model: 'dall-e-3',
      quality: 'hd',
      style: 'natural',
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
   * Get available models and their capabilities
   */
  getAvailableModels() {
    return {
      'dall-e-3': {
        name: 'DALL-E 3',
        description: 'Latest model with highest quality',
        sizes: ['1024x1024', '1792x1024', '1024x1792'],
        features: ['High quality', 'Better prompt understanding', 'HD quality option'],
        maxImages: 1,
      },
      'dall-e-2': {
        name: 'DALL-E 2',
        description: 'Previous generation model',
        sizes: ['256x256', '512x512', '1024x1024'],
        features: ['Multiple images', 'Variations', 'Editing'],
        maxImages: 10,
      },
    };
  }
}

// Create singleton instance
export const imageGenerationService = new ImageGenerationService(); 