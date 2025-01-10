import { Request, Response } from 'express';
import { analyzePostsData } from '../services/analyzeService';
import { ContextSettings, PostContext , FirebaseDatabaseService } from 'shared';

interface AnalysisDocument {
    question: string;
    response: string;
    postIds: string[];
    timestamp: number;
    contextSettings: ContextSettings;
}

type AnalyzeRequest = Request<
    Record<string, never>,
    { response: string } | { error: string },
    {
        question: string;
        context: PostContext[];
        contextSettings: ContextSettings;
    }
>;

export const analyzePerformance = async (
    req: AnalyzeRequest,
    res: Response<{ response: string } | { error: string }>
): Promise<void> => {
    try {
        const { question, context, contextSettings } = req.body;
        
        if (!question || !context) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        const analysis = await analyzePostsData(question, context, contextSettings);

        // Store the analysis in Firebase
        const analysisDoc: AnalysisDocument = {
            question,
            response: analysis,
            postIds: context.map(post => post.id), // Assuming each post has an id
            timestamp: Date.now(),
            contextSettings
        };

         await FirebaseDatabaseService.addDocument(
            'viral-vault-chats',
            analysisDoc,
            (docId) => {
                res.json({ response: docId });
            },
            (error) => console.error('Failed to store analysis:', error)
        );
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze data' });
    }
}; 