import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shadcn/card';
import { Button } from '../shadcn/button';
import { Badge } from '../shadcn/badge';
import { Progress } from '../shadcn/progress';
import { 
  Play, 
  SkipForward, 
  Download, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ImageIcon,
  RefreshCw,
  AlertCircle,
  Pause
} from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { useToast } from '../../contexts/ToastProvider';
import { useGenerateImage, useCancelJob, useRefreshImageUrl, useJobsByStoryAndSlide } from '../../lib/imageGeneration';

interface StorySlide {
  slideNumber: number;
  slideType: string;
  title: string;
  content: string;
  imagePrompt: string;
  dataPoints?: string[];
  recommendations?: string[];
  caption?: string;
}

interface GeneratedStory {
  title: string;
  slides: StorySlide[];
  summary: string;
  keyInsights: string[];
  nextSteps: string[];
}

interface StorySlideShowProps {
  story: {
    userId: string;
    generatedStory: GeneratedStory;
    slideType: string;
    targetAudience: string;
    tone: string;
  };
  storyId: string;
}

interface JobData {
  jobId: string;
  openaiJobId: string;
  userId: string;
  prompt: string;
  storyId: string | null;
  slideNumber: number | null;
  options: any;
  status: string;
  progress: number;
  createdAt: number;
  updatedAt: number;
  result?: {
    imageUrl: string;
    revisedPrompt: string;
    size: string;
    model: string;
    created: number;
    format: string;
  };
  error?: string;
  completedAt?: number;
}

interface SlideGenerationState {
  slideNumber: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  jobId?: string;
  imageUrl?: string;
  error?: string;
}

