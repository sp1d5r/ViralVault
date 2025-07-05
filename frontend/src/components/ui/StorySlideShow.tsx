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
  Pause,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X
} from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { useToast } from '../../contexts/ToastProvider';
import { useGenerateImage, useGenerateImageWithConsistency, useCancelJob, useRefreshImageUrl, useJobsByStoryAndSlide } from '../../lib/imageGeneration';
import { Switch } from '../shadcn/switch';
import { Label } from '../shadcn/label';
import { Dialog, DialogContent } from '../shadcn/dialog';

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
  const [useCharacterConsistency, setUseCharacterConsistency] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewSlideNumber, setPreviewSlideNumber] = useState<number>(0);

  const generateImageMutation = useGenerateImage();
  const generateImageWithConsistencyMutation = useGenerateImageWithConsistency();
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
          
          // Helper function to check if a job has an image URL
          const hasImageUrl = (job: any) => {
            if (!job.result) return false;
            if (Array.isArray(job.result)) {
              return job.result.length > 0 && job.result[0]?.imageUrl;
            }
            return job.result.imageUrl;
          };
          
          console.log(`StorySlideShow: Available jobs for slide ${state.slideNumber}:`, sortedJobs.map(job => ({
            jobId: job.jobId,
            status: job.status,
            hasResult: !!job.result,
            hasImageUrl: hasImageUrl(job),
            createdAt: job.createdAt
          })));
          
          // First, try to find the most recent completed job with an image URL
          let completedJob = sortedJobs.find(job => 
            job.status === 'completed' && hasImageUrl(job)
          );
          
          // If no completed job with image URL found, look for any job with image URL
          // (this handles cases where a job might be completed but not yet updated in Firebase)
          if (!completedJob) {
            completedJob = sortedJobs.find(job => hasImageUrl(job));
          }
          
          // If still no job with image URL, look for the most recent completed job
          // (it might have the image URL in a different format or we can try to refresh it)
          if (!completedJob) {
            completedJob = sortedJobs.find(job => 
              job.status === 'completed'
            );
          }
          
          const latestJob = sortedJobs[0];
          
          if (completedJob && completedJob.result) {
            const result = completedJob.result as any;
            const imageUrl = result.imageUrl || (Array.isArray(result) ? result[0]?.imageUrl : null);
            console.log(`StorySlideShow: Found completed job for slide ${state.slideNumber}:`, {
              jobId: completedJob.jobId,
              status: completedJob.status,
              hasImageUrl: !!imageUrl,
              imageUrl: imageUrl
            });
            return {
              ...state,
              status: 'completed',
              progress: 100,
              jobId: completedJob.jobId,
              imageUrl: imageUrl,
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

    // Check if character consistency is enabled and this is not the first slide
    if (useCharacterConsistency && slideNumber > 1) {
      const firstSlideState = slideStates.find(s => s.slideNumber === 1);
      if (firstSlideState?.status !== 'completed') {
        toast({
          title: 'First Slide Required',
          description: 'Please wait for the first slide to complete before generating subsequent slides with character consistency.',
          variant: 'destructive',
        });
        return;
      }
    }

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
        useReferenceImage: useCharacterConsistency,
      };

      // Use consistency generation for slides after the first one
      const shouldUseConsistency = useCharacterConsistency && slideNumber > 1;
      const mutation = shouldUseConsistency ? generateImageWithConsistencyMutation : generateImageMutation;
      
      const result = await mutation.mutateAsync(options);
      
      if (result.jobId) {
        setSlideStates(prev => prev.map(state => 
          state.slideNumber === slideNumber 
            ? { ...state, jobId: result.jobId, status: 'generating', progress: 0 }
            : state
        ));
        
        const consistencyText = shouldUseConsistency ? ' with character consistency' : '';
        toast({
          title: `Slide ${slideNumber} Generation Started`,
          description: `Your image is being generated${consistencyText}. This may take a few minutes.`,
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
      
      // If character consistency is enabled, wait for first slide to complete before proceeding
      if (useCharacterConsistency && slide.slideNumber === 1) {
        const firstSlideState = slideStates.find(s => s.slideNumber === 1);
        if (firstSlideState?.status !== 'completed') {
          // Wait for first slide to complete
          while (attempts < maxAttempts) {
            const updatedSlideState = slideStates.find(s => s.slideNumber === 1);
            if (updatedSlideState?.status === 'completed') {
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
          }
        }
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

  // Preview functions
  const openPreview = (slideNumber: number, imageUrl: string) => {
    setPreviewScale(1);
    setPreviewRotation(0);
    setPreviewImageUrl(imageUrl);
    setPreviewSlideNumber(slideNumber);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  const zoomIn = () => {
    setPreviewScale(prev => Math.min(prev * 1.5, 5));
  };

  const zoomOut = () => {
    setPreviewScale(prev => Math.max(prev / 1.5, 0.1));
  };

  const rotateImage = () => {
    setPreviewRotation(prev => (prev + 90) % 360);
  };

  const resetPreview = () => {
    setPreviewScale(1);
    setPreviewRotation(0);
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
              disabled
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
            
            <div className="flex items-center space-x-2">
              <Switch
                id="character-consistency"
                checked={useCharacterConsistency}
                onCheckedChange={setUseCharacterConsistency}
              />
              <Label htmlFor="character-consistency" className="text-white text-sm flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Character Consistency
              </Label>
            </div>
            
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
                      <div className="flex gap-2">
                        <Button
                          onClick={() => openPreview(slide.slideNumber, slideState.imageUrl!)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          size="sm"
                          variant="secondary"
                        >
                          <ZoomIn className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
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
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refresh URL
                          </Button>
                        )}
                      </div>
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
                      disabled={
                        isGenerating || 
                        (useCharacterConsistency && slide.slideNumber > 1 && 
                         slideStates.find(s => s.slideNumber === 1)?.status !== 'completed')
                      }
                      size="sm"
                      className="flex-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      {useCharacterConsistency && slide.slideNumber > 1 && 
                       slideStates.find(s => s.slideNumber === 1)?.status !== 'completed' 
                        ? 'Waiting for Slide 1' 
                        : 'Generate'}
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
                      disabled={
                        useCharacterConsistency && slide.slideNumber > 1 && 
                        slideStates.find(s => s.slideNumber === 1)?.status !== 'completed'
                      }
                      size="sm"
                      className="flex-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                  )}

                  {slideState?.status === 'error' && (
                    <Button
                      onClick={() => generateSlideImage(slide.slideNumber)}
                      disabled={
                        useCharacterConsistency && slide.slideNumber > 1 && 
                        slideStates.find(s => s.slideNumber === 1)?.status !== 'completed'
                      }
                      size="sm"
                      className="flex-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Character Consistency Warning */}
                {useCharacterConsistency && slide.slideNumber > 1 && 
                 slideStates.find(s => s.slideNumber === 1)?.status !== 'completed' && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="h-3 w-3 text-yellow-500 mr-1" />
                      <span className="text-yellow-400 text-xs">
                        Waiting for Slide 1 to complete for character consistency
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/95">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
              <div className="flex items-center gap-4">
                <h3 className="text-white font-semibold">Slide {previewSlideNumber} Preview</h3>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(previewScale * 100)}% • {previewRotation}°
                </Badge>
              </div>
              <Button
                onClick={closePreview}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
              <div className="relative">
                <img
                  src={previewImageUrl}
                  alt={`Generated image for slide ${previewSlideNumber}`}
                  className="max-w-none max-h-[80vh] transition-all duration-300 ease-out"
                  style={{
                    transform: `scale(${previewScale}) rotate(${previewRotation}deg)`,
                    transformOrigin: 'center',
                  }}
                  draggable={false}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 p-4 bg-black/50 backdrop-blur-sm border-t border-white/10">
              <Button
                onClick={zoomOut}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
                disabled={previewScale <= 0.1}
              >
                <ZoomOut className="h-4 w-4 mr-1" />
                Zoom Out
              </Button>
              
              <Button
                onClick={resetPreview}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <RotateCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              
              <Button
                onClick={rotateImage}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <RotateCw className="h-4 w-4 mr-1" />
                Rotate
              </Button>
              
              <Button
                onClick={zoomIn}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
                disabled={previewScale >= 5}
              >
                <ZoomIn className="h-4 w-4 mr-1" />
                Zoom In
              </Button>
              
              <Button
                onClick={() => downloadSlideImage(previewSlideNumber)}
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 