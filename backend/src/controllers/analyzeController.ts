import { Request, Response } from 'express';
import { analyzePostsData } from '../services/analyzeService';
import { ContextSettings, PostContext } from 'shared';

type AnalyzeRequest = Request<
    Record<string, never>,  // params
    { response: string } | { error: string },  // response
    {  // body
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
        res.json({ response: analysis });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze data' });
    }
}; 