interface UploadUrlResponse {
  success: boolean;
  data: {
    url: string;
    expiresIn: number;
    key: string;
  };
}

interface DownloadUrlResponse {
  success: boolean;
  data: {
    url: string;
    expiresIn: number;
    key: string;
  };
}

export class R2UploadService {
  private baseUrl: string;
  private getAuthToken: () => string | null;

  constructor(baseUrl: string, getAuthToken: () => string | null) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
  }

  /**
   * Upload a file directly to R2 using pre-signed URL
   */
  async uploadFile(file: File): Promise<{ key: string; url: string }> {
    // Step 1: Get pre-signed upload URL from backend
    const uploadUrlResponse = await this.getUploadUrl(file.name, file.type);
    
    if (!uploadUrlResponse.success) {
      throw new Error('Failed to get upload URL');
    }

    const { url: uploadUrl, key } = uploadUrlResponse.data;

    // Step 2: Upload directly to R2 using the pre-signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    return { key, url: uploadUrl };
  }

  /**
   * Get a pre-signed URL for uploading
   */
  private async getUploadUrl(fileName: string, contentType: string): Promise<UploadUrlResponse> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}/api/r2/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName,
        contentType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a pre-signed URL for downloading/viewing a file
   */
  async getDownloadUrl(key: string): Promise<string> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}/api/r2/download-url/${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }

    const result: DownloadUrlResponse = await response.json();
    return result.data.url;
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}/api/r2/files/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  /**
   * List user's files
   */
  async listFiles(prefix?: string): Promise<string[]> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const url = new URL(`${this.baseUrl}/api/r2/files`);
    if (prefix) {
      url.searchParams.set('prefix', prefix);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }
}

// Example usage:
// const r2Service = new R2UploadService(
//   'http://localhost:3001',
//   () => localStorage.getItem('authToken')
// );
//
// // Upload a file
// const fileInput = document.getElementById('fileInput') as HTMLInputElement;
// const file = fileInput.files?.[0];
// if (file) {
//   const { key, url } = await r2Service.uploadFile(file);
//   console.log('File uploaded:', key);
// } 