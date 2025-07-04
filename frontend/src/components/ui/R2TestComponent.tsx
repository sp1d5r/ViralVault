import React, { useState } from 'react';
import { Button } from '../shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '../shadcn/card';
import { Textarea } from '../shadcn/textarea';
import { Input } from '../shadcn/input';
import { Label } from '../shadcn/label';
import { Badge } from '../shadcn/badge';
import { Upload, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

export const R2TestComponent: React.FC = () => {
  const [base64Data, setBase64Data] = useState('');
  const [fileName, setFileName] = useState('test-image.png');
  const [userId, setUserId] = useState('test-user-123');
  const [isTesting, setIsTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [uploadResult, setUploadResult] = useState<TestResult | null>(null);
  const { fetchWithAuth } = useApi();

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionResult(null);
    
    try {
      const response = await fetchWithAuth('api/r2/test-connection', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      setConnectionResult({
        success: response.ok,
        data: result.data,
        error: result.error,
        details: result.details
      });
    } catch (error) {
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        details: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testUpload = async () => {
    if (!base64Data.trim()) {
      alert('Please paste some base64 data first!');
      return;
    }

    setIsTesting(true);
    setUploadResult(null);
    
    try {
      const response = await fetchWithAuth('api/r2/test-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: base64Data.trim(),
          fileName,
          userId
        }),
      });

      const result = await response.json();
      
      setUploadResult({
        success: response.ok,
        data: result.data,
        error: result.error,
        details: result.details
      });
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        details: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsTesting(false);
    }
  };

  const clearResults = () => {
    setConnectionResult(null);
    setUploadResult(null);
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TestTube className="h-5 w-5" />
            R2 Storage Test Component
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Test */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">1. Test R2 Connection</h3>
              <Button
                onClick={testConnection}
                disabled={isTesting}
                className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            {connectionResult && (
              <div className={`p-4 rounded-lg border ${
                connectionResult.success 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(connectionResult.success)}
                  <span className="font-medium text-white">
                    {connectionResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </span>
                </div>
                {connectionResult.data && (
                  <pre className="text-sm text-neutral-300 bg-neutral-900/50 p-3 rounded overflow-auto">
                    {JSON.stringify(connectionResult.data, null, 2)}
                  </pre>
                )}
                {connectionResult.error && (
                  <div className="text-red-300 text-sm mt-2">
                    <strong>Error:</strong> {connectionResult.error}
                  </div>
                )}
                {connectionResult.details && (
                  <details className="mt-2">
                    <summary className="text-sm text-neutral-400 cursor-pointer">Show Details</summary>
                    <pre className="text-xs text-neutral-500 mt-2 bg-neutral-900/50 p-3 rounded overflow-auto">
                      {connectionResult.details}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Upload Test */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">2. Test R2 Upload</h3>
              <Button
                onClick={testUpload}
                disabled={isTesting || !base64Data.trim()}
                className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Test Upload
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fileName" className="text-white">File Name</Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="test-image.png"
                  className="bg-neutral-700 border-neutral-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-white">User ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="test-user-123"
                  className="bg-neutral-700 border-neutral-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base64Data" className="text-white">
                Base64 Image Data
                <Badge variant="outline" className="ml-2 text-xs">
                  {base64Data.length} chars
                </Badge>
              </Label>
              <Textarea
                id="base64Data"
                value={base64Data}
                onChange={(e) => setBase64Data(e.target.value)}
                placeholder="Paste your base64 image data here..."
                className="h-32 bg-neutral-700 border-neutral-600 text-white font-mono text-sm"
              />
            </div>

            {uploadResult && (
              <div className={`p-4 rounded-lg border ${
                uploadResult.success 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(uploadResult.success)}
                  <span className="font-medium text-white">
                    {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                  </span>
                </div>
                {uploadResult.data && (
                  <div className="space-y-2">
                    <div className="text-sm text-neutral-300">
                      <strong>Image URL:</strong> 
                      <a 
                        href={uploadResult.data.imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 ml-2 break-all"
                      >
                        {uploadResult.data.imageUrl}
                      </a>
                    </div>
                    <pre className="text-sm text-neutral-300 bg-neutral-900/50 p-3 rounded overflow-auto">
                      {JSON.stringify(uploadResult.data, null, 2)}
                    </pre>
                  </div>
                )}
                {uploadResult.error && (
                  <div className="text-red-300 text-sm mt-2">
                    <strong>Error:</strong> {uploadResult.error}
                  </div>
                )}
                {uploadResult.details && (
                  <details className="mt-2">
                    <summary className="text-sm text-neutral-400 cursor-pointer">Show Details</summary>
                    <pre className="text-xs text-neutral-500 mt-2 bg-neutral-900/50 p-3 rounded overflow-auto">
                      {uploadResult.details}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Clear Results */}
          {(connectionResult || uploadResult) && (
            <div className="flex justify-center">
              <Button
                onClick={clearResults}
                variant="outline"
                className="bg-neutral-700/50 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
              >
                Clear Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 