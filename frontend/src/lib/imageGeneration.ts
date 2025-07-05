import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ImageGenerationOptions {
  prompt: string;
  size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
  compression?: number;
  background?: 'auto' | 'transparent' | 'opaque';
  storyId?: string;
  slideNumber?: number;
}

interface ImageGenerationResult {
  base64Data?: string;
  imageUrl?: string;
  revisedPrompt?: string;
  size: string;
  model: string;
  created: number;
  format: string;
}

interface ImageVariationOptions {
  base64Image: string;
  variationPrompt: string;
  size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
}

interface ImageEditOptions {
  prompt: string;
  base64Image: string;
  base64Mask?: string;
  size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
}

interface JobStatus {
  success: boolean;
  job: {
    jobId: string;
    status: string;
    progress?: number;
    result?: any; // The result can be either ImageGenerationResult[] or a single object with imageUrl
    error?: string;
    createdAt: number;
    completedAt?: number;
  };
  warning?: string;
}

export class ImageGenerationService {
  private fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>) {
    this.fetchWithAuth = fetchWithAuth;
  }

  /**
   * Generate images using DALL-E
   */
  async generateImages(options: ImageGenerationOptions): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/generate', {
      method: 'POST',
      body: JSON.stringify(options),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Generate images asynchronously using background jobs
   */
  async generateImagesAsync(options: ImageGenerationOptions): Promise<{ jobId: string; status: string }> {
    const response = await this.fetchWithAuth('api/images/generate', {
      method: 'POST',
      body: JSON.stringify({ ...options, async: true }),
    });

    const result: ApiResponse<{ jobId: string; status: string }> = await response.json();
    return result.data;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await this.fetchWithAuth(`api/images/jobs/${jobId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('getJobStatus raw response:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get job status');
    }
    
    if (!result.job) {
      throw new Error('Invalid response structure from job status API');
    }
    
    return result;
  }

  /**
   * Get jobs by story and slide
   */
  async getJobsByStoryAndSlide(storyId: string, slideNumber?: number | null): Promise<{
    jobId: string;
    status: string;
    progress?: number;
    result?: ImageGenerationResult[];
    error?: string;
    createdAt: number;
    completedAt?: number;
  }[]> {
    const url = slideNumber 
      ? `api/images/jobs/story/${storyId}/slide/${slideNumber}`
      : `api/images/jobs/story/${storyId}`;
      
    console.log('getJobsByStoryAndSlide called with:', { storyId, slideNumber, url });
    
    const response = await this.fetchWithAuth(url, {
      method: 'GET',
    });

    const result: ApiResponse<{
      jobId: string;
      status: string;
      progress?: number;
      result?: ImageGenerationResult[];
      error?: string;
      createdAt: number;
      completedAt?: number;
    }[]> = await response.json();
    
    console.log('getJobsByStoryAndSlide response:', { 
      success: result.success, 
      dataLength: result.data?.length || 0 
    });
    
    return result.data;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const response = await this.fetchWithAuth(`api/images/jobs/${jobId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to cancel job');
    }
  }

  /**
   * Refresh expired image URL
   */
  async refreshImageUrl(jobId: string): Promise<{ imageUrl: string; expiresIn: number }> {
    const response = await this.fetchWithAuth(`api/images/jobs/${jobId}/refresh-url`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh image URL: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to refresh image URL');
    }
    
    return result.data;
  }

  /**
   * Generate image variations
   */
  async generateVariations(options: ImageVariationOptions): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/variations', {
      method: 'POST',
      body: JSON.stringify(options),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Edit an existing image
   */
  async editImage(options: ImageEditOptions): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/edit', {
      method: 'POST',
      body: JSON.stringify(options),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Generate images with enhanced prompt engineering
   */
  async generateEnhancedImages(
    basePrompt: string,
    style?: string,
    options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/enhanced', {
      method: 'POST',
      body: JSON.stringify({ prompt: basePrompt, style, ...options }),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Generate images for social media posts
   */
  async generateSocialMediaImages(
    prompt: string,
    platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook'
  ): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/social-media', {
      method: 'POST',
      body: JSON.stringify({ prompt, platform }),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Generate images for blog posts
   */
  async generateBlogImages(
    title: string,
    category?: string
  ): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/blog', {
      method: 'POST',
      body: JSON.stringify({ title, category }),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Validate prompt for content policy
   */
  async validatePrompt(prompt: string): Promise<{ isValid: boolean; reason?: string }> {
    const response = await this.fetchWithAuth('api/images/validate-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });

    const result: ApiResponse<{ isValid: boolean; reason?: string }> = await response.json();
    return result.data;
  }

  /**
   * Get available models and capabilities
   */
  async getAvailableModels(): Promise<any> {
    const response = await this.fetchWithAuth('api/images/models', {
      method: 'GET',
    });

    const result: ApiResponse<any> = await response.json();
    return result.data;
  }

  /**
   * Download image from URL
   */
  async downloadImage(imageUrl: string, filename?: string): Promise<void> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'generated-image.png';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Get image dimensions from URL
   */
  async getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = imageUrl;
    });
  }
}

