import React, { useState } from 'react';
import { Button } from '../shadcn/button';
import { Input } from '../shadcn/input';
import { Textarea } from '../shadcn/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shadcn/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shadcn/select';
import { Label } from '../shadcn/label';
import { ImageGenerationService } from '../../lib/imageGeneration';
import { useApi } from '../../contexts/ApiContext';

interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
  size: string;
  model: string;
  created: number;
}

export const ImageGenerator: React.FC = () => {
  const { fetchWithAuth } = useApi();
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1024x1024'>('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [model, setModel] = useState<'dall-e-2' | 'dall-e-3'>('dall-e-3');
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'generate' | 'enhanced' | 'social' | 'blog'>('generate');

  const imageService = new ImageGenerationService(fetchWithAuth);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const images = await imageService.generateImages({
        prompt: prompt.trim(),
        size,
        quality,
        style,
        model,
      });

      setGeneratedImages(prev => [...images, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleEnhancedGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const images = await imageService.generateEnhancedImages(
        prompt.trim(),
        style === 'vivid' ? 'vivid, colorful' : 'natural, realistic'
      );

      setGeneratedImages(prev => [...images, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhanced generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSocialMediaGenerate = async (platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook') => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const images = await imageService.generateSocialMediaImages(prompt.trim(), platform);
      setGeneratedImages(prev => [...images, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social media generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleBlogGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a blog title');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const images = await imageService.generateBlogImages(prompt.trim());
      setGeneratedImages(prev => [...images, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blog image generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      await imageService.downloadImage(image.url, `generated-image-${Date.now()}.png`);
    } catch (err) {
      setError('Failed to download image');
    }
  };

  const clearImages = () => {
    setGeneratedImages([]);
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
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="hd">HD</SelectItem>
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
                disabled={generating || !prompt.trim()}
                className="w-full"
              >
                {generating ? 'Generating...' : 'Generate Image'}
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
                disabled={generating || !prompt.trim()}
                className="w-full"
              >
                {generating ? 'Generating...' : 'Generate Enhanced Image'}
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
                  disabled={generating || !prompt.trim()}
                  variant="outline"
                >
                  Instagram
                </Button>
                <Button 
                  onClick={() => handleSocialMediaGenerate('twitter')}
                  disabled={generating || !prompt.trim()}
                  variant="outline"
                >
                  Twitter
                </Button>
                <Button 
                  onClick={() => handleSocialMediaGenerate('linkedin')}
                  disabled={generating || !prompt.trim()}
                  variant="outline"
                >
                  LinkedIn
                </Button>
                <Button 
                  onClick={() => handleSocialMediaGenerate('facebook')}
                  disabled={generating || !prompt.trim()}
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
                disabled={generating || !prompt.trim()}
                className="w-full"
              >
                {generating ? 'Generating...' : 'Generate Blog Header'}
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
                    <img
                      src={image.url}
                      alt={image.revisedPrompt || 'Generated image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                      {image.model} • {image.size}
                    </p>
                    {image.revisedPrompt && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {image.revisedPrompt}
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(image)}
                      className="w-full"
                    >
                      Download
                    </Button>
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