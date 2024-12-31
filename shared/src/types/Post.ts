export interface PostData {
    title: string;
    postDate: string;
    status: 'draft' | 'posted';
    hook: string;
    script?: string;
    song?: string;
    notes?: string;
    tags: string[];
    createdAt: number;
    userId: string;
}