// Create singleton instance - will be initialized with fetchWithAuth later
let imageGenerationService: ImageGenerationService;

export const initializeImageGenerationService = (fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>) => {
  imageGenerationService = new ImageGenerationService(fetchWithAuth);
};

// TanStack Query hooks for professional job management
export const useJobStatus = (jobId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: () => {
      if (!imageGenerationService) {
        throw new Error('ImageGenerationService not initialized');
      }
      return imageGenerationService.getJobStatus(jobId!);
    },
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      // Stop polling when job is completed or failed
      if (query.state.data?.job?.status === 'completed' || query.state.data?.job?.status === 'failed') {
        return false;
      }
      // Poll every 8 seconds for active jobs
      return 8000;
    },
    refetchIntervalInBackground: false,
    retry: 1,
    staleTime: 0,
  });
};

export const useGenerateImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (options: ImageGenerationOptions) => {
      if (!imageGenerationService) {
        throw new Error('ImageGenerationService not initialized');
      }
      return imageGenerationService.generateImagesAsync(options);
    },
    onSuccess: (data) => {
      // Invalidate and refetch job status when a new job is created
      queryClient.invalidateQueries({ queryKey: ['jobStatus', data.jobId] });
    },
  });
};

export const useCancelJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => {
      if (!imageGenerationService) {
        throw new Error('ImageGenerationService not initialized');
      }
      return imageGenerationService.cancelJob(jobId);
    },
    onSuccess: () => {
      // Invalidate job status queries to refetch updated status
      queryClient.invalidateQueries({ queryKey: ['jobStatus'] });
    },
  });
};

export const useRefreshImageUrl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => {
      if (!imageGenerationService) {
        throw new Error('ImageGenerationService not initialized');
      }
      return imageGenerationService.refreshImageUrl(jobId);
    },
    onSuccess: (data, jobId) => {
      // Invalidate job status queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['jobStatus', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobsByStoryAndSlide'] });
    },
  });
};

export const useJobsByStoryAndSlide = (storyId: string | null, slideNumber: number | null) => {
  console.log('useJobsByStoryAndSlide called with:', { storyId, slideNumber });
  
  return useQuery({
    queryKey: ['jobsByStoryAndSlide', storyId, slideNumber],
    queryFn: () => {
      console.log('useJobsByStoryAndSlide queryFn executing');
      if (!imageGenerationService) {
        throw new Error('ImageGenerationService not initialized');
      }
      return imageGenerationService.getJobsByStoryAndSlide(storyId!, slideNumber);
    },
    enabled: !!storyId,
    staleTime: 30000, // 30 seconds
  });
};

// Example usage with useApi hook:
// import { useApi } from '../contexts/ApiContext';
//
// function MyComponent() {
//   const { fetchWithAuth } = useApi();
//   const imageService = new ImageGenerationService(fetchWithAuth);
//
//   const handleGenerate = async () => {
//     const images = await imageService.generateImages({
//       prompt: 'A beautiful sunset over mountains',
//       size: '1024x1024',
//       model: 'dall-e-3'
//     });
//   };
// } 