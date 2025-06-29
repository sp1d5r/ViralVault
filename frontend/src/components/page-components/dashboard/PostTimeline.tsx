import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FirebaseDatabaseService } from 'shared';
import { Skeleton } from '../../shadcn/skeleton';
import { Edit, ChartBar, FileText, Share2, Heart, MessageCircle, Play, Star, Clock, Trash2, Save, UserPlus, Scroll, BookOpen } from 'lucide-react';
import { Button } from '../../shadcn/button';
import { PostData, Analytics } from 'shared';
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../shadcn/dialog";
import { toast } from '../../../contexts/ToastProvider';
import { Textarea } from "../../shadcn/textarea";
import { EditPostModal } from './EditPostModal';
import { parseTimeToSeconds, formatSecondsToTime } from '../../../lib/utils';
import { Input } from '../../shadcn/input';
import { GraphContainer } from './ChartContainer';
import { useNavigate } from 'react-router-dom';

// Add this type at the top of the file
type GraphType = keyof NonNullable<Analytics['graphs']>;

// Function to generate a color from string
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 50%)`;
};


const PostTimelineItem: React.FC<{ post: PostData; onDelete: (id: string) => void }> = ({ post, onDelete }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isEditingPreNotes, setIsEditingPreNotes] = useState(false);
    const [isEditingPostNotes, setIsEditingPostNotes] = useState(false);
    const [preNotes, setPreNotes] = useState(post.notes || '');
    const [postNotes, setPostNotes] = useState(post.postReleaseNotes || '');
    const gradientColor = stringToColor(post.title);
    const [isEditingAnalytics, setIsEditingAnalytics] = useState(false);
    const [analytics, setAnalytics] = useState<Analytics>(post.analytics || {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        favorites: 0,
        totalPlayTime: 0,
        avgWatchTime: 0,
        fullVideoPercentage: 0,
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [isEditingScript, setIsEditingScript] = useState(false);
    const [script, setScript] = useState(post.script || '');
    const [showFullScript, setShowFullScript] = useState(false);
    const navigate = useNavigate();
    
    // Check if this post was generated from a story
    const isStoryGenerated = post.tags.includes('story-generated') && post.storyId;

    useEffect(() => {
        console.log('Post Analytics Data:', {
            hasGraphs: !!post.analytics?.graphs,
            retentionPoints: post.analytics?.graphs?.retention?.points,
            viewDistPoints: post.analytics?.graphs?.viewDistribution?.points
        });
    }, [post.analytics]);

    // Function to truncate script text
    const truncateScript = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const handleDelete = () => {
        if (post.id) {
            onDelete(post.id);
        } else {
            console.error('Post ID is undefined');
        }
        setShowDeleteDialog(false);
    };

    const handleUpdateNotes = async (type: 'pre' | 'post') => {
        if (!post.id) return;
        
        try {
            await FirebaseDatabaseService.updateDocument<PostData>(
                'tiktok-posts',
                post.id,
                {
                    ...(type === 'pre' ? { notes: preNotes } : { postReleaseNotes: postNotes })
                },
                () => {
                    toast({
                        title: 'Notes updated successfully',
                        variant: 'default',
                    });
                    if (type === 'pre') {
                        setIsEditingPreNotes(false);
                    } else {
                        setIsEditingPostNotes(false);
                    }
                },
                (error) => {
                    toast({
                        title: 'Failed to update notes: ' + error.message,
                        variant: 'destructive',
                    });
                }
            );
        } catch (error) {
            console.error('Error updating notes:', error);
            toast({
                title: 'Something went wrong while updating notes',
                variant: 'destructive',
            });
        }
    };

    const handleUpdateAnalytics = async () => {
        if (!post.id) return;
        
        try {
            await FirebaseDatabaseService.updateDocument(
                'tiktok-posts',
                post.id,
                {
                    analytics
                },
                () => {
                    toast({
                        title: 'Analytics updated successfully',
                        variant: 'default',
                    });
                    setIsEditingAnalytics(false);
                },
                (error) => {
                    toast({
                        title: 'Failed to update analytics: ' + error.message,
                        variant: 'destructive',
                    });
                }
            );
        } catch (error) {
            console.error('Error updating analytics:', error);
            toast({
                title: 'Something went wrong while updating analytics',
                variant: 'destructive',
            });
        }
    };

    const handleGraphUpdate = async (
        graphType: GraphType,
        newData: { x: number; y: number }[],
        title: string
    ) => {
        if (!post.id) return;

        try {
            await FirebaseDatabaseService.updateDocument(
                'tiktok-posts',
                post.id,
                {
                    analytics: {
                        ...post.analytics,
                        graphs: {
                            ...post.analytics?.graphs,
                            [graphType]: { points: newData }
                        }
                    }
                },
                () => {
                    toast({
                        title: `${title} updated`,
                        variant: 'default',
                    });
                },
                (error) => {
                    toast({
                        title: `Failed to update ${title.toLowerCase()}: ${error.message}`,
                        variant: 'destructive',
                    });
                }
            );
        } catch (error) {
            console.error(`Error updating ${title.toLowerCase()}:`, error);
            toast({
                title: `Something went wrong while updating ${title.toLowerCase()}`,
                variant: 'destructive',
            });
        }
    };

    const handleUpdateScript = async () => {
        if (!post.id) return;
        
        try {
            await FirebaseDatabaseService.updateDocument(
                'tiktok-posts',
                post.id,
                {
                    script
                },
                () => {
                    toast({
                        title: 'Script updated successfully',
                        variant: 'default',
                    });
                    setIsEditingScript(false);
                },
                (error) => {
                    toast({
                        title: 'Failed to update script: ' + error.message,
                        variant: 'destructive',
                    });
                }
            );
        } catch (error) {
            console.error('Error updating script:', error);
            toast({
                title: 'Something went wrong while updating script',
                variant: 'destructive',
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4 relative md:px-8 pb-8 group"
        >
            {/* Timeline dot and line - hidden on mobile */}
            <div className="absolute left-0 top-0 h-full hidden md:block">
                <div className="w-4 h-4 rounded-full bg-neutral-700 border-4 border-neutral-900 relative z-10" />
                <div 
                    className="absolute left-1/2 top-0 h-[calc(100%+2rem)] w-0.5 bg-neutral-800 -translate-x-1/2" 
                    style={{ top: '1rem' }}
                />
            </div>

            {/* Content card */}
            <div className="flex-1 space-y-4">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 hover:bg-neutral-700/50 transition-all">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div 
                            className="w-full h-32 md:w-24 md:h-24 rounded-lg flex-shrink-0"
                            style={{
                                background: `linear-gradient(135deg, ${gradientColor}, ${stringToColor(post.title + 'alt')})`
                            }}
                        />
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-white">{post.title}</h3>
                                    {isStoryGenerated && (
                                        <span 
                                            className="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                            title="Generated from Story"
                                        >
                                            📖 Story
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-neutral-400">
                                    {new Date(post.postDate).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-neutral-300 line-clamp-2">{post.hook}</p>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag: string) => (
                                    <span 
                                        key={tag}
                                        className="px-2 py-1 rounded-full text-xs"
                                        style={{
                                            backgroundColor: `${stringToColor(tag)}20`,
                                            color: 'white'
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Update the script display section */}
                            {isEditingScript ? (
                                <div className="flex gap-2 items-center mt-2">
                                    <Textarea
                                        value={script}
                                        onChange={(e) => setScript(e.target.value)}
                                        className="flex-1 bg-neutral-800/50"
                                        placeholder="Enter script..."
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleUpdateScript}
                                    >
                                        <Save size={16} />
                                    </Button>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <p className="text-sm text-neutral-300">
                                        Script: {showFullScript ? post.script : truncateScript(post.script || '')}
                                    </p>
                                    {(post.script && post.script.length > 100) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowFullScript(!showFullScript)}
                                            className="text-xs text-neutral-400 hover:text-neutral-300 mt-1"
                                        >
                                            {showFullScript ? 'Show less' : 'Show more'}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Song choice */}
                            {post.song && (
                                <div className="text-sm text-neutral-400">
                                    🎵 {post.song}
                                </div>
                            )}

                            {/* Analytics Preview */}
                            <div className="flex flex-wrap justify-start items-center gap-2">
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <Play size={14} /> {analytics.views?.toLocaleString() || '0'}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <Heart size={14} /> {analytics.likes?.toLocaleString() || '0'}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <MessageCircle size={14} /> {analytics.comments?.toLocaleString() || '0'}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <Share2 size={14} /> {analytics.shares?.toLocaleString() || '0'}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <Star size={14} /> {analytics.favorites?.toLocaleString() || '0'}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <Clock size={14} /> {formatSecondsToTime(analytics.totalPlayTime || 0)}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <UserPlus size={14} /> {analytics.newFollowers?.toLocaleString() || '0'}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setShowEditModal(true)}
                                >
                                    <Edit size={16} />
                                </Button>
                                <Button 
                                    variant={isEditingScript ? "outline" : "ghost"}
                                    size="sm"
                                    onClick={() => setIsEditingScript(!isEditingScript)}
                                >
                                    <Scroll size={16} />
                                </Button>
                                <Button 
                                    variant={showAnalytics ? "outline" : "ghost"}
                                    size="sm"
                                    onClick={() => setShowAnalytics(!showAnalytics)}
                                >
                                    <ChartBar size={16} />
                                </Button>
                                <Button 
                                    variant={showNotes ? "outline" : "ghost"}
                                    size="sm"
                                    onClick={() => setShowNotes(!showNotes)}
                                >
                                    <FileText size={16} />
                                </Button>
                                {isStoryGenerated && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => navigate(`/story/${post.storyId}`)}
                                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                                        title="View Original Story"
                                    >
                                        <BookOpen size={16} />
                                    </Button>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Expandable Notes Sections */}
                {showAnalytics && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                    >
                        <div className="border border-indigo-700/50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Detailed Analytics</h4>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                        if (isEditingAnalytics) {
                                            handleUpdateAnalytics();
                                        } else {
                                            setIsEditingAnalytics(true);
                                        }
                                    }}
                                >
                                    {isEditingAnalytics ? <Save size={16} /> : <Edit size={16} />}
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Engagement Metrics */}
                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-neutral-400">Engagement</h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-400">Views</span>
                                            {isEditingAnalytics ? (
                                                <Input
                                                    type="number"
                                                    value={analytics.views}
                                                    onChange={(e) => setAnalytics((prev: Analytics) => ({
                                                        ...prev,
                                                        views: parseInt(e.target.value) || 0
                                                    }))}
                                                    className="w-24 h-7 text-right"
                                                />
                                            ) : (
                                                <span>{analytics.views?.toLocaleString()}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-400">Likes</span>
                                            {isEditingAnalytics ? (
                                                <Input
                                                    type="number"
                                                    value={analytics.likes}
                                                    onChange={(e) => setAnalytics((prev: Analytics) => ({
                                                        ...prev,
                                                        likes: parseInt(e.target.value) || 0
                                                    }))}
                                                    className="w-24 h-7 text-right"
                                                />
                                            ) : (
                                                <span>{analytics.likes?.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Watch Time Metrics */}
                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-neutral-400">Watch Time</h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-400">Total Play Time</span>
                                            {isEditingAnalytics ? (
                                                <Input
                                                    type="text"
                                                    value={formatSecondsToTime(analytics.totalPlayTime || 0)}
                                                    onChange={(e) => setAnalytics((prev: Analytics) => ({
                                                        ...prev,
                                                        totalPlayTime: parseTimeToSeconds(e.target.value)
                                                    }))}
                                                    className="w-32 h-7 text-right"
                                                />
                                            ) : (
                                                <span>{formatSecondsToTime(analytics.totalPlayTime || 0)}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-400">Avg Watch Time</span>
                                            {isEditingAnalytics ? (
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={analytics.avgWatchTime}
                                                    onChange={(e) => setAnalytics((prev: Analytics) => ({
                                                        ...prev,
                                                        avgWatchTime: parseFloat(e.target.value) || 0
                                                    }))}
                                                    className="w-24 h-7 text-right"
                                                />
                                            ) : (
                                                <span>{analytics.avgWatchTime?.toFixed(1)}s</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Growth Metrics */}
                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-neutral-400">Growth</h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-400">New Followers</span>
                                            {isEditingAnalytics ? (
                                                <Input
                                                    type="number"
                                                    value={analytics.newFollowers}
                                                    onChange={(e) => setAnalytics((prev: Analytics) => ({
                                                        ...prev,
                                                        newFollowers: parseInt(e.target.value) || 0
                                                    }))}
                                                    className="w-24 h-7 text-right"
                                                />
                                            ) : (
                                                <span>{analytics.newFollowers?.toLocaleString() || 0}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Metrics */}
                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-neutral-400">Performance</h5>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-400">Full Video %</span>
                                            {isEditingAnalytics ? (
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={analytics.fullVideoPercentage}
                                                    onChange={(e) => setAnalytics((prev: Analytics) => ({
                                                        ...prev,
                                                        fullVideoPercentage: parseInt(e.target.value) || 0
                                                    }))}
                                                    className="w-24 h-7 text-right"
                                                />
                                            ) : (
                                                <span>{analytics.fullVideoPercentage}%</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <GraphContainer
                            title="24-Hour View Distribution"
                            xAxisTitle="Hour"
                            yAxisTitle="Views"
                            borderColor="border-indigo-500"
                            xAxisType="hours"
                            maxXValue={24}
                            maxYValue={analytics.views || 100}
                            data={post.analytics?.graphs?.viewDistribution?.points || undefined}
                            onSubmit={(newData) => handleGraphUpdate(
                                'viewDistribution',
                                newData,
                                'View distribution'
                            )}
                            interpolate={true}
                        />

                        <GraphContainer
                            title="Video Retention"
                            xAxisTitle="Time (seconds)"
                            yAxisTitle="Viewers (%)"
                            borderColor="border-green-500"
                            xAxisType="seconds"
                            maxXValue={post.duration || 60}
                            maxYValue={100}
                            interpolate={true}
                            data={post.analytics?.graphs?.retention?.points}
                            onSubmit={(newData) => handleGraphUpdate(
                                'retention',
                                newData,
                                'Retention data'
                            )}
                        />
                    </motion.div>
                )}


                {/* Expandable Notes Sections */}
                {showNotes && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                    >
                        <div className="flex justify-between items-stretch gap-2">
                            {/* Pre-release Notes */}
                            <div className="border border-indigo-900/70 rounded-lg p-4 flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">Pre-release Notes</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (isEditingPreNotes) {
                                                handleUpdateNotes('pre');
                                            } else {
                                                setIsEditingPreNotes(true);
                                            }
                                        }}
                                    >
                                        {isEditingPreNotes ? <Save size={16} /> : <Edit size={16} />}
                                    </Button>
                                </div>
                                {isEditingPreNotes ? (
                                    <Textarea
                                        value={preNotes}
                                        onChange={(e) => setPreNotes(e.target.value)}
                                        className="min-h-[100px] bg-neutral-800/50"
                                    />
                                ) : (
                                    <p className="text-neutral-300">{preNotes || 'No pre-release notes'}</p>
                                )}
                            </div>

                            {/* Post-release Notes */}
                            <div className="border border-indigo-800/70 rounded-lg p-4 flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">Post-release Notes</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (isEditingPostNotes) {
                                                handleUpdateNotes('post');
                                            } else {
                                                setIsEditingPostNotes(true);
                                            }
                                        }}
                                    >
                                        {isEditingPostNotes ? <Save size={16} /> : <Edit size={16} />}
                                    </Button>
                                </div>
                                {isEditingPostNotes ? (
                                    <Textarea
                                        value={postNotes}
                                        onChange={(e) => setPostNotes(e.target.value)}
                                        className="min-h-[100px] bg-neutral-800/50"
                                    />
                                ) : (
                                    <p className="text-neutral-300">{postNotes || 'No post-release notes yet'}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent className="sm:max-w-[425px] text-white">
                        <DialogHeader>
                            <DialogTitle>Delete Post</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{post.title}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <EditPostModal 
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    post={post}
                />
            </div>
        </motion.div>
    );
};

const PostTimelineSkeleton = () => (
    <div className="flex gap-4 relative px-1 md:px-8 pb-8">
        <div className="absolute left-0 top-0 h-full hidden md:block">
            <div className="w-4 h-4 rounded-full bg-neutral-800 relative z-10" />
            <div 
                className="absolute left-1/2 top-0 h-[calc(100%+2rem)] w-0.5 bg-neutral-800 -translate-x-1/2" 
                style={{ top: '1rem' }}
            />
        </div>

        {/* Content card */}
        <div className="flex-1 bg-neutral-900/50 rounded-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="w-full h-32 md:w-24 md:h-24 rounded-lg flex-shrink-0" />
                <div className="flex flex-col gap-2 flex-grow">
                    <div className="flex items-start justify-between">
                        <Skeleton className="h-7 w-1/3" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-6 w-16" />
                </div>
            </div>
        </div>
    </div>
);

const formatDateHeader = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

const groupPostsByDay = (posts: PostData[]): Map<string, PostData[]> => {
    const grouped = new Map<string, PostData[]>();
    
    posts.forEach(post => {
        const date = new Date(post.postDate);
        const dateKey = date.toDateString();
        
        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
        }
        grouped.get(dateKey)?.push(post);
    });
    
    // Convert to array, sort, and convert back to Map
    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => 
        new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
    
    return new Map(sortedEntries);
};

export interface PostTimelineProps {
    posts: PostData[];
    loading: boolean;
    error?: string;
}

export const PostTimeline: React.FC<PostTimelineProps> = ({ posts, loading }) => {
    const handleDelete = async (postId: string) => {
        try {
            await FirebaseDatabaseService.deleteDocument(
                'tiktok-posts',
                postId,
                () => {
                    // No need to manually update posts state as the listener will handle it
                    toast({
                        title: 'Post deleted successfully',
                        variant: 'default',
                    });
                },
                (error: Error) => {
                    toast({
                        title: 'Failed to delete post: ' + error.message,
                        variant: 'destructive',
                    });
                }
            );
        } catch (error) {
            console.error('Error deleting post:', error);
            toast({
                title: 'Something went wrong while deleting the post',
                variant: 'destructive',
            });
        }
    };
    
    // Convert the grouped posts to an array before mapping
    const groupedPostsArray = Array.from(groupPostsByDay(posts));

    return (
        <div className="relative">
            {loading ? (
                <>
                    <PostTimelineSkeleton />
                    <PostTimelineSkeleton />
                    <PostTimelineSkeleton />
                </>
            ) : (
                <motion.div
                    className="space-y-8"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    {groupedPostsArray.map(([dateKey, dayPosts]) => (
                        <div key={dateKey} className="space-y-4">
                            {/* Date Header */}
                            <h3 className="text-lg font-semibold text-neutral-400 px-4 md:px-8">
                                {formatDateHeader(new Date(dateKey))}
                            </h3>
                            
                            {/* Posts for this day */}
                            {dayPosts.map((post) => (
                                <PostTimelineItem 
                                    key={post.id} 
                                    post={post} 
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};