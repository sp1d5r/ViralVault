import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
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

    this.client = new S3Client({
      region: config.region || 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
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

    const signedUrl = await getSignedUrl(this.client, command, {
      expiresIn,
    });

    return {
      url: signedUrl,
      expiresIn,
      key,
    };
  }

  /**
   * Generate a pre-signed URL for file download/viewing
   */
  async generateDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<SignedUrlResult> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    // Check if file exists
    try {
      await this.client.send(command);
    } catch (error) {
      throw new Error(`File not found: ${key}`);
    }

    const signedUrl = await getSignedUrl(this.client, command, {
      expiresIn,
    });

    return {
      url: signedUrl,
      expiresIn,
      key,
    };
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
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

    const response = await this.client.send(command);
    return response.Contents?.map((obj: any) => obj.Key || '') || [];
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
    } catch {
      return false;
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

    const response = await this.client.send(command);
    return {
      contentType: response.ContentType,
      size: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  }

  /**
   * Get public URL for a file (if bucket is public)
   */
  getPublicUrl(key: string): string {
    return `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;
  }
}

// Create singleton instance
export const r2Service = new R2Service({
  accountId: process.env.R2_ACCOUNT_ID || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.R2_BUCKET_NAME || '',
  region: process.env.R2_REGION || 'auto',
}); 