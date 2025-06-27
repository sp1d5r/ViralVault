import { Request, Response } from 'express';
import { FirebaseDatabaseService } from 'shared';

interface SystemPromptDocument {
    id?: string;
    userId: string;
    name: string;
    description: string;
    category: 'app-context' | 'story-generation' | 'custom';
    content: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

interface UpdatePromptRequest {
    id: string;
    name: string;
    description: string;
    content: string;
}

interface TogglePromptRequest {
    promptId: string;
    isActive: boolean;
}

export const getSystemPrompts = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.uid;

        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        FirebaseDatabaseService.queryDocuments<SystemPromptDocument>(
            'system-prompts',
            'userId',
            'createdAt',
            userId,
            (prompts) => {
                if (prompts && prompts.length > 0) {
                    // Sort by category and then by creation date
                    const sortedPrompts = prompts.sort((a, b) => {
                        if (a.category !== b.category) {
                            return a.category.localeCompare(b.category);
                        }
                        return b.createdAt - a.createdAt;
                    });
                    res.json(sortedPrompts);
                } else {
                    res.json([]);
                }
            },
            (error) => {
                console.error('Error fetching system prompts:', error);
                res.status(500).json({ error: 'Failed to fetch system prompts' });
            }
        );

    } catch (error) {
        console.error('Get system prompts error:', error);
        res.status(500).json({ error: 'Failed to get system prompts' });
    }
};

export const updateSystemPrompt = async (
    req: Request<{}, {}, UpdatePromptRequest>,
    res: Response
): Promise<void> => {
    try {
        const { id, name, description, content } = req.body;
        const userId = req.user?.uid;

        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        if (!id || !name || !description || !content) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        // First, get the existing prompt to verify ownership
        FirebaseDatabaseService.getDocument<SystemPromptDocument>(
            'system-prompts',
            id,
            (existingPrompt) => {
                if (!existingPrompt) {
                    res.status(404).json({ error: 'System prompt not found' });
                    return;
                }

                if (existingPrompt.userId !== userId) {
                    res.status(403).json({ error: 'Not authorized to edit this prompt' });
                    return;
                }

                // Update the prompt
                const updatedPrompt: SystemPromptDocument = {
                    ...existingPrompt,
                    name,
                    description,
                    content,
                    updatedAt: Date.now()
                };

                FirebaseDatabaseService.updateDocument(
                    'system-prompts',
                    id,
                    updatedPrompt,
                    () => {
                        res.json(updatedPrompt);
                    },
                    (error) => {
                        console.error('Failed to update system prompt:', error);
                        res.status(500).json({ error: 'Failed to update system prompt' });
                    }
                );
            },
            (error) => {
                console.error('Error fetching system prompt:', error);
                res.status(500).json({ error: 'Failed to fetch system prompt' });
            }
        );

    } catch (error) {
        console.error('Update system prompt error:', error);
        res.status(500).json({ error: 'Failed to update system prompt' });
    }
};

export const toggleSystemPrompt = async (
    req: Request<{}, {}, TogglePromptRequest>,
    res: Response
): Promise<void> => {
    try {
        const { promptId, isActive } = req.body;
        const userId = req.user?.uid;

        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        if (!promptId) {
            res.status(400).json({ error: 'Missing prompt ID' });
            return;
        }

        // Get the existing prompt to verify ownership
        FirebaseDatabaseService.getDocument<SystemPromptDocument>(
            'system-prompts',
            promptId,
            (existingPrompt) => {
                if (!existingPrompt) {
                    res.status(404).json({ error: 'System prompt not found' });
                    return;
                }

                if (existingPrompt.userId !== userId) {
                    res.status(403).json({ error: 'Not authorized to modify this prompt' });
                    return;
                }

                // Update the active status
                const updatedPrompt: SystemPromptDocument = {
                    ...existingPrompt,
                    isActive,
                    updatedAt: Date.now()
                };

                FirebaseDatabaseService.updateDocument(
                    'system-prompts',
                    promptId,
                    updatedPrompt,
                    () => {
                        res.json(updatedPrompt);
                    },
                    (error) => {
                        console.error('Failed to toggle system prompt:', error);
                        res.status(500).json({ error: 'Failed to toggle system prompt' });
                    }
                );
            },
            (error) => {
                console.error('Error fetching system prompt:', error);
                res.status(500).json({ error: 'Failed to fetch system prompt' });
            }
        );

    } catch (error) {
        console.error('Toggle system prompt error:', error);
        res.status(500).json({ error: 'Failed to toggle system prompt' });
    }
};

export const createSystemPrompt = async (
    req: Request<{}, {}, Omit<SystemPromptDocument, 'id' | 'createdAt' | 'updatedAt'>>,
    res: Response
): Promise<void> => {
    try {
        const { name, description, category, content } = req.body;
        const userId = req.user?.uid;

        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        if (!name || !description || !category || !content) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        const newPrompt: Omit<SystemPromptDocument, 'id'> = {
            userId,
            name,
            description,
            category,
            content,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        FirebaseDatabaseService.addDocument(
            'system-prompts',
            newPrompt,
            (docId) => {
                res.json({ id: docId, ...newPrompt });
            },
            (error) => {
                console.error('Failed to create system prompt:', error);
                res.status(500).json({ error: 'Failed to create system prompt' });
            }
        );

    } catch (error) {
        console.error('Create system prompt error:', error);
        res.status(500).json({ error: 'Failed to create system prompt' });
    }
}; 