export const StorySlideShow: React.FC<StorySlideShowProps> = ({ story, storyId }) => {
  const { fetchWithAuth } = useApi();
  const { toast } = useToast();
  const [slideStates, setSlideStates] = useState<SlideGenerationState[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingSlide, setCurrentGeneratingSlide] = useState<number | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(false);

  const generateImageMutation = useGenerateImage();
  const cancelJobMutation = useCancelJob();
  const refreshImageUrlMutation = useRefreshImageUrl();

  // Initialize slide states
  useEffect(() => {
    const initialStates: SlideGenerationState[] = story.generatedStory.slides.map((slide, index) => ({
      slideNumber: slide.slideNumber,
      status: 'pending',
      progress: 0,
    }));
    setSlideStates(initialStates);
  }, [story.generatedStory.slides]);

  // Get existing jobs for this story
  const { data: existingJobs, refetch: refetchJobs } = useJobsByStoryAndSlide(storyId, null);

  // Initialize slide states with existing jobs
  useEffect(() => {
    console.log('StorySlideShow: existingJobs loaded:', existingJobs?.length || 0);
    if (existingJobs && existingJobs.length > 0) {
      console.log('StorySlideShow: Sample job data:', existingJobs[0]);
      setSlideStates(prev => prev.map(state => {
        // Find the most recent completed job for this slide, or fall back to the latest job
        const slideJobs = existingJobs.filter(job => {
          const jobData = job as any; // Cast to any since the API response might have different structure
          const jobSlideNumber = typeof jobData.slideNumber === 'string' ? parseInt(jobData.slideNumber) : jobData.slideNumber;
          console.log('StorySlideShow: Checking job:', {
            jobSlideNumber,
            stateSlideNumber: state.slideNumber,
            match: jobSlideNumber === state.slideNumber
          });
          return jobSlideNumber === state.slideNumber;
        });
        
        console.log(`StorySlideShow: Found ${slideJobs.length} jobs for slide ${state.slideNumber}`);
        
        if (slideJobs.length > 0) {
          // Sort by createdAt desc to get the most recent first
          const sortedJobs = slideJobs.sort((a, b) => b.createdAt - a.createdAt);
          
          // Find the most recent completed job with an image
          const completedJob = sortedJobs.find(job => 
            job.status === 'completed' && job.result && 
            (job.result as any).imageUrl
          );
          
          const latestJob = sortedJobs[0];
          
          if (completedJob && completedJob.result) {
            const result = completedJob.result as any;
            console.log(`StorySlideShow: Found completed job for slide ${state.slideNumber}:`, {
              jobId: completedJob.jobId,
              imageUrl: result.imageUrl
            });
            return {
              ...state,
              status: 'completed',
              progress: 100,
              jobId: completedJob.jobId,
              imageUrl: result.imageUrl,
            };
          } else if (latestJob.status === 'completed' && latestJob.error) {
            return {
              ...state,
              status: 'error',
              jobId: latestJob.jobId,
              error: latestJob.error,
            };
          } else if (['in_progress', 'queued', 'processing'].includes(latestJob.status)) {
            return {
              ...state,
              status: 'generating',
              jobId: latestJob.jobId,
              progress: latestJob.progress || 0,
            };
          }
        }
        return state;
      }));
    }
  }, [existingJobs]);

  // Generate image for a specific slide
  const generateSlideImage = async (slideNumber: number) => {
    const slide = story.generatedStory.slides.find(s => s.slideNumber === slideNumber);
    if (!slide) return;

    try {
      setSlideStates(prev => prev.map(state => 
        state.slideNumber === slideNumber 
          ? { ...state, status: 'generating', progress: 0 }
          : state
      ));

      const options = {
        prompt: slide.imagePrompt,
        size: '1024x1536' as const,
        quality: 'high' as const,
        format: 'png' as const,
        storyId: storyId,
        slideNumber: slideNumber,
      };

      const result = await generateImageMutation.mutateAsync(options);
      
      if (result.jobId) {
        setSlideStates(prev => prev.map(state => 
          state.slideNumber === slideNumber 
            ? { ...state, jobId: result.jobId, status: 'generating', progress: 0 }
            : state
        ));
        
        toast({
          title: `Slide ${slideNumber} Generation Started`,
          description: 'Your image is being generated. This may take a few minutes.',
        });

        // Refetch jobs to update the list
        refetchJobs();
      }
    } catch (error) {
      console.error('Error generating image for slide:', slideNumber, error);
      setSlideStates(prev => prev.map(state => 
        state.slideNumber === slideNumber 
          ? { ...state, status: 'error', error: error instanceof Error ? error.message : 'Generation failed' }
          : state
      ));
      
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to start image generation',
        variant: 'destructive',
      });
    }
  };

  // Generate all slides progressively
  const generateAllSlides = async () => {
    setIsGenerating(true);
    setCurrentGeneratingSlide(0);

    for (let i = 0; i < story.generatedStory.slides.length; i++) {
      const slide = story.generatedStory.slides[i];
      setCurrentGeneratingSlide(slide.slideNumber);
      
      await generateSlideImage(slide.slideNumber);
      
      // Wait for completion or error
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max wait
      
      while (attempts < maxAttempts) {
        const slideState = slideStates.find(s => s.slideNumber === slide.slideNumber);
        if (slideState?.status === 'completed' || slideState?.status === 'error') {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
      }
      
      // If auto-generate is off, stop after first slide
      if (!autoGenerate) break;
    }
    
    setIsGenerating(false);
    setCurrentGeneratingSlide(null);
  };

  // Cancel generation for a specific slide
  const cancelSlideGeneration = async (slideNumber: number) => {
    const slideState = slideStates.find(s => s.slideNumber === slideNumber);
    if (!slideState?.jobId) return;

    try {
      await cancelJobMutation.mutateAsync(slideState.jobId);
      setSlideStates(prev => prev.map(state => 
        state.slideNumber === slideNumber 
          ? { ...state, status: 'pending', progress: 0 }
          : state
      ));
      
      toast({
        title: 'Generation Cancelled',
        description: 'Image generation has been cancelled.',
      });
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast({
        title: 'Cancellation Failed',
        description: 'Failed to cancel image generation',
        variant: 'destructive',
      });
    }
  };

  // Download image for a slide
  const downloadSlideImage = (slideNumber: number) => {
    const slideState = slideStates.find(s => s.slideNumber === slideNumber);
    if (!slideState?.imageUrl) return;

    const link = document.createElement('a');
    link.href = slideState.imageUrl;
    link.download = `slide-${slideNumber}-${story.generatedStory.title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Refresh image URL for a slide
  const refreshImageUrl = async (slideNumber: number) => {
    const slideState = slideStates.find(s => s.slideNumber === slideNumber);
    if (!slideState?.jobId) return;

    try {
      const result = await refreshImageUrlMutation.mutateAsync(slideState.jobId);
      
      setSlideStates(prev => prev.map(state => 
        state.slideNumber === slideNumber 
          ? { ...state, imageUrl: result.imageUrl }
          : state
      ));
      
      toast({
        title: 'Image URL Refreshed',
        description: 'Image URL has been refreshed.',
      });
    } catch (error) {
      console.error('Error refreshing image URL:', slideNumber, error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh image URL.',
        variant: 'destructive',
      });
    }
  };

  // Job status polling for active jobs
  useEffect(() => {
    const activeJobs = slideStates.filter(state => state.jobId && state.status === 'generating');
    
    if (activeJobs.length === 0) return;

    const pollJobStatus = async () => {
      for (const slideState of activeJobs) {
        try {
          const response = await fetchWithAuth(`api/images/jobs/${slideState.jobId}`);
          const jobStatus = await response.json();
          
          if (jobStatus.success && jobStatus.job) {
            const job = jobStatus.job;
            
            if (job.status === 'completed' && job.result && !job.error) {
              const result = Array.isArray(job.result) ? job.result[0] : job.result;
              setSlideStates(prev => prev.map(state => 
                state.slideNumber === slideState.slideNumber 
                  ? { 
                      ...state, 
                      status: 'completed', 
                      progress: 100, 
                      imageUrl: result.imageUrl 
                    }
                  : state
              ));
            } else if (job.status === 'completed' && job.error) {
              setSlideStates(prev => prev.map(state => 
                state.slideNumber === slideState.slideNumber 
                  ? { ...state, status: 'error', error: job.error }
                  : state
              ));
            } else if (['in_progress', 'queued', 'processing'].includes(job.status)) {
              setSlideStates(prev => prev.map(state => 
                state.slideNumber === slideState.slideNumber 
                  ? { ...state, progress: job.progress || 0 }
                  : state
              ));
            }
          }
        } catch (error) {
          console.error('Error polling job status for slide:', slideState.slideNumber, error);
        }
      }
    };

    // Poll every 8 seconds for active jobs
    const interval = setInterval(pollJobStatus, 8000);
    return () => clearInterval(interval);
  }, [slideStates, fetchWithAuth]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Slide Generation Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={generateAllSlides}
              disabled={isGenerating}
              className="bg-green-500/10 border-green-500/20 text-green-300 hover:bg-green-500/20"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate All Slides
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setAutoGenerate(!autoGenerate)}
              className={`${
                autoGenerate 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' 
                  : 'bg-neutral-500/10 border-neutral-500/20 text-neutral-300'
              }`}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              {autoGenerate ? 'Auto-Generate On' : 'Auto-Generate Off'}
            </Button>
            
            {isGenerating && currentGeneratingSlide && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                <Sparkles className="h-3 w-3 mr-1" />
                Generating Slide {currentGeneratingSlide}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {story.generatedStory.slides.map((slide, index) => {
          const slideState = slideStates.find(s => s.slideNumber === slide.slideNumber);
          const isCurrentlyGenerating = currentGeneratingSlide === slide.slideNumber;
          
          return (
            <Card key={slide.slideNumber} className="bg-neutral-800/50 border-neutral-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm text-white">
                    Slide {slide.slideNumber}
                  </CardTitle>
                  <Badge className={getStatusColor(slideState?.status || 'pending')}>
                    {getStatusIcon(slideState?.status || 'pending')}
                    <span className="ml-1 text-xs">
                      {slideState?.status === 'generating' ? 'Generating...' :
                       slideState?.status === 'completed' ? 'Completed' :
                       slideState?.status === 'error' ? 'Error' : 'Pending'}
                    </span>
                  </Badge>
                </div>
                <p className="text-xs text-neutral-400 mt-2">{slide.title}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Image Display */}
                {slideState?.status === 'completed' && slideState.imageUrl && (
                  <div className="relative group">
                    <img
                      src={slideState.imageUrl}
                      alt={`Generated image for slide ${slide.slideNumber}`}
                      className="w-full h-48 object-contain rounded-lg border border-neutral-600"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <Button
                        onClick={() => downloadSlideImage(slide.slideNumber)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {slideState.jobId && (
                        <Button
                          onClick={() => refreshImageUrl(slide.slideNumber)}
                          disabled={refreshImageUrlMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Refresh URL
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {slideState?.status === 'generating' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Progress</span>
                      <span>{slideState.progress || 0}%</span>
                    </div>
                    <Progress value={slideState.progress || 0} className="h-2" />
                  </div>
                )}

                {/* Error Display */}
                {slideState?.status === 'error' && slideState.error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-red-400 text-xs">{slideState.error}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {slideState?.status === 'pending' && (
                    <Button
                      onClick={() => generateSlideImage(slide.slideNumber)}
                      disabled={isGenerating}
                      size="sm"
                      className="flex-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  )}

                  {slideState?.status === 'generating' && (
                    <Button
                      onClick={() => cancelSlideGeneration(slide.slideNumber)}
                      disabled={cancelJobMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}

                  {slideState?.status === 'completed' && (
                    <Button
                      onClick={() => generateSlideImage(slide.slideNumber)}
                      size="sm"
                      className="flex-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                  )}

                  {slideState?.status === 'error' && (
                    <Button
                      onClick={() => generateSlideImage(slide.slideNumber)}
                      size="sm"
                      className="flex-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  )}
                </div>

                {/* Slide Content Preview */}
                <div className="text-xs text-neutral-400">
                  <p className="line-clamp-3">{slide.content}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 