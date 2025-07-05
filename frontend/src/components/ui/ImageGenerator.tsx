import React, { useState, useEffect } from 'react';
import { Button } from '../shadcn/button';
import { Input } from '../shadcn/input';
import { Textarea } from '../shadcn/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shadcn/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shadcn/select';
import { Label } from '../shadcn/label';
import { Badge } from '../shadcn/badge';
import { Image, Download, Sparkles, AlertCircle, X, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { useToast } from '../../contexts/ToastProvider';
import { useJobStatus, useGenerateImage, useCancelJob, useRefreshImageUrl } from '../../lib/imageGeneration';

interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
  size: string;
  model: string;
  created: number;
  jobId?: string;
  status?: string;
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

interface JobData {
  jobId: string;
  status: string;
  progress?: number;
  result?: {
    imageUrl?: string;
    base64Data?: string;
    revisedPrompt?: string;
    size?: string;
    model?: string;
    created?: number;
  };
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export const ImageGenerator: React.FC = () => {
  const { fetchWithAuth } = useApi();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1024x1024'>('1024x1024');
  const [quality, setQuality] = useState<'auto' | 'low' | 'medium' | 'high'>('medium');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [model, setModel] = useState<'dall-e-2' | 'dall-e-3'>('dall-e-3');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'generate' | 'enhanced' | 'social' | 'blog'>('generate');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [imageLoadRetries, setImageLoadRetries] = useState<Record<string, number>>({});
  const [isRefreshingUrl, setIsRefreshingUrl] = useState<Record<string, boolean>>({});

  // TanStack Query hooks
  const generateImageMutation = useGenerateImage();
  const cancelJobMutation = useCancelJob();
  const refreshImageUrlMutation = useRefreshImageUrl();

  // Get status of active job
  const { 
    data: jobStatusData, 
    isLoading: jobStatusLoading,
    error: jobStatusError 
  } = useJobStatus(activeJobId, !!activeJobId);

  // Update generated images when job status changes
  useEffect(() => {
    if (jobStatusData?.job) {
      const job = jobStatusData.job;
      
      if (job.status === 'completed' && job.result && !job.error) {
        const result = Array.isArray(job.result) ? job.result[0] : job.result;
        
        const newImage: GeneratedImage = {
          url: result.imageUrl || result.base64Data || '',
          revisedPrompt: result.revisedPrompt,
          size: result.size || '1024x1024',
          model: result.model || 'dall-e-3',
          created: result.created || Date.now(),
          jobId: job.jobId,
          status: 'completed',
        };

        setGeneratedImages(prev => {
          // Replace existing image with same jobId or add new one
          const existingIndex = prev.findIndex(img => img.jobId === job.jobId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newImage;
            return updated;
          } else {
            return [newImage, ...prev];
          }
        });

        setActiveJobId(null);
        toast({
          title: 'Image Generated!',
          description: 'Your image has been successfully generated.',
        });
      } else if (job.status === 'failed' && job.error) {
        toast({
          title: 'Generation Failed',
          description: job.error,
          variant: 'destructive',
        });
        setActiveJobId(null);
      }
    }
  }, [jobStatusData, toast]);

  const handleImageLoadError = async (imageUrl: string, jobId: string) => {
    console.error('Image failed to load, attempting URL refresh...');
    
    const currentRetries = imageLoadRetries[jobId] || 0;
    if (currentRetries < 2 && jobId) {
      setImageLoadRetries(prev => ({ ...prev, [jobId]: currentRetries + 1 }));
      setIsRefreshingUrl(prev => ({ ...prev, [jobId]: true }));
      
      try {
        const result = await refreshImageUrlMutation.mutateAsync(jobId);
        
        // Update the image with the new URL
        setGeneratedImages(prev => prev.map(img => 
          img.jobId === jobId 
            ? { ...img, url: result.imageUrl }
            : img
        ));
        
        toast({
          title: 'Image URL Refreshed',
          description: 'Successfully refreshed the image URL',
        });
        
        // Reset retry count on success
        setImageLoadRetries(prev => ({ ...prev, [jobId]: 0 }));
      } catch (error) {
        console.error('Failed to refresh image URL:', error);
        toast({
          title: 'URL Refresh Failed',
          description: 'Failed to refresh the image URL. The image may have expired.',
          variant: 'destructive',
        });
      } finally {
        setIsRefreshingUrl(prev => ({ ...prev, [jobId]: false }));
      }
    } else {
      toast({
        title: 'Image Load Error',
        description: 'Failed to load the image after multiple attempts. The image may have expired.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setError(null);

    try {
      const options = {
        prompt: prompt.trim(),
        size,
        quality,
        format: 'png' as const,
      };

      const result = await generateImageMutation.mutateAsync(options);
      
      if (result.jobId) {
        setActiveJobId(result.jobId);
        
        // Add a placeholder image with generating status
        const placeholderImage: GeneratedImage = {
          url: '',
          size,
          model,
          created: Date.now(),
          jobId: result.jobId,
          status: 'generating',
        };
        
        setGeneratedImages(prev => [placeholderImage, ...prev]);
        
        toast({
          title: 'Image Generation Started',
          description: 'Your image is being generated. This may take a few minutes.',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Failed to start image generation',
        variant: 'destructive',
      });
    }
  };

  const handleEnhancedGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setError(null);

    try {
      const options = {
        prompt: prompt.trim(),
        size,
        quality,
        format: 'png' as const,
      };

      const result = await generateImageMutation.mutateAsync(options);
      
      if (result.jobId) {
        setActiveJobId(result.jobId);
        
        const placeholderImage: GeneratedImage = {
          url: '',
          size,
          model,
          created: Date.now(),
          jobId: result.jobId,
          status: 'generating',
        };
        
        setGeneratedImages(prev => [placeholderImage, ...prev]);
        
        toast({
          title: 'Enhanced Generation Started',
          description: 'Your enhanced image is being generated. This may take a few minutes.',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhanced generation failed');
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Failed to start enhanced generation',
        variant: 'destructive',
      });
    }
  };

  const handleSocialMediaGenerate = async (platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook') => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setError(null);

    try {
      const options = {
        prompt: prompt.trim(),
        size,
        quality,
        format: 'png' as const,
      };

      const result = await generateImageMutation.mutateAsync(options);
      
      if (result.jobId) {
        setActiveJobId(result.jobId);
        
        const placeholderImage: GeneratedImage = {
          url: '',
          size,
          model,
          created: Date.now(),
          jobId: result.jobId,
          status: 'generating',
        };
        
        setGeneratedImages(prev => [placeholderImage, ...prev]);
        
        toast({
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Generation Started`,
          description: 'Your social media image is being generated. This may take a few minutes.',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social media generation failed');
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Failed to start social media generation',
        variant: 'destructive',
      });
    }
  };

  const handleBlogGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a blog title');
      return;
    }

    setError(null);

    try {
      const options = {
        prompt: prompt.trim(),
        size,
        quality,
        format: 'png' as const,
      };

      const result = await generateImageMutation.mutateAsync(options);
      
      if (result.jobId) {
        setActiveJobId(result.jobId);
        
        const placeholderImage: GeneratedImage = {
          url: '',
          size,
          model,
          created: Date.now(),
          jobId: result.jobId,
          status: 'generating',
        };
        
        setGeneratedImages(prev => [placeholderImage, ...prev]);
        
        toast({
          title: 'Blog Image Generation Started',
          description: 'Your blog image is being generated. This may take a few minutes.',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blog image generation failed');
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Failed to start blog image generation',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download image',
        variant: 'destructive',
      });
    }
  };

  const handleRefreshUrl = async (image: GeneratedImage) => {
    if (!image.jobId) return;
    await handleImageLoadError(image.url, image.jobId);
  };

  const clearImages = () => {
    setGeneratedImages([]);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'generating':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'generating':
        return 'Generating...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Image Generator</CardTitle>
          <CardDescription>
            Generate stunning images using OpenAI's DALL-E models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Button
              variant={selectedTab === 'generate' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('generate')}
            >
              Generate
            </Button>
            <Button
              variant={selectedTab === 'enhanced' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('enhanced')}
            >
              Enhanced
            </Button>
            <Button
              variant={selectedTab === 'social' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('social')}
            >
              Social Media
            </Button>
            <Button
              variant={selectedTab === 'blog' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('blog')}
            >
              Blog
            </Button>
          </div>

          {selectedTab === 'generate' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Select value={size} onValueChange={(value: any) => setSize(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">1024x1024</SelectItem>
                      <SelectItem value="1792x1024">1792x1024</SelectItem>
                      <SelectItem value="1024x1792">1024x1792</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onValueChange={(value: any) => setModel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
                      <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quality">Quality</Label>
                  <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="style">Style</Label>
                  <Select value={style} onValueChange={(value: any) => setStyle(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivid">Vivid</SelectItem>
                      <SelectItem value="natural">Natural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={generateImageMutation.isPending || !prompt.trim()}
                className="w-full"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          )}

          {selectedTab === 'enhanced' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="enhanced-prompt">Enhanced Prompt</Label>
                <Textarea
                  id="enhanced-prompt"
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="enhanced-style">Style</Label>
                <Select value={style} onValueChange={(value: any) => setStyle(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vivid">Vivid & Colorful</SelectItem>
                    <SelectItem value="natural">Natural & Realistic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleEnhancedGenerate} 
                disabled={generateImageMutation.isPending || !prompt.trim()}
                className="w-full"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Enhanced Image
                  </>
                )}
              </Button>
            </div>
          )}

          {selectedTab === 'social' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="social-prompt">Social Media Prompt</Label>
                <Textarea
                  id="social-prompt"
                  placeholder="Describe the image for social media..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleSocialMediaGenerate('instagram')}
                  disabled={generateImageMutation.isPending || !prompt.trim()}
                  variant="outline"
                >
                  Instagram
                </Button>
                <Button 
                  onClick={() => handleSocialMediaGenerate('twitter')}
                  disabled={generateImageMutation.isPending || !prompt.trim()}
                  variant="outline"
                >
                  Twitter
                </Button>
                <Button 
                  onClick={() => handleSocialMediaGenerate('linkedin')}
                  disabled={generateImageMutation.isPending || !prompt.trim()}
                  variant="outline"
                >
                  LinkedIn
                </Button>
                <Button 
                  onClick={() => handleSocialMediaGenerate('facebook')}
                  disabled={generateImageMutation.isPending || !prompt.trim()}
                  variant="outline"
                >
                  Facebook
                </Button>
              </div>
            </div>
          )}

          {selectedTab === 'blog' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="blog-title">Blog Title</Label>
                <Input
                  id="blog-title"
                  placeholder="Enter your blog post title..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleBlogGenerate} 
                disabled={generateImageMutation.isPending || !prompt.trim()}
                className="w-full"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Blog Header
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedImages.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Images</CardTitle>
                <CardDescription>
                  {generatedImages.length} image(s) generated
                </CardDescription>
              </div>
              <Button variant="outline" onClick={clearImages}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="space-y-2">
                  <div className="relative aspect-square overflow-hidden rounded-lg border">
                    {image.status === 'generating' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 text-white">
                          <Clock className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Generating...</span>
                        </div>
                      </div>
                    )}
                    {isRefreshingUrl[image.jobId || ''] && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 text-white">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Refreshing URL...</span>
                        </div>
                      </div>
                    )}
                    {image.url && (
                      <img
                        src={image.url}
                        alt={image.revisedPrompt || 'Generated image'}
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          // Reset retry count on successful load
                          if (image.jobId) {
                            setImageLoadRetries(prev => ({ ...prev, [image.jobId]: 0 }));
                          }
                        }}
                        onError={() => {
                          if (image.jobId) {
                            handleImageLoadError(image.url, image.jobId);
                          }
                        }}
                      />
                    )}
                    {!image.url && image.status === 'generating' && (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">Generating...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {image.model} • {image.size}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getStatusIcon(image.status)}
                        <span className="ml-1">{getStatusText(image.status)}</span>
                      </Badge>
                    </div>
                    {image.revisedPrompt && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {image.revisedPrompt}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {image.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(image)}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                      {image.jobId && image.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefreshUrl(image)}
                          disabled={isRefreshingUrl[image.jobId]}
                          className="flex-1"
                        >
                          {isRefreshingUrl[image.jobId] ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              Refreshing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Refresh URL
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {image.jobId && imageLoadRetries[image.jobId] > 0 && (
                      <div className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Retry attempt {imageLoadRetries[image.jobId]}/2</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 