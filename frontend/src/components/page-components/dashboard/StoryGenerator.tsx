import React, { useState } from 'react';
import { Button } from "../../shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shadcn/select";
import { Checkbox } from "../../shadcn/checkbox";
import { PostData } from 'shared';
import { Loader2, FileText, Users, TrendingUp, Target, Sparkles } from 'lucide-react';
import { useApi } from '../../../contexts/ApiContext';
import { useNavigate } from 'react-router-dom';

interface StoryGeneratorProps {
    posts: PostData[];
}

interface StorySettings {
    slideType: 'growth' | 'content-evolution' | 'viral-moments' | 'audience-insights' | 'success-patterns' | 'performance-comparison' | 'roi-demonstration' | 'future-strategy';
    targetAudience: 'personal' | 'clients' | 'stakeholders' | 'team';
    tone: 'professional' | 'casual' | 'inspirational';
    focusAreas: string[];
    slideCount: number;
    selectedPostIds: string[];
}

const slideTypeOptions = [
    { value: 'growth', label: 'Growth Story', icon: TrendingUp, description: 'Journey from starting point to current success' },
    { value: 'content-evolution', label: 'Content Evolution', icon: FileText, description: 'How content strategy has evolved over time' },
    { value: 'viral-moments', label: 'Viral Moments', icon: Sparkles, description: 'Analysis of breakthrough content and its impact' },
    { value: 'audience-insights', label: 'Audience Insights', icon: Users, description: 'Deep dive into audience demographics and behavior' },
    { value: 'success-patterns', label: 'Success Patterns', icon: Target, description: 'Data-backed formulas for content success' },
    { value: 'performance-comparison', label: 'Performance Comparison', icon: TrendingUp, description: 'Before/after analysis of strategy changes' },
    { value: 'roi-demonstration', label: 'ROI Demonstration', icon: Target, description: 'Business impact of social media efforts' },
    { value: 'future-strategy', label: 'Future Strategy', icon: Sparkles, description: 'Data-driven recommendations for growth' }
];

const focusAreaOptions = [
    'Growth & Followers',
    'Engagement Rate',
    'Content Performance',
    'Audience Retention',
    'Revenue Impact',
    'Brand Awareness',
    'Viral Content',
    'Content Strategy'
];

export const StoryGenerator: React.FC<StoryGeneratorProps> = ({ posts }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { fetchWithAuth } = useApi();
    const navigate = useNavigate();
    
    const [settings, setSettings] = useState<StorySettings>({
        slideType: 'growth',
        targetAudience: 'clients',
        tone: 'professional',
        focusAreas: ['Growth & Followers', 'Content Performance'],
        slideCount: 6,
        selectedPostIds: [] // Default to no posts selected
    });

    const handleFocusAreaToggle = (area: string) => {
        setSettings(prev => ({
            ...prev,
            focusAreas: prev.focusAreas.includes(area)
                ? prev.focusAreas.filter(a => a !== area)
                : [...prev.focusAreas, area]
        }));
    };

    const handlePostSelection = (postId: string, checked: boolean) => {
        setSettings(prev => ({
            ...prev,
            selectedPostIds: checked
                ? [...prev.selectedPostIds, postId]
                : prev.selectedPostIds.filter(id => id !== postId)
        }));
    };

    const handleSelectAll = () => {
        setSettings(prev => ({
            ...prev,
            selectedPostIds: posts.map(p => p.id || '').filter(id => id !== '')
        }));
    };

    const handleUnselectAll = () => {
        setSettings(prev => ({
            ...prev,
            selectedPostIds: []
        }));
    };

    const handleGenerateStory = async () => {
        if (settings.selectedPostIds.length === 0) {
            setError('Please select at least one post to include in your story.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetchWithAuth('api/stories/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slideType: settings.slideType,
                    postIds: settings.selectedPostIds,
                    targetAudience: settings.targetAudience,
                    tone: settings.tone,
                    focusAreas: settings.focusAreas,
                    slideCount: settings.slideCount
                })
            });

            const data = await response.json();

            if (data && data.storyId) {
                // Navigate to the story view page
                navigate(`/story/${data.storyId}`);
            } else {
                setError('Failed to generate story. Please try again.');
            }
        } catch (error) {
            console.error('Story generation error:', error);
            setError('Failed to generate story. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedSlideType = slideTypeOptions.find(option => option.value === settings.slideType);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Story Generator</h3>
                    <p className="text-sm text-neutral-400">Transform your data into compelling story slides</p>
                </div>
            </div>

            {/* Story Type Selection */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-white">Story Type</label>
                <Select 
                    value={settings.slideType} 
                    onValueChange={(value: any) => setSettings(prev => ({ ...prev, slideType: value }))}
                >
                    <SelectTrigger className="bg-neutral-800/50 border-neutral-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-700">
                        {slideTypeOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <SelectItem key={option.value} value={option.value} className="hover:bg-neutral-800">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-4 w-4 text-indigo-400" />
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-xs text-neutral-400">{option.description}</div>
                                        </div>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* Story Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-white">Target Audience</label>
                    <Select 
                        value={settings.targetAudience} 
                        onValueChange={(value: any) => setSettings(prev => ({ ...prev, targetAudience: value }))}
                    >
                        <SelectTrigger className="bg-neutral-800/50 border-neutral-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-neutral-700">
                            <SelectItem value="personal">Personal Use</SelectItem>
                            <SelectItem value="clients">Clients</SelectItem>
                            <SelectItem value="stakeholders">Stakeholders</SelectItem>
                            <SelectItem value="team">Team</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-white">Tone</label>
                    <Select 
                        value={settings.tone} 
                        onValueChange={(value: any) => setSettings(prev => ({ ...prev, tone: value }))}
                    >
                        <SelectTrigger className="bg-neutral-800/50 border-neutral-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-neutral-700">
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="inspirational">Inspirational</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Focus Areas */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-white">Focus Areas</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {focusAreaOptions.map((area) => (
                        <div key={area} className="flex items-center gap-2">
                            <Checkbox 
                                checked={settings.focusAreas.includes(area)}
                                onCheckedChange={(checked) => handleFocusAreaToggle(area)}
                            />
                            <label className="text-sm text-neutral-300">{area}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Slide Count */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-white">Number of Slides</label>
                <Select 
                    value={settings.slideCount.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, slideCount: parseInt(value) }))}
                >
                    <SelectTrigger className="bg-neutral-800/50 border-neutral-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-700">
                        <SelectItem value="4">4 slides</SelectItem>
                        <SelectItem value="6">6 slides</SelectItem>
                        <SelectItem value="8">8 slides</SelectItem>
                        <SelectItem value="10">10 slides</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Post Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">
                        Select Posts ({settings.selectedPostIds.length} selected)
                    </label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            className="text-xs px-2 py-1 h-auto"
                        >
                            Select All
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleUnselectAll}
                            className="text-xs px-2 py-1 h-auto"
                        >
                            Unselect All
                        </Button>
                    </div>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                    {posts.map((post) => (
                        <div key={post.id} className="flex items-center gap-3 p-2 bg-neutral-800/30 rounded-lg">
                            <Checkbox 
                                checked={settings.selectedPostIds.includes(post.id || '')}
                                onCheckedChange={(checked) => handlePostSelection(post.id || '', !!checked)}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{post.title}</div>
                                <div className="text-xs text-neutral-400">
                                    {new Date(post.postDate).toLocaleDateString()} • {post.analytics?.views?.toLocaleString() || 0} views
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Generate Button */}
            <Button 
                className="w-full bg-indigo-500 hover:bg-indigo-600"
                onClick={handleGenerateStory}
                disabled={isLoading || settings.selectedPostIds.length === 0}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Story...
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Story Slides
                    </>
                )}
            </Button>
        </div>
    );
}; 