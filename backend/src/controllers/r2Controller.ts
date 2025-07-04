import { Request, Response } from 'express';
import { r2Service } from '../services/r2Service';

export const generateUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, contentType } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!fileName || !contentType) {
      res.status(400).json({ 
        error: 'fileName and contentType are required' 
      });
      return;
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
    return;
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate upload URL' 
    });
    return;
  }
};

export const generateDownloadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!key) {
      res.status(400).json({ error: 'File key is required' });
      return;
    }

    // Verify user owns the file
    if (!key.startsWith(`users/${userId}/`)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const result = await r2Service.generateDownloadUrl(key, 3600);

    res.json({
      success: true,
      data: result,
    });
    return;
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate download URL' 
    });
    return;
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!key) {
      res.status(400).json({ error: 'File key is required' });
      return;
    }

    // Verify user owns the file
    if (!key.startsWith(`users/${userId}/`)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await r2Service.deleteFile(key);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
    return;
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file' 
    });
    return;
  }
};

export const listUserFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    const { prefix } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const files = await r2Service.listUserFiles(
      userId, 
      prefix as string | undefined
    );

    res.json({
      success: true,
      data: files,
    });
    return;
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      error: 'Failed to list files' 
    });
    return;
  }
};

export const getFileMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!key) {
      res.status(400).json({ error: 'File key is required' });
      return;
    }

    // Verify user owns the file
    if (!key.startsWith(`users/${userId}/`)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const metadata = await r2Service.getFileMetadata(key);

    res.json({
      success: true,
      data: metadata,
    });
    return;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({ 
      error: 'Failed to get file metadata' 
    });
    return;
  }
};

export const checkFileExists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!key) {
      res.status(400).json({ error: 'File key is required' });
      return;
    }

    // Verify user owns the file
    if (!key.startsWith(`users/${userId}/`)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const exists = await r2Service.fileExists(key);

    res.json({
      success: true,
      data: { exists },
    });
    return;
  } catch (error) {
    console.error('Error checking file existence:', error);
    res.status(500).json({ 
      error: 'Failed to check file existence' 
    });
    return;
  }
};

export const testR2Upload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { base64Data, fileName, userId } = req.body;

    if (!base64Data) {
      res.status(400).json({ error: 'base64Data is required' });
      return;
    }

    if (!fileName) {
      res.status(400).json({ error: 'fileName is required' });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    console.log('Test R2 Upload - Input:', {
      fileName,
      userId,
      base64DataLength: base64Data.length,
      base64DataPreview: base64Data.substring(0, 100) + '...'
    });

    // Test the R2 upload
    const imageUrl = await r2Service.uploadBase64Image(
      base64Data,
      fileName,
      userId,
      'image/png'
    );

    console.log('Test R2 Upload - Success:', { imageUrl });

    res.json({
      success: true,
      data: {
        imageUrl,
        fileName,
        userId,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test R2 Upload - Error:', error);
    res.status(500).json({ 
      error: 'Failed to upload to R2',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};

export const testR2Connection = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Testing R2 connection...');
    
    // Test if we can list files (this will test the connection)
    const testUserId = 'test-user';
    const files = await r2Service.listUserFiles(testUserId);
    
    console.log('R2 connection test successful, found files:', files.length);

    res.json({
      success: true,
      data: {
        connection: 'successful',
        filesFound: files.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('R2 connection test failed:', error);
    res.status(500).json({ 
      error: 'R2 connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}; 