import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FirebaseDatabaseService } from 'shared';
import { Skeleton } from '../../shadcn/skeleton';
import { Edit, ChartBar, FileText, ChevronDown, Share2, Heart, MessageCircle, Play, Star, Clock, Percent, Trash2 } from 'lucide-react';
import { Button } from '../../shadcn/button';
import { PostData } from 'shared';
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../shadcn/dialog";

interface Analytics {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    favorites?: number;
    totalPlayTime?: number;
    avgWatchTime?: number;
    fullVideoPercentage?: number;
}

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
    const gradientColor = stringToColor(post.title);
    
    const analytics: Analytics = {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        favorites: 0,
        totalPlayTime: 0,
        avgWatchTime: 0,
        fullVideoPercentage: 0
    };

    const handleDelete = () => {
        onDelete(post.id);
        setShowDeleteDialog(false);
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
                            <Button variant="ghost" size="sm">Add Analytics</Button>
                        </div>
                            <div className="flex justify-l">
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-400">Total Play Time</div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} />
                                        {analytics.totalPlayTime || '0'} mins
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-400">Avg Watch Time</div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} />
                                        {analytics.avgWatchTime || '0'} secs
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-400">Favorites</div>
                                    <div className="flex items-center gap-2">
                                        <Star size={14} />
                                        {analytics.favorites || '0'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm text-neutral-400">Watched Full</div>
                                    <div className="flex items-center gap-2">
                                        <Percent size={14} />
                                        {analytics.fullVideoPercentage || '0'}%
                                    </div>
                                </div>
                            </div>
                            {/* Placeholder for retention graph */}
                            <div className="h-24 bg-neutral-800/50 rounded-lg mt-4 flex items-center justify-center">
                                Retention Graph Coming Soon
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
                        <div className="flex justify-between items-center gap-2">
                            {/* Pre-release Notes */}
                            <div className="border border-indigo-900/70 rounded-lg p-4 flex-1">
                                <h4 className="font-semibold mb-2">Pre-release Notes</h4>
                                <p className="text-neutral-300">{post.notes || 'No pre-release notes'}</p>
                            </div>
                            {/* Post-release Notes */}
                            <div className="border border-indigo-800/70 rounded-lg p-4 flex-1">
                                <h4 className="font-semibold mb-2">Post-release Notes</h4>
                                <p className="text-neutral-300">No post-release notes yet</p>
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

    const handleDelete = async (postId: string) => {
        try {
            await FirebaseDatabaseService.deleteDocument(
                'posts/videos',
                postId,
                () => {
                    // Remove the post from local state
                    setPosts(prev => prev.filter(post => post.id !== postId));
                    toast.success('Post deleted successfully');
                },
                (error) => {
                    toast.error('Failed to delete post: ' + error.message);
                }
            );
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Something went wrong while deleting the post');
        }
    };

    useEffect(() => {
        const loadPosts = async () => {
            try {
                await FirebaseDatabaseService.complexQuery<PostData>(
                    'tiktok-posts',
                    [], // No filters
                    [{ field: 'createdAt', direction: 'desc' }],
                    (results) => {
                        setPosts(results);
                        setLoading(false);
                    },
                    (error) => {
                        setError(error.message);
                        setLoading(false);
                    }
                );
            } catch (err) {
                setError('Failed to load posts');
                setLoading(false);
            }
        };

        loadPosts();
    }, []);

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