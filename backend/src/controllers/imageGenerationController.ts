import { Request, Response } from 'express';
import { imageGenerationService } from '../services/imageGenerationService';

export const generateImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, size, quality, style, model, n } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
      return;
    }

    const result = await imageGenerationService.generateImages({
      prompt,
      size,
      quality,
      style,
      model,
      n,
    });

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error generating images:', error);
    res.status(500).json({ 
      error: 'Failed to generate images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const generateVariations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageUrl, size, n } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!imageUrl) {
      res.status(400).json({ error: 'Image URL is required' });
      return;
    }

    const result = await imageGenerationService.generateVariations({
      imageUrl,
      size,
      n,
    });

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error generating variations:', error);
    res.status(500).json({ 
      error: 'Failed to generate variations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const editImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, imageUrl, maskUrl, size, n } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!prompt || !imageUrl) {
      res.status(400).json({ error: 'Prompt and image URL are required' });
      return;
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
      return;
    }

    const result = await imageGenerationService.editImage({
      prompt,
      imageUrl,
      maskUrl,
      size,
      n,
    });

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error editing image:', error);
    res.status(500).json({ 
      error: 'Failed to edit image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const generateEnhancedImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, style, ...options } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
      return;
    }

    const result = await imageGenerationService.generateEnhancedImages(
      prompt,
      style,
      options
    );

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error generating enhanced images:', error);
    res.status(500).json({ 
      error: 'Failed to generate enhanced images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const generateSocialMediaImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, platform } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (!platform || !['instagram', 'twitter', 'linkedin', 'facebook'].includes(platform)) {
      res.status(400).json({ 
        error: 'Platform must be one of: instagram, twitter, linkedin, facebook' 
      });
      return;
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
      return;
    }

    const result = await imageGenerationService.generateSocialMediaImages(
      prompt,
      platform as 'instagram' | 'twitter' | 'linkedin' | 'facebook'
    );

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error generating social media images:', error);
    res.status(500).json({ 
      error: 'Failed to generate social media images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

export const generateBlogImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return 
    }

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const result = await imageGenerationService.generateBlogImages(title, category);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating blog images:', error);
    res.status(500).json({ 
      error: 'Failed to generate blog images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const validatePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const result = await imageGenerationService.validatePrompt(prompt);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error validating prompt:', error);
    res.status(500).json({ 
      error: 'Failed to validate prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAvailableModels = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const models = imageGenerationService.getAvailableModels();

    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error('Error getting available models:', error);
    res.status(500).json({ 
      error: 'Failed to get available models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 