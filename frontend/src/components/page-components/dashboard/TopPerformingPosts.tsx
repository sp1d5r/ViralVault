import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import { PostData } from "shared";
import { useNavigate } from 'react-router-dom';
import { Button } from "../../shadcn/button";

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 50%)`;
};

const TopPerformingPosts: React.FC<{ posts: PostData[] }> = ({ posts }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const getPostScore = (post: PostData) => {
        const analytics = post.analytics || {};
        return (
            (analytics.views || 0) + 
            (analytics.likes || 0) * 2 + 
            (analytics.comments || 0) * 3 + 
            (analytics.shares || 0) * 4
        );
    };

    // First get the 10 most recent posts
    const recentPosts = [...posts]
        .sort((a, b) => new Date(b.postDate).getTime() - new Date(a.postDate).getTime())
        .slice(0, 10);

    // Then sort those by performance and take top 5
    const topPosts = [...recentPosts]
        .sort((a, b) => getPostScore(b) - getPostScore(a))
        .slice(0, 5);

    return (
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 text-white">
            <div 
                className="flex items-center justify-between cursor-pointer lg:cursor-default mb-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-white">Ranked Posts</h2>
                    <p className="text-xs text-neutral-400">Using your last 10 posts</p>
                </div>
                <ChevronDown className={`lg:hidden transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            <div className={`${isExpanded ? 'block' : 'hidden'} lg:block space-y-3`}>
                {topPosts.map((post, index) => {
                    const isStoryGenerated = post.tags.includes('story-generated') && post.storyId;
                    
                    return (
                        <div key={post.id} className="flex items-center gap-3">
                            <div 
                                className="w-12 h-12 rounded overflow-hidden flex-shrink-0"
                                style={{
                                    background: `linear-gradient(135deg, ${stringToColor(post.title)}, ${stringToColor(post.title + 'alt')})`
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate text-white">{post.title}</p>
                                    {isStoryGenerated && (
                                        <span 
                                            className="px-1 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                            title="Generated from Story"
                                        >
                                            📖
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-400">
                                    {new Date(post.postDate).toLocaleDateString()} • {post.analytics?.views?.toLocaleString() || 0} views
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {isStoryGenerated && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => navigate(`/story/${post.storyId}`)}
                                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 p-1"
                                        title="View Original Story"
                                    >
                                        <BookOpen size={14} />
                                    </Button>
                                )}
                                <div className="text-xs font-medium text-indigo-400">
                                    #{index + 1}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TopPerformingPosts;