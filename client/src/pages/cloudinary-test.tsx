import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Check, X, Image as ImageIcon, File, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UploadResult {
  url: string;
  public_id: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  created_at: string;
}

export default function CloudinaryTestPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Test Cloudinary connection
  const testCloudinaryConnection = async () => {
    setTestStatus('testing');
    try {
      const response = await fetch('/api/test-cloudinary');
      const data = await response.json();
      
      if (data.success) {
        setTestStatus('success');
        toast({
          title: 'اختبار Cloudinary ناجح',
          description: 'تم الاتصال بـ Cloudinary بنجاح',
        });
      } else {
        setTestStatus('error');
        toast({
          title: 'فشل اختبار Cloudinary',
          description: data.message || 'حدث خطأ في الاتصال',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setTestStatus('error');
      toast({
        title: 'خطأ في الاختبار',
        description: 'حدث خطأ أثناء اختبار الاتصال',
        variant: 'destructive',
      });
    }
  };

  // Upload to Cloudinary
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadToCloudinary(file);
        results.push(result);
        
        toast({
          title: 'تم رفع الملف بنجاح',
          description: `تم رفع ${file.name} إلى Cloudinary`,
        });
      } catch (error) {
        toast({
          title: 'فشل رفع الملف',
          description: `فشل في رفع ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    setUploadResults(prev => [...prev, ...results]);
    setUploading(false);
    event.target.value = '';
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (format: string) => {
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (imageFormats.includes(format.toLowerCase())) {
      return <ImageIcon className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">اختبار Cloudinary</h1>
          <p className="text-gray-600">اختبر رفع الملفات وإدارة الوسائط باستخدام Cloudinary</p>
        </div>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <span>اختبار الاتصال</span>
              {testStatus === 'success' && <Check className="w-5 h-5 text-green-500" />}
              {testStatus === 'error' && <X className="w-5 h-5 text-red-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">اختبر الاتصال مع Cloudinary للتأكد من صحة الإعدادات</p>
              
              <div className="flex items-center space-x-4 space-x-reverse">
                <Button
                  onClick={testCloudinaryConnection}
                  disabled={testStatus === 'testing'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {testStatus === 'testing' ? 'جاري الاختبار...' : 'اختبار الاتصال'}
                </Button>
                
                <Badge
                  variant={
                    testStatus === 'success' ? 'default' :
                    testStatus === 'error' ? 'destructive' : 'secondary'
                  }
                >
                  {testStatus === 'idle' && 'غير مختبر'}
                  {testStatus === 'testing' && 'جاري الاختبار...'}
                  {testStatus === 'success' && 'متصل بنجاح'}
                  {testStatus === 'error' && 'فشل الاتصال'}
                </Badge>
              </div>

              {/* Configuration Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Cloud Name:</p>
                  <p className="text-sm text-gray-600">{import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Upload Preset:</p>
                  <p className="text-sm text-gray-600">{import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'غير محدد'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Upload className="w-5 h-5" />
              <span>رفع الملفات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      اضغط لرفع الملفات أو اسحب الملفات هنا
                    </p>
                    <p className="text-sm text-gray-500">
                      يدعم الصور، الفيديوهات، المستندات والملفات الأخرى
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      الحد الأقصى: 100MB لكل ملف
                    </p>
                  </div>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>

              {uploading && (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">جاري رفع الملفات...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-5 h-5 text-green-500" />
                <span>الملفات المرفوعة ({uploadResults.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 space-x-reverse flex-1">
                        {/* File Preview */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {result.format && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(result.format) ? (
                            <img
                              src={result.url}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getFileIcon(result.format)
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Badge variant="outline" className="text-xs">
                              {result.format.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatFileSize(result.bytes)}
                            </span>
                            {result.width && result.height && (
                              <span className="text-sm text-gray-500">
                                {result.width} × {result.height}
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">Public ID:</p>
                            <p className="text-sm text-gray-600 font-mono break-all">
                              {result.public_id}
                            </p>
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">URL:</p>
                            <p className="text-sm text-blue-600 font-mono break-all">
                              {result.url}
                            </p>
                          </div>

                          <div className="text-xs text-gray-500">
                            تم الرفع: {new Date(result.created_at).toLocaleString('ar-EG')}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(result.url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(result.url)}
                        >
                          نسخ الرابط
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Tests */}
        <Card>
          <CardHeader>
            <CardTitle>اختبارات متقدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  const testImageUrl = uploadResults[0]?.url;
                  if (testImageUrl) {
                    const transformedUrl = testImageUrl.replace('/upload/', '/upload/c_fill,w_300,h_200/');
                    window.open(transformedUrl, '_blank');
                  } else {
                    toast({
                      title: 'لا توجد صور مرفوعة',
                      description: 'ارفع صورة أولاً لاختبار التحويلات',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                اختبار تحويل الصور
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  console.log('Cloudinary Configuration:');
                  console.log('Cloud Name:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
                  console.log('Upload Preset:', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                  console.log('Upload Results:', uploadResults);
                  toast({
                    title: 'تم طباعة التفاصيل',
                    description: 'تحقق من وحدة التحكم للمطورين',
                  });
                }}
              >
                طباعة تفاصيل الإعداد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}