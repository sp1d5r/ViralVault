import React, { useState } from 'react';
import { Dialog, DialogContent } from "../../shadcn/dialog";
import { Button } from "../../shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shadcn/select";
import { Checkbox } from "../../shadcn/checkbox";
import { PostData } from 'shared';
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, FileText, Users, TrendingUp, Target, Loader2 } from "lucide-react";
import { useApi } from '../../../contexts/ApiContext';
import { useNavigate } from 'react-router-dom';
import { Input } from "../../shadcn/input";
import { Textarea } from "../../shadcn/textarea";

interface StoryGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    posts: PostData[];
}

interface StorySettings {
    slideType: 'relationship-drama' | 'personal-growth' | 'celebrity-story' | 'life-transformation' | 'social-commentary' | 'humorous-tale' | 'inspirational-journey' | 'drama-series';
    targetAudience: 'personal' | 'clients' | 'stakeholders' | 'team';
    tone: 'professional' | 'casual' | 'inspirational';
    focusAreas: string[];
    slideCount: number;
    selectedPostIds: string[];
    storyConcept: string;
    // Image customization options
    imageStyle: 'realistic' | 'cartoon' | 'anime' | 'minimalist' | '3d-render' | 'watercolor' | 'digital-art';
    aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | '3:2';
    characterStyle: string;
    colorScheme: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'monochrome';
}

const slideTypeOptions = [
    { value: 'relationship-drama', label: 'Relationship Drama', icon: TrendingUp, description: 'Love, heartbreak, and relationship struggles' },
    { value: 'personal-growth', label: 'Personal Growth', icon: FileText, description: 'Self-improvement and life lessons' },
    { value: 'celebrity-story', label: 'Celebrity Story', icon: Sparkles, description: 'Famous people and their dramatic moments' },
    { value: 'life-transformation', label: 'Life Transformation', icon: Users, description: 'Before and after life changes' },
    { value: 'social-commentary', label: 'Social Commentary', icon: Target, description: 'Commentary on society and trends' },
    { value: 'humorous-tale', label: 'Humorous Tale', icon: TrendingUp, description: 'Funny and entertaining stories' },
    { value: 'inspirational-journey', label: 'Inspirational Journey', icon: Target, description: 'Motivational and uplifting stories' },
    { value: 'drama-series', label: 'Drama Series', icon: Sparkles, description: 'Multi-part dramatic storytelling' }
];

const focusAreaOptions = [
    'Character Development',
    'Emotional Journey',
    'Plot Twists',
    'Visual Storytelling',
    'Engagement Hooks',
    'Narrative Flow',
    'Character Relationships',
    'Story Arc'
];

export const StoryGeneratorModal: React.FC<StoryGeneratorModalProps> = ({ isOpen, onClose, posts }) => {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const totalSteps = 3;
    const { fetchWithAuth } = useApi();
    const navigate = useNavigate();
    
    const [settings, setSettings] = useState<StorySettings>({
        slideType: 'relationship-drama',
        targetAudience: 'personal',
        tone: 'casual',
        focusAreas: ['Character Development', 'Emotional Journey'],
        slideCount: 6,
        selectedPostIds: posts.slice(-5).map(p => p.id || ''), // Default to last 5 posts
        storyConcept: '',
        imageStyle: 'realistic',
        aspectRatio: '9:16',
        characterStyle: '',
        colorScheme: 'warm'
    });

    const steps = [
        { title: "Story Type", icon: Sparkles },
        { title: "Configuration", icon: Target },
        { title: "Post Selection", icon: FileText },
    ];

    const validateStep = (currentStep: number): boolean => {
        if (currentStep === 2) {
            if (settings.selectedPostIds.length === 0) {
                setError('Please select at least one post to include in your story.');
                return false;
            }
        }
        setError(null);
        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((prev) => Math.min(prev + 1, totalSteps - 1));
        }
    };

    const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

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

    const handleGenerateStory = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
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
                    slideCount: settings.slideCount,
                    storyConcept: settings.storyConcept,
                    imageStyle: settings.imageStyle,
                    aspectRatio: settings.aspectRatio,
                    characterStyle: settings.characterStyle,
                    colorScheme: settings.colorScheme
                })
            });

            const data = await response.json();

            if (data && data.storyId) {
                setShowSuccess(true);
                // Wait for success animation before navigating
                setTimeout(() => {
                    navigate(`/story/${data.storyId}`);
                    onClose();
                }, 1500);
            } else {
                setError('Failed to generate story. Please try again.');
            }
        } catch (error) {
            console.error('Story generation error:', error);
            setError('Failed to generate story. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 gap-0 bg-neutral-950 overflow-hidden">
                <div className="flex h-[80vh] relative">
                    {/* Success Animation Layer */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ width: "33.333333%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center z-50"
                            >
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.2 }}
                                    className="flex flex-col items-center text-white"
                                >
                                    <div className="rounded-full bg-white p-3 mb-4">
                                        <Check size={30} className="text-indigo-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Story Generated!</h3>
                                    <p className="text-white/80">Redirecting to your story...</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Left Side - Animation Panel */}
                    <motion.div 
                        className="w-1/3 bg-gradient-to-br from-indigo-600 to-purple-700 p-6 flex flex-col justify-between"
                        animate={{ opacity: showSuccess ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Generate Story</h2>
                            <div className="space-y-4">
                                {steps.map((s, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className={`
                                            rounded-full p-2 
                                            ${idx === step ? 'bg-white text-indigo-600' : 
                                              idx < step ? 'bg-green-500 text-white' : 
                                              'bg-white/20 text-white/60'}
                                        `}>
                                            {idx < step ? <Check size={20} /> : <s.icon size={20} />}
                                        </div>
                                        <span className={`text-white ${idx === step ? 'opacity-100' : 'opacity-60'}`}>
                                            {s.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="text-white/80 text-sm">
                            Step {step + 1} of {totalSteps}
                        </div>
                    </motion.div>

                    {/* Right Side - Form Content */}
                    <motion.div 
                        className="w-2/3 p-6 overflow-y-auto text-white"
                        animate={{ opacity: showSuccess ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (step === totalSteps - 1) {
                                    handleGenerateStory();
                                }
                            }} 
                            className="h-full flex flex-col"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-1"
                                >
                                    {step === 0 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold mb-2">Choose Your Story Type</h3>
                                                <p className="text-neutral-400">Select the type of story you want to generate</p>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <Select 
                                                    value={settings.slideType} 
                                                    onValueChange={(value: any) => setSettings(prev => ({ ...prev, slideType: value }))}
                                                >
                                                    <SelectTrigger className="bg-neutral-900 border-neutral-700">
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

                                            {/* Story Concept */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium text-white">Story Concept (Optional)</label>
                                                <Textarea
                                                    value={settings.storyConcept}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, storyConcept: e.target.value }))}
                                                    className="bg-neutral-900 border-neutral-700 text-white min-h-[100px]"
                                                    placeholder="Describe your story idea... e.g., 'A woman gets heartbroken by her boyfriend but finds Nadeen and transforms her life' or 'Elon Musk gets upset about Trump drama but discovers Nadeen and finds happiness'"
                                                />
                                                <p className="text-xs text-neutral-400">
                                                    Be specific about characters, plot points, and the overall narrative you want to create
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-sm font-medium text-white">Target Audience</label>
                                                    <Select 
                                                        value={settings.targetAudience} 
                                                        onValueChange={(value: any) => setSettings(prev => ({ ...prev, targetAudience: value }))}
                                                    >
                                                        <SelectTrigger className="bg-neutral-900 border-neutral-700">
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
                                                        <SelectTrigger className="bg-neutral-900 border-neutral-700">
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
                                        </div>
                                    )}

                                    {step === 1 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold mb-2">Configure Your Story</h3>
                                                <p className="text-neutral-400">Customize the focus areas, slide count, and image generation preferences</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium text-white mb-3 block">Focus Areas</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {focusAreaOptions.map((area) => (
                                                            <div key={area} className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-lg">
                                                                <Checkbox 
                                                                    checked={settings.focusAreas.includes(area)}
                                                                    onCheckedChange={(checked) => handleFocusAreaToggle(area)}
                                                                />
                                                                <label className="text-sm text-neutral-300">{area}</label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-sm font-medium text-white">Number of Slides</label>
                                                    <Select 
                                                        value={settings.slideCount.toString()} 
                                                        onValueChange={(value) => setSettings(prev => ({ ...prev, slideCount: parseInt(value) }))}
                                                    >
                                                        <SelectTrigger className="bg-neutral-900 border-neutral-700">
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

                                                {/* Image Customization Section */}
                                                <div className="border-t border-neutral-700 pt-4">
                                                    <h4 className="text-sm font-medium text-white mb-4">Image Generation Preferences</h4>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-3">
                                                            <label className="text-sm font-medium text-white">Visual Style</label>
                                                            <Select 
                                                                value={settings.imageStyle} 
                                                                onValueChange={(value: any) => setSettings(prev => ({ ...prev, imageStyle: value }))}
                                                            >
                                                                <SelectTrigger className="bg-neutral-900 border-neutral-700">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-neutral-900 border-neutral-700">
                                                                    <SelectItem value="realistic">Realistic</SelectItem>
                                                                    <SelectItem value="cartoon">Cartoon</SelectItem>
                                                                    <SelectItem value="anime">Anime</SelectItem>
                                                                    <SelectItem value="minimalist">Minimalist</SelectItem>
                                                                    <SelectItem value="3d-render">3D Render</SelectItem>
                                                                    <SelectItem value="watercolor">Watercolor</SelectItem>
                                                                    <SelectItem value="digital-art">Digital Art</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-sm font-medium text-white">Aspect Ratio</label>
                                                            <Select 
                                                                value={settings.aspectRatio} 
                                                                onValueChange={(value: any) => setSettings(prev => ({ ...prev, aspectRatio: value }))}
                                                            >
                                                                <SelectTrigger className="bg-neutral-900 border-neutral-700">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-neutral-900 border-neutral-700">
                                                                    <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                                                                    <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                                                                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                                                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                                                                    <SelectItem value="3:2">3:2 (Photo)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-sm font-medium text-white">Color Scheme</label>
                                                            <Select 
                                                                value={settings.colorScheme} 
                                                                onValueChange={(value: any) => setSettings(prev => ({ ...prev, colorScheme: value }))}
                                                            >
                                                                <SelectTrigger className="bg-neutral-900 border-neutral-700">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-neutral-900 border-neutral-700">
                                                                    <SelectItem value="warm">Warm</SelectItem>
                                                                    <SelectItem value="cool">Cool</SelectItem>
                                                                    <SelectItem value="neutral">Neutral</SelectItem>
                                                                    <SelectItem value="vibrant">Vibrant</SelectItem>
                                                                    <SelectItem value="monochrome">Monochrome</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-sm font-medium text-white">Character Style (Optional)</label>
                                                            <Input
                                                                value={settings.characterStyle}
                                                                onChange={(e) => setSettings(prev => ({ ...prev, characterStyle: e.target.value }))}
                                                                className="bg-neutral-900 border-neutral-700 text-white"
                                                                placeholder="e.g., looks like Emma Stone, cartoon character"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold mb-2">Select Posts</h3>
                                                <p className="text-neutral-400">Choose which posts to include in your story ({settings.selectedPostIds.length} selected)</p>
                                            </div>

                                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                                {posts.map((post) => (
                                                    <div key={post.id} className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-lg">
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

                                            {error && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <p className="text-sm text-red-400">{error}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className="flex justify-end gap-2 pt-4 mt-auto">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={step === 0 ? onClose : handleBack}
                                    disabled={isSubmitting}
                                >
                                    {step === 0 ? 'Cancel' : 'Back'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={step === totalSteps - 1 ? handleGenerateStory : handleNext}
                                    className="bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Loader2 size={16} />
                                            </motion.div>
                                            Generating...
                                        </span>
                                    ) : (
                                        step === totalSteps - 1 ? 'Generate Story' : 'Next'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 