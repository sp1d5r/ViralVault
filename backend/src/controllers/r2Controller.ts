import { Request, Response } from 'express';
import { r2Service } from '../services/r2Service';

export const generateUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!fileName || !contentType) {
      return res.status(400).json({ 
        error: 'fileName and contentType are required' 
      });
    }

    const result = await r2Service.generateUploadUrl(
      fileName,
      contentType,
      userId,
      3600 // 1 hour expiry
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate upload URL' 
    });
  }
};

export const generateDownloadUrl = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    // Verify user owns the file
    if (!key.startsWith(`users/${userId}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await r2Service.generateDownloadUrl(key, 3600);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate download URL' 
    });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    // Verify user owns the file
    if (!key.startsWith(`users/${userId}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await r2Service.deleteFile(key);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file' 
    });
  }
};

export const listUserFiles = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { prefix } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const files = await r2Service.listUserFiles(
      userId, 
      prefix as string | undefined
    );

    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      error: 'Failed to list files' 
    });
  }
};

export const getFileMetadata = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    // Verify user owns the file
    if (!key.startsWith(`users/${userId}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const metadata = await r2Service.getFileMetadata(key);

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({ 
      error: 'Failed to get file metadata' 
    });
  }
};

export const checkFileExists = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    // Verify user owns the file
    if (!key.startsWith(`users/${userId}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const exists = await r2Service.fileExists(key);

    res.json({
      success: true,
      data: { exists },
    });
  } catch (error) {
    console.error('Error checking file existence:', error);
    res.status(500).json({ 
      error: 'Failed to check file existence' 
    });
  }
}; 