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

interface StoryGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
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

export const StoryGeneratorModal: React.FC<StoryGeneratorModalProps> = ({ isOpen, onClose, posts }) => {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const totalSteps = 3;
    const { fetchWithAuth } = useApi();
    const navigate = useNavigate();
    
    const [settings, setSettings] = useState<StorySettings>({
        slideType: 'growth',
        targetAudience: 'clients',
        tone: 'professional',
        focusAreas: ['Growth & Followers', 'Content Performance'],
        slideCount: 6,
        selectedPostIds: posts.slice(-5).map(p => p.id || '') // Default to last 5 posts
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
                    slideCount: settings.slideCount
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
                                                <p className="text-neutral-400">Customize the focus areas and slide count</p>
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
                                    onClick={step === 0 ? onClose : handleBack}
                                    disabled={isSubmitting}
                                >
                                    {step === 0 ? 'Cancel' : 'Back'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={step === totalSteps - 1 ? handleGenerateStory : handleNext}
                                    className="bg-indigo-500 hover:bg-indigo-600"
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