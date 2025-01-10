export interface AnalyticsTypes {
    retention: boolean;
    views: boolean;
    engagement: boolean;
    watchTime: boolean;
}

export interface ContextSettings {
    includeScripts: boolean;
    includeAnalytics: boolean;
    postHistory: number;
    analyticsTypes: AnalyticsTypes;
}

export interface PostContext {
    id: string;
    title: string;
    hook: string;
    postDate: string;
    script?: string;
    analytics?: {
        views?: number;
        viewDistribution?: number[];
        retention?: number[];
        fullVideoPercentage?: number;
        likes?: number;
        comments?: number;
        shares?: number;
        engagementOverTime?: number[];
        avgWatchTime?: number;
        totalPlayTime?: number;
    };
}