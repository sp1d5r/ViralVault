import { Identifiable } from "../services/database/DatabaseInterface";

export interface PostData extends Identifiable{
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
}