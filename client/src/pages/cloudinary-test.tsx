import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { testCloudinaryConnection } from '@/lib/cloudinary';
import { uploadFile } from '@/lib/upload-service';
import { CheckCircle, XCircle, Upload, TestTube } from 'lucide-react';

export default function CloudinaryTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runCloudinaryTest = async () => {
    setLoading(true);
    try {
      const result = await testCloudinaryConnection();
      setTestResults(result);
      console.log('🧪 Cloudinary test result:', result);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    setLoading(false);
  };

  const testFileUpload = async () => {
    setLoading(true);
    try {
      // Create a test file
      const testContent = `Test file created at ${new Date().toISOString()}\nCloudinary integration test for اطبعلي`;
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'cloudinary-test.txt', { type: 'text/plain' });
      
      const result = await uploadFile(testFile);
      setUploadResult(result);
      console.log('📤 Upload test result:', result);
    } catch (error) {
      setUploadResult({
        success: false,
        error: `Upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-800">Cloudinary Integration Test</h1>
          <p className="text-slate-600">Test your Cloudinary API credentials and upload functionality</p>
        </div>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Configuration Status
            </CardTitle>
            <CardDescription>
              Check if your Cloudinary credentials are properly configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span>Cloud Name:</span>
                <Badge variant={import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ? "default" : "destructive"}>
                  {import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Upload Preset:</span>
                <Badge variant={import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ? "default" : "destructive"}>
                  {import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ? '✅ Set' : '❌ Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>API Key:</span>
                <Badge variant={import.meta.env.VITE_CLOUDINARY_API_KEY ? "default" : "destructive"}>
                  {import.meta.env.VITE_CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>API Secret:</span>
                <Badge variant={import.meta.env.VITE_CLOUDINARY_API_SECRET ? "default" : "destructive"}>
                  {import.meta.env.VITE_CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'}
                </Badge>
              </div>
            </div>
            
            <Button 
              onClick={runCloudinaryTest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Cloudinary Connection'}
            </Button>
          </CardContent>
        </Card>

        {/* Connection Test Results */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResults.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                Connection Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={testResults.success ? 'text-green-800' : 'text-red-800'}>
                    {testResults.message}
                  </p>
                </div>
                
                {testResults.details && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <h4 className="font-medium mb-2">Configuration Details:</h4>
                    <pre className="text-sm text-slate-600 overflow-auto">
                      {JSON.stringify(testResults.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Upload Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Test
            </CardTitle>
            <CardDescription>
              Test actual file upload to your Cloudinary account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testFileUpload} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? 'Uploading Test File...' : 'Test File Upload'}
            </Button>
          </CardContent>
        </Card>

        {/* Upload Test Results */}
        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                Upload Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {uploadResult.success ? (
                    <div className="space-y-2">
                      <p className="text-green-800 font-medium">✅ Upload successful!</p>
                      <p className="text-sm text-green-700">
                        File uploaded to: <code>{uploadResult.provider}</code>
                      </p>
                      {uploadResult.url && (
                        <p className="text-sm">
                          <a 
                            href={uploadResult.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View uploaded file
                          </a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-800">❌ {uploadResult.error}</p>
                  )}
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Upload Details:</h4>
                  <pre className="text-sm text-slate-600 overflow-auto">
                    {JSON.stringify(uploadResult, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Console Commands */}
        <Card>
          <CardHeader>
            <CardTitle>Console Commands</CardTitle>
            <CardDescription>
              You can also test Cloudinary in the browser console using these commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm space-y-1">
              <div>testCloudinaryConnection()</div>
              <div>checkUploadServiceStatus()</div>
              <div>testUserConnection()</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}