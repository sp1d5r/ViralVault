import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  generateUploadUrl,
  generateDownloadUrl,
  deleteFile,
  listUserFiles,
  getFileMetadata,
  checkFileExists,
  testR2Upload,
  testR2Connection,
} from '../controllers/r2Controller';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Generate pre-signed URL for direct upload
router.post('/upload-url', generateUploadUrl);

// Generate pre-signed URL for download/viewing
router.get('/download-url/:key', generateDownloadUrl);

// Delete a file
router.delete('/files/:key', deleteFile);

// List user's files
router.get('/files', listUserFiles);

// Get file metadata
router.get('/files/:key/metadata', getFileMetadata);

// Check if file exists
router.get('/files/:key/exists', checkFileExists);

// Test endpoints (for debugging)
router.post('/test-upload', testR2Upload);
router.get('/test-connection', testR2Connection);

export default router; 