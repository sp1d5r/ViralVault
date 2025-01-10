import { RequestHandler } from 'express';
import { analyzePostsData } from '../services/analyzeService';

export const analyzePerformance: RequestHandler = async (req, res): Promise<void> => {
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