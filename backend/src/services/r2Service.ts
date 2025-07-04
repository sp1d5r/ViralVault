import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, _Object } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region?: string;
}

export interface SignedUrlResult {
  url: string;
  expiresIn: number;
  key: string;
}

export interface FileMetadata {
  contentType?: string;
  size?: number;
  lastModified?: Date;
  metadata?: Record<string, string>;
}

export class R2Service {
  private client: S3Client;
  private bucketName: string;
  private accountId: string;

  constructor(config: R2Config) {
    this.accountId = config.accountId;
    this.bucketName = config.bucketName;

    console.log('R2Service constructor - Config:', {
      accountId: this.accountId,
      bucketName: this.bucketName,
      region: config.region || 'auto',
      hasAccessKey: !!config.accessKeyId,
      hasSecretKey: !!config.secretAccessKey,
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`
    });

    if (!this.bucketName) {
      throw new Error('R2_BUCKET_NAME environment variable is required');
    }
    
    if (!this.accountId) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable is required');
    }
    
    if (!config.accessKeyId || !config.secretAccessKey) {
      throw new Error('R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY environment variables are required');
    }

    this.client = new S3Client({
      region: config.region || 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload base64 image data to R2
   */
  async uploadBase64Image(
    base64Data: string,
    fileName: string,
    userId: string,
    contentType: string = 'image/png'
  ): Promise<string> {
    console.log('R2Service.uploadBase64Image called with:', {
      fileName,
      userId,
      contentType,
      base64DataLength: base64Data?.length || 0,
      bucketName: this.bucketName,
      accountId: this.accountId
    });

    if (!base64Data || !fileName || !userId) {
      throw new Error('base64Data, fileName, and userId are required');
    }

    // Remove data URL prefix if present
    const base64WithoutPrefix = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('Base64 without prefix length:', base64WithoutPrefix.length);
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64WithoutPrefix, 'base64');
    console.log('Buffer length:', buffer.length);
    
    const timestamp = Date.now();
    const userPrefix = `users/${userId}/images/`;
    const key = `${userPrefix}${timestamp}-${fileName}`;
    console.log('R2 key:', key);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        originalName: fileName,
        source: 'image-generation',
      },
    });

    try {
      console.log('Sending PutObjectCommand to R2...');
      await this.client.send(command);
      console.log('R2 upload successful');
      
      // Generate a signed URL for secure access instead of public URL
      const signedUrl = await this.generateDownloadUrl(key, 24 * 60 * 60); // 24 hours
      console.log('Signed URL:', signedUrl.url);
      return signedUrl.url;
    } catch (error) {
      console.error('Error uploading base64 image to R2:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a pre-signed URL for direct upload to R2
   */
  async generateUploadUrl(
    fileName: string,
    contentType: string,
    userId: string,
    expiresIn: number = 3600
  ): Promise<SignedUrlResult> {
    const timestamp = Date.now();
    const userPrefix = `users/${userId}/`;
    const key = `${userPrefix}${timestamp}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      Metadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        originalName: fileName,
      },
    });

    try {
      const signedUrl = await getSignedUrl(this.client, command, {
        expiresIn,
      });

      return {
        url: signedUrl,
        expiresIn,
        key,
      };
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw new Error(`Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a pre-signed URL for file download/viewing
   */
  async generateDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<SignedUrlResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const signedUrl = await getSignedUrl(this.client, command, {
        expiresIn,
      });

      return {
        url: signedUrl,
        expiresIn,
        key,
      };
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in a user's directory
   */
  async listUserFiles(userId: string, prefix?: string): Promise<string[]> {
    const userPrefix = `users/${userId}/`;
    const fullPrefix = prefix ? `${userPrefix}${prefix}` : userPrefix;

    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: fullPrefix,
    });

    try {
      const response = await this.client.send(command);
      return response.Contents?.map((obj: _Object) => obj.Key || '') || [];
    } catch (error) {
      console.error('Error listing user files:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      // If the error is 404 (Not Found), the file doesn't exist
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
        return false;
      }
      // For other errors, re-throw
      console.error('Error checking if file exists:', error);
      throw new Error(`Failed to check if file exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<FileMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.client.send(command);
      return {
        contentType: response.ContentType,
        size: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get public URL for a file (if bucket is public)
   */
  getPublicUrl(key: string): string {
    // For R2, we need to use the custom domain or the R2 public URL format
    // If you have a custom domain configured, use that instead
    const customDomain = process.env.R2_PUBLIC_DOMAIN;
    
    if (customDomain) {
      return `https://${customDomain}/${key}`;
    } else {
      // Fallback to R2 public URL format - remove duplicate https
      return `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;
    }
  }
}

// Create singleton instance
export const r2Service = new R2Service({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.R2_BUCKET_NAME || '',
  region: process.env.R2_REGION || 'auto',
}); 