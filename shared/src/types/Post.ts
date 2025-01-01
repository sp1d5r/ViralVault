import { Identifiable } from "../services/database/DatabaseInterface";

export interface Analytics {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    favorites?: number;
    totalPlayTime?: number;
    avgWatchTime?: number;
    fullVideoPercentage?: number;
}

export interface PostData extends Identifiable {
    title: string;
    postDate: string;
    status: 'draft' | 'posted';
    hook: string;
    script?: string;
    song?: string;
    notes?: string;
    postReleaseNotes?: string;
    tags: string[];
    createdAt: number;
    userId: string;
    analytics?: Analytics;
}