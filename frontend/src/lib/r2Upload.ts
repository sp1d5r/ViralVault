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
  private fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response>;

  constructor(fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response>) {
    this.fetchWithAuth = fetchWithAuth;
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
    const response = await this.fetchWithAuth('api/r2/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        contentType,
      }),
    });

    return response.json();
  }

  /**
   * Get a pre-signed URL for downloading/viewing a file
   */
  async getDownloadUrl(key: string): Promise<string> {
    const response = await this.fetchWithAuth(`api/r2/download-url/${encodeURIComponent(key)}`, {
      method: 'GET',
    });

    const result: DownloadUrlResponse = await response.json();
    return result.data.url;
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    await this.fetchWithAuth(`api/r2/files/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  }

  /**
   * List user's files
   */
  async listFiles(prefix?: string): Promise<string[]> {
    const url = new URL('api/r2/files', 'http://dummy.com'); // Dummy base for URL construction
    if (prefix) {
      url.searchParams.set('prefix', prefix);
    }

    const response = await this.fetchWithAuth(url.pathname + url.search, {
      method: 'GET',
    });

    const result = await response.json();
    return result.data;
  }
}

// Example usage with useApi hook:
// import { useApi } from '../contexts/ApiContext';
//
// function MyComponent() {
//   const { fetchWithAuth } = useApi();
//   const r2Service = new R2UploadService(fetchWithAuth);
//
//   const handleUpload = async (file: File) => {
//     const { key, url } = await r2Service.uploadFile(file);
//     console.log('File uploaded:', key);
//   };
// } 