import { Request, Response } from 'express';
import { imageGenerationService } from '../services/imageGenerationService';

export const generateImages = async (req: Request, res: Response) => {
  try {
    const { prompt, size, quality, style, model, n } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
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
  } catch (error) {
    console.error('Error generating images:', error);
    res.status(500).json({ 
      error: 'Failed to generate images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const generateVariations = async (req: Request, res: Response) => {
  try {
    const { imageUrl, size, n } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
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
  } catch (error) {
    console.error('Error generating variations:', error);
    res.status(500).json({ 
      error: 'Failed to generate variations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const editImage = async (req: Request, res: Response) => {
  try {
    const { prompt, imageUrl, maskUrl, size, n } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!prompt || !imageUrl) {
      return res.status(400).json({ error: 'Prompt and image URL are required' });
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
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
  } catch (error) {
    console.error('Error editing image:', error);
    res.status(500).json({ 
      error: 'Failed to edit image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const generateEnhancedImages = async (req: Request, res: Response) => {
  try {
    const { prompt, style, ...options } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
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
  } catch (error) {
    console.error('Error generating enhanced images:', error);
    res.status(500).json({ 
      error: 'Failed to generate enhanced images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const generateSocialMediaImages = async (req: Request, res: Response) => {
  try {
    const { prompt, platform } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!platform || !['instagram', 'twitter', 'linkedin', 'facebook'].includes(platform)) {
      return res.status(400).json({ 
        error: 'Platform must be one of: instagram, twitter, linkedin, facebook' 
      });
    }

    // Validate prompt for content policy
    const validation = await imageGenerationService.validatePrompt(prompt);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Prompt violates content policy',
        reason: validation.reason 
      });
    }

    const result = await imageGenerationService.generateSocialMediaImages(
      prompt,
      platform as 'instagram' | 'twitter' | 'linkedin' | 'facebook'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating social media images:', error);
    res.status(500).json({ 
      error: 'Failed to generate social media images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const generateBlogImages = async (req: Request, res: Response) => {
  try {
    const { title, category } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
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

export const validatePrompt = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
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

export const getAvailableModels = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
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