import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/shadcn/card';
import { Badge } from '../components/shadcn/badge';
import { ChevronLeft, ChevronRight, Download, Share2, ArrowLeft, Sparkles, Copy, Plus } from 'lucide-react';
import { useApi } from '../contexts/ApiContext';
import { toast } from '../contexts/ToastProvider';
import { FirebaseDatabaseService } from 'shared';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '../components/shadcn/breadcrumbs';

interface StorySlide {
    slideNumber: number;
    slideType: string;
    title: string;
    content: string;
    imagePrompt: string;
    dataPoints?: string[];
    recommendations?: string[];
}

interface GeneratedStory {
    title: string;
    slides: StorySlide[];
    summary: string;
    keyInsights: string[];
    nextSteps: string[];
}

interface StoryDocument {
    id: string;
    userId: string;
    slideType: string;
    targetAudience: string;
    tone: string;
    focusAreas: string[];
    slideCount: number;
    postIds: string[];
    generatedStory: GeneratedStory;
    timestamp: number;
}

export const StoryPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchWithAuth } = useApi();
    const [story, setStory] = useState<StoryDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const fetchStory = async () => {
            if (!id) return;

            try {
                const response = await fetchWithAuth(`api/stories/${id}`);
                const data = await response.json();
                setStory(data);
            } catch (err) {
                console.error('Error fetching story:', err);
                setError('Failed to load story');
            } finally {
                setLoading(false);
            }
        };

        fetchStory();
    }, [id, fetchWithAuth]);

    const nextSlide = () => {
        if (story && currentSlide < story.generatedStory.slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const goToSlide = (slideIndex: number) => {
        setCurrentSlide(slideIndex);
    };

    const handleConvertToPosts = async () => {
        if (!story) return;

        try {
            // Convert the entire story into ONE single post
            const allSlidesContent = story.generatedStory.slides.map((slide, index) => 
                `SLIDE ${index + 1}: ${slide.title}\n${slide.content}\n\nIMAGE PROMPT: ${slide.imagePrompt}\n\nSTORY BEATS: ${slide.dataPoints?.join(', ') || 'N/A'}\n\nRECOMMENDATIONS: ${slide.recommendations?.join(', ') || 'N/A'}\n\n---\n`
            ).join('\n');

            const singlePost = {
                title: story.generatedStory.title,
                postDate: new Date(Date.now()).toISOString().slice(0, 16),
                status: 'draft' as const,
                hook: story.generatedStory.slides[0]?.title || story.generatedStory.title, // Use first slide title as hook
                script: `STORY: ${story.generatedStory.title}\n\nSUMMARY: ${story.generatedStory.summary}\n\nTOTAL SLIDES: ${story.generatedStory.slides.length}\n\n${allSlidesContent}\n\nKEY INSIGHTS: ${story.generatedStory.keyInsights.join(', ')}\n\nNEXT STEPS: ${story.generatedStory.nextSteps.join(', ')}`,
                song: '', // Leave empty for user to fill
                notes: `Generated from story: ${story.generatedStory.title}\nTotal slides: ${story.generatedStory.slides.length}\nStory type: ${story.slideType}\nTarget audience: ${story.targetAudience}\nTone: ${story.tone}`,
                postReleaseNotes: `Complete story: ${story.generatedStory.title}\nSlides: ${story.generatedStory.slides.length}\nType: ${story.slideType}\nAudience: ${story.targetAudience}\nTone: ${story.tone}`,
                tags: [
                    'story-generated',
                    'complete-story',
                    story.slideType,
                    story.targetAudience,
                    story.tone,
                    ...story.focusAreas
                ],
                createdAt: Date.now(),
                userId: story.userId,
            };

            // Create the single post
            await new Promise<void>((resolve, reject) => {
                FirebaseDatabaseService.addDocument(
                    'tiktok-posts',
                    singlePost,
                    (docId: string) => {
                        resolve();
                    },
                    (error: Error) => {
                        reject(error);
                    }
                );
            });

            // Show success message
            toast({
                title: "Post Created!",
                description: `Successfully converted story into a single post with ${story.generatedStory.slides.length} slides. Check your posts dashboard.`,
            });

        } catch (error) {
            console.error('Error converting story to post:', error);
            toast({
                title: "Error",
                description: "Failed to convert story to post. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                    <span>Loading your story...</span>
                </div>
            </div>
        );
    }

    if (error || !story) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || 'Story not found'}</p>
                    <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard')}
                        className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const currentSlideData = story.generatedStory.slides[currentSlide];

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
            {/* Header */}
            <div className="border-b border-neutral-700 bg-neutral-900/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <Breadcrumb className="text-white mb-4">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Stories</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href={`/story/${id}`}>{story.generatedStory.title}</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">{story.generatedStory.title}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300">
                                    {story.slideType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                                    {story.targetAudience}
                                </Badge>
                                <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                                    {story.tone}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleConvertToPosts}
                                className="bg-green-500/10 border-green-500/20 text-green-300 hover:bg-green-500/20"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Convert to Posts
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20"
                            >
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Slide Navigation */}
                    <div className="w-64 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Slides</h3>
                        <div className="space-y-2">
                            {story.generatedStory.slides.map((slide, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${
                                        currentSlide === index
                                            ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                                            : 'bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300'
                                    }`}
                                >
                                    <div className="text-sm font-medium">{slide.title}</div>
                                    <div className="text-xs text-neutral-400 mt-1">
                                        Slide {slide.slideNumber} • {slide.slideType}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Story Summary */}
                        <Card className="bg-neutral-800/50 border-neutral-700">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-white">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-xs text-neutral-300">{story.generatedStory.summary}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Slide Display */}
                    <div className="flex-1">
                        <div className="bg-neutral-800/50 rounded-xl p-8 border border-neutral-700 min-h-[600px]">
                            {/* Slide Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <Badge variant="outline" className="border-neutral-600 text-neutral-300 mb-2">
                                        Slide {currentSlide + 1} of {story.generatedStory.slides.length}
                                    </Badge>
                                    <h2 className="text-2xl font-bold text-white">{currentSlideData.title}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={prevSlide}
                                        disabled={currentSlide === 0}
                                        className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={nextSlide}
                                        disabled={currentSlide === story.generatedStory.slides.length - 1}
                                        className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Slide Content */}
                            <div className="space-y-6">
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-lg text-neutral-200 leading-relaxed">
                                        {currentSlideData.content}
                                    </p>
                                </div>

                                {/* Image Prompt */}
                                <div className="border-t border-neutral-700 pt-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-neutral-300">AI Image Prompt</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(currentSlideData.imagePrompt);
                                                toast({
                                                    title: "Image prompt copied!",
                                                    description: "Ready to paste in your image generator",
                                                });
                                            }}
                                            className="bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
                                        >
                                            Copy Prompt
                                        </Button>
                                    </div>
                                    <div className="p-4 bg-neutral-700/30 rounded-lg border border-neutral-600">
                                        <p className="text-sm text-neutral-200 font-mono leading-relaxed">
                                            {currentSlideData.imagePrompt}
                                        </p>
                                    </div>
                                    <p className="text-xs text-neutral-400 mt-2">
                                        Use this prompt in DALL-E, Midjourney, or other AI image generators
                                    </p>
                                </div>

                                {/* Data Points */}
                                {currentSlideData.dataPoints && currentSlideData.dataPoints.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-300 mb-3">Key Data Points</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {currentSlideData.dataPoints.map((point, index) => (
                                                <div key={index} className="p-3 bg-neutral-700/30 rounded-lg">
                                                    <p className="text-sm text-neutral-200">{point}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {currentSlideData.recommendations && currentSlideData.recommendations.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-300 mb-3">Recommendations</h4>
                                        <div className="space-y-2">
                                            {currentSlideData.recommendations.map((rec, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                                    <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                                                    <p className="text-sm text-neutral-200">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Key Insights & Next Steps */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <Card className="bg-neutral-800/50 border-neutral-700">
                                <CardHeader>
                                    <CardTitle className="text-white">Key Insights</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {story.generatedStory.keyInsights.map((insight, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-sm text-neutral-300">{insight}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-neutral-800/50 border-neutral-700">
                                <CardHeader>
                                    <CardTitle className="text-white">Next Steps</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {story.generatedStory.nextSteps.map((step, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-sm text-neutral-300">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 