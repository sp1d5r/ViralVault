import { Request, Response } from 'express';
import { analyzePostsData } from '../services/analyzeService';
import { ContextSettings, PostContext , FirebaseDatabaseService , ClaudeService } from 'shared';
import { z } from 'zod';

interface AnalysisDocument {
    question: string;
    response: string;
    postIds: string[];
    timestamp: number;
    contextSettings: ContextSettings;
    userId: string;
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
        const userId = req.user?.uid;
        
        if (!question || !context || !userId) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        const analysis = await analyzePostsData(question, context, contextSettings);

        // Store the analysis in Firebase
        const analysisDoc: AnalysisDocument = {
            question,
            response: analysis,
            postIds: context.map(post => post.id),
            timestamp: Date.now(),
            contextSettings,
            userId
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

// --- Claude Image Analysis (Mock Endpoint) ---
export const analyzeImageWithClaude = async (req: Request, res: Response): Promise<void> => {
  // Accepts { imageBase64: string, prompt: string }
  const schema = z.object({
    imageBase64: z.string(),
    prompt: z.string()
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  const { imageBase64, prompt } = parse.data;

  try {
    const claude = new ClaudeService({
      apiKey: process.env.CLAUDE_API_KEY as string,
    });
    const response = await claude.query(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png', // Assume PNG for now
                data: imageBase64,
              },
            },
          ],
        },
      ],
      z.string(),
      'You are an expert at extracting analytics from screenshots.'
    );
    res.json({ response });
    return;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Claude image analysis failed';
    res.status(500).json({ error: errMsg });
    return;
  }
}; 