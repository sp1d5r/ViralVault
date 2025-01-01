import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FirebaseDatabaseService } from 'shared';
import { Skeleton } from '../../shadcn/skeleton';
import { Edit, ChartBar, FileText, ChevronDown, Share2, Heart, MessageCircle, Play, Star, Clock, Percent, Trash2, Save } from 'lucide-react';
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
import type { Unsubscribe } from 'firebase/firestore';
import { toast } from '../../../contexts/ToastProvider';
import { useAuth } from '../../../contexts/AuthenticationProvider';
import { Textarea } from "../../shadcn/textarea";

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
        fullVideoPercentage: 0
    });
    
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

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4 relative pl-8 pb-8 group"
        >
            {/* Timeline dot and line */}
            <div className="absolute left-0 top-0 h-full">
                <div className="w-4 h-4 rounded-full bg-neutral-700 border-4 border-neutral-900 relative z-10" />
                <div className="absolute left-1/2 top-4 bottom-0 w-0.5 bg-neutral-800 -translate-x-1/2" />
            </div>

            {/* Content card */}
            <div className="flex-1 space-y-4">
                <div className="bg-neutral-900/50 rounded-lg p-4 hover:bg-neutral-900/70 transition-all">
                    <div className="flex gap-4">
                        <div 
                            className="w-24 h-24 rounded-lg flex-shrink-0"
                            style={{
                                background: `linear-gradient(135deg, ${gradientColor}, ${stringToColor(post.title + 'alt')})`
                            }}
                        />
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="flex items-start justify-between">
                                <h3 className="text-xl font-bold">{post.title}</h3>
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
                                            color: stringToColor(tag)
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Song choice */}
                            {post.song && (
                                <div className="text-sm text-neutral-400">
                                    🎵 {post.song}
                                </div>
                            )}

                            {/* Analytics Preview */}
                            <div className="flex justify-start items-center gap-2">
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <Play size={14} /> {analytics.views || '0'}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <Heart size={14} /> {analytics.likes || '0'}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <MessageCircle size={14} /> {analytics.comments || '0'}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <Share2 size={14} /> {analytics.shares || '0'}
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-800/50 p-2">
                                    <Star size={14} /> {analytics.favorites || '0'}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-2">
                                <Button variant="ghost" size="sm">
                                    <Edit size={16} />
                                </Button>
                                <Button 
                                    variant={showAnalytics? "outline" :"ghost" }
                                    size="sm"
                                    onClick={() => setShowAnalytics(!showAnalytics)}
                                >
                                    <ChartBar size={16} />
                                </Button>
                                <Button 
                                    variant={showNotes? "outline" : "ghost" }
                                    size="sm"
                                    onClick={() => setShowNotes(!showNotes)}
                                >
                                    <FileText size={16} />
                                </Button>
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
                {showAnalytics&& (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                    >

                        {/* Detailed Analytics */}
                        <div className="border border-indigo-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-center pr-4">
                            <h4 className="font-semibold mb-4">Detailed Analytics</h4>
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
                            <div className="flex items-center justify-between px-8 gap-4">
                                {/* Views */}
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-400">Views</div>
                                    {isEditingAnalytics ? (
                                        <input
                                            type="number"
                                            value={analytics.views}
                                            onChange={(e) => setAnalytics(prev => ({
                                                ...prev,
                                                views: parseInt(e.target.value) || 0
                                            }))}
                                            className="w-full bg-neutral-800 rounded px-2 py-1"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Play size={14} />
                                            {analytics.views || '0'}
                                        </div>
                                    )}
                                </div>

                                {/* Likes */}
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-400">Likes</div>
                                    {isEditingAnalytics ? (
                                        <input
                                            type="number"
                                            value={analytics.likes}
                                            onChange={(e) => setAnalytics(prev => ({
                                                ...prev,
                                                likes: parseInt(e.target.value) || 0
                                            }))}
                                            className="w-full bg-neutral-800 rounded px-2 py-1"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Heart size={14} />
                                            {analytics.likes || '0'}
                                        </div>
                                    )}
                                </div>

                                {/* Comments */}
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-400">Comments</div>
                                    {isEditingAnalytics ? (
                                        <input
                                            type="number"
                                            value={analytics.comments}
                                            onChange={(e) => setAnalytics(prev => ({
                                                ...prev,
                                                comments: parseInt(e.target.value) || 0
                                            }))}
                                            className="w-full bg-neutral-800 rounded px-2 py-1"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <MessageCircle size={14} />
                                            {analytics.comments || '0'}
                                        </div>
                                    )}
                                </div>

                                {/* Shares */}
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-400">Shares</div>
                                    {isEditingAnalytics ? (
                                        <input
                                            type="number"
                                            value={analytics.shares}
                                            onChange={(e) => setAnalytics(prev => ({
                                                ...prev,
                                                shares: parseInt(e.target.value) || 0
                                            }))}
                                            className="w-full bg-neutral-800 rounded px-2 py-1"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Share2 size={14} />
                                            {analytics.shares || '0'}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-400">Favorites</div>
                                    {isEditingAnalytics ? (
                                        <input
                                            type="number"
                                            value={analytics.favorites}
                                            onChange={(e) => setAnalytics(prev => ({
                                                ...prev,
                                                favorites: parseInt(e.target.value) || 0
                                            }))}
                                            className="w-full bg-neutral-800 rounded px-2 py-1"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Star size={14} />
                                            {analytics.favorites || '0'}
                                        </div>
                                    )}
                                </div>

                                {/* Add similar blocks for other analytics fields */}
                            </div>
                        </div>
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
            </div>
        </motion.div>
    );
};

const PostTimelineSkeleton = () => (
    <div className="flex gap-4 relative pl-8 pb-8">
        {/* Timeline dot and line */}
        <div className="absolute left-0 top-0 h-full">
            <div className="w-4 h-4 rounded-full bg-neutral-800 relative z-10" />
            <div className="absolute left-1/2 top-4 bottom-0 w-0.5 bg-neutral-800 -translate-x-1/2" />
        </div>

        {/* Content card */}
        <div className="flex-1 bg-neutral-900/50 rounded-lg p-4">
            <div className="flex gap-4">
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
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

export const PostTimeline: React.FC = () => {
    const [posts, setPosts] = useState<PostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {authState} = useAuth();

    useEffect(() => {
        let unsubscribe: Unsubscribe;

        const setupListener = () => {
            if (!authState.user?.uid) {
                setLoading(false);
                setPosts([]);
                return;
            }

            try {
                unsubscribe = FirebaseDatabaseService.listenToQuery<PostData>(
                    'tiktok-posts',
                    'userId',
                    authState.user.uid,
                    'createdAt',
                    (updatedPosts) => {
                        console.log('updatedPosts', updatedPosts);
                        if (updatedPosts) {
                            setPosts(updatedPosts);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error('Query error:', error);
                        setError(error.message);
                        setLoading(false);
                    }
                );
            } catch (err) {
                console.error('Setup error:', err);
                setError('Failed to setup post listener');
                setLoading(false);
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [authState.user?.uid]);

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
                (error) => {
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

    if (error) {
        return (
            <div className="text-red-500 p-4 rounded-lg bg-red-500/10">
                Error loading posts: {error}
            </div>
        );
    }

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
                    className="space-y-4"
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
                    {posts.map((post) => (
                        <PostTimelineItem 
                            key={post.id} 
                            post={post} 
                            onDelete={handleDelete}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
};