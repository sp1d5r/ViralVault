import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "../../shadcn/dialog";
import { Button } from "../../shadcn/button";
import { Input } from "../../shadcn/input";
import { Textarea } from "../../shadcn/textarea";
import { Label } from "../../shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shadcn/select";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Rocket, FileText, Music, X, Plus, LineChart } from "lucide-react";
import { Badge } from "../../shadcn/badge";
import { PostData } from "shared";
import { FirebaseDatabaseService } from "shared";
import { toast } from "../../../contexts/ToastProvider";
import { useAuth } from "../../../contexts/AuthenticationProvider";

interface EditPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: PostData;
}

// Add error state interface
interface FormErrors {
    title?: string;
    postDate?: string;
    media?: string;
    hook?: string;
}

const formatSecondsToTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h:${m}m:${s}s`;
};

const parseTimeToSeconds = (timeStr: string): number => {
    // Handle empty or invalid input
    if (!timeStr) return 0;

    const parts = timeStr.toLowerCase().split(':');
    if (parts.length !== 3) return 0;

    try {
        const hours = parseInt(parts[0].replace('h', '')) || 0;
        const minutes = parseInt(parts[1].replace('m', '')) || 0;
        const seconds = parseInt(parts[2].replace('s', '')) || 0;

        return (hours * 3600) + (minutes * 60) + seconds;
    } catch {
        return 0;
    }
};

export const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, onClose, post }) => {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const totalSteps = 4;
    const [formData, setFormData] = useState<PostData>(post);
    const [currentTag, setCurrentTag] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const {authState} = useAuth();

    const steps = [
        { title: "Basic Details", icon: FileText },
        { title: "Content", icon: Rocket },
        { title: "Analytics", icon: LineChart },
        { title: "Finishing Touches", icon: Music },
    ];

    const validateStep = (currentStep: number): boolean => {
        const newErrors: FormErrors = {};
        
        if (currentStep === 0) {
            if (!formData.title.trim()) {
                newErrors.title = 'Title is required';
            }
            if (!formData.postDate) {
                newErrors.postDate = 'Post date is required';
            }
        } else if (currentStep === 1) {
            if (!formData.hook.trim()) {
                newErrors.hook = 'Hook is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((prev) => Math.min(prev + 1, totalSteps - 1));
        }
    };

    const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev: PostData) => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentTag.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(currentTag.trim())) {
                setFormData((prev: PostData) => ({
                    ...prev,
                    tags: [...prev.tags, currentTag.trim()]
                }));
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData((prev: PostData) => ({
            ...prev,
            tags: prev.tags.filter((tag: string) => tag !== tagToRemove)
        }));
    };

    const [analyticsData, setAnalyticsData] = useState(post.analytics || {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        favorites: 0,
        totalPlayTime: 0,
        avgWatchTime: 0,
        fullVideoPercentage: 0,
    });

    const renderStepContent = () => {
        switch(step) {
            case 0:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input 
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required 
                                variant="minimal"
                                placeholder="Enter your post title..."
                                className={`text-xl font-bold ${errors.title ? 'border-red-500' : ''}`}
                            />
                            {errors.title && (
                                <p className="text-red-500 text-sm">{errors.title}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Input 
                                name="postDate"
                                type="datetime-local"
                                value={formData.postDate}
                                onChange={handleInputChange}
                                variant="minimal"
                                required 
                                className={errors.postDate ? 'border-red-500' : ''}
                            />
                            {errors.postDate && (
                                <p className="text-red-500 text-sm">{errors.postDate}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select>
                                <SelectTrigger className="bg-neutral-900">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="posted">Posted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.tags.map((tag: string) => (
                                    <Badge 
                                        key={tag}
                                        variant="secondary"
                                        className="bg-neutral-800 text-white"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="ml-2 hover:text-neutral-400"
                                        >
                                            <X size={14} />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="relative">
                                <Input
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    variant="minimal"
                                    placeholder="Type a tag and press Enter..."
                                    className="pr-8"
                                />
                                {currentTag && (
                                    <button
                                        onClick={() => {
                                            if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
                                                setFormData((prev: PostData) => ({
                                                    ...prev,
                                                    tags: [...prev.tags, currentTag.trim()]
                                                }));
                                                setCurrentTag('');
                                            }
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-4">
                        <p className='text-xl font-bold'>{formData.title}</p>
                        <div className="space-y-2">
                            <Label htmlFor="hook">Hook Used *</Label>
                            <Textarea 
                                id="hook"
                                name="hook"
                                placeholder='Enter your hook here...'
                                variant="minimal"
                                value={formData.hook}
                                onChange={handleInputChange}
                                required 
                                className={errors.hook ? 'border-red-500' : ''}
                            />
                            {errors.hook && (
                                <p className="text-red-500 text-sm">{errors.hook}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="script">Full Script</Label>
                            <Textarea 
                                id="script"
                                name="script"
                                value={formData.script}
                                onChange={handleInputChange}
                                variant="minimal"
                                rows={10}
                                placeholder='Enter your full script here...'
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold mb-4">Performance Metrics</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Views</Label>
                                <Input
                                    type="number"
                                    value={analyticsData.views}
                                    onChange={(e) => setAnalyticsData(prev => ({
                                        ...prev,
                                        views: parseInt(e.target.value) || 0
                                    }))}
                                    variant="minimal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Likes</Label>
                                <Input
                                    type="number"
                                    value={analyticsData.likes}
                                    onChange={(e) => setAnalyticsData(prev => ({
                                        ...prev,
                                        likes: parseInt(e.target.value) || 0
                                    }))}
                                    variant="minimal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Comments</Label>
                                <Input
                                    type="number"
                                    value={analyticsData.comments}
                                    onChange={(e) => setAnalyticsData(prev => ({
                                        ...prev,
                                        comments: parseInt(e.target.value) || 0
                                    }))}
                                    variant="minimal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Shares</Label>
                                <Input
                                    type="number"
                                    value={analyticsData.shares}
                                    onChange={(e) => setAnalyticsData(prev => ({
                                        ...prev,
                                        shares: parseInt(e.target.value) || 0
                                    }))}
                                    variant="minimal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Average Watch Time (seconds)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={analyticsData.avgWatchTime}
                                    onChange={(e) => setAnalyticsData(prev => ({
                                        ...prev,
                                        avgWatchTime: parseFloat(e.target.value) || 0
                                    }))}
                                    variant="minimal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Full Video Percentage</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={analyticsData.fullVideoPercentage}
                                    onChange={(e) => setAnalyticsData(prev => ({
                                        ...prev,
                                        fullVideoPercentage: parseFloat(e.target.value) || 0
                                    }))}
                                    variant="minimal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Total Play Time</Label>
                                <Input
                                    type="text"
                                    value={formatSecondsToTime(analyticsData.totalPlayTime || 0)}
                                    onChange={(e) => setAnalyticsData(prev => ({
                                        ...prev,
                                        totalPlayTime: parseTimeToSeconds(e.target.value)
                                    }))}
                                    placeholder="0h:0m:0s"
                                    variant="minimal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>New Followers</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={analyticsData.newFollowers || 0}
                                    onChange={(e) => setAnalyticsData(prev => ({
                                        ...prev,
                                        newFollowers: parseInt(e.target.value) || 0
                                    }))}
                                    variant="minimal"
                                />
                            </div>
                        </div>

                        <div className="mt-8">
                            <h4 className="font-semibold mb-4">Performance Trends</h4>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="song">Background Song</Label>
                            <Input id="song" name="song" className="bg-neutral-900" value={formData.song} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Pre-release Notes</Label>
                            <Textarea 
                                id="notes" 
                                name="notes"
                                placeholder={formData.notes || "Your thoughts and plans..."}
                                className="bg-neutral-900"
                                value={formData.notes}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                );
        }
    };

    const handleSubmit = async () => {
        if (!authState.user?.uid || !post.id) {
            toast({
                title: 'Error: Cannot edit post',
                description: 'Missing post ID or user authentication',
                variant: 'destructive',
            });
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        const updatedPost: PostData = {
            ...formData,
            analytics: analyticsData,
            id: post.id,
            userId: post.userId,
            createdAt: post.createdAt,
        };

        try {
            await FirebaseDatabaseService.updateDocument(
                'tiktok-posts',
                post.id,
                updatedPost,
                () => {
                    toast({
                        title: 'Post updated successfully!',
                        variant: 'default',
                    });
                    setShowSuccess(true);
                    setTimeout(() => {
                        onClose();
                        setShowSuccess(false);
                    }, 1500);
                },
                (error: Error) => {
                    toast({
                        title: `Failed to update post: ${error.message}`,
                        variant: 'destructive',
                    });
                }
            );
        } catch (error) {
            console.error('Error updating post:', error);
            toast({
                title: 'Something went wrong while updating the post',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        setFormData(post);
        setStep(0);
        setShowSuccess(false);
    }, [post]);

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
                                    <h3 className="text-2xl font-bold mb-2">Success!</h3>
                                    <p className="text-white/80">Post updated</p>
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
                            <h2 className="text-2xl font-bold text-white">Edit Post</h2>
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
                                    handleSubmit();
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
                                    {renderStepContent()}
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
                                    onClick={step === totalSteps - 1 ? handleSubmit : handleNext}
                                    className="bg-indigo-500 hover:bg-indigo-600"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Rocket size={16} />
                                            </motion.div>
                                            Saving...
                                        </span>
                                    ) : (
                                        step === totalSteps - 1 ? 'Update Post' : 'Next'
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