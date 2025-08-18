import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Image, X, Check } from 'lucide-react';
import { uploadWithFallback } from '@/lib/firebase-simple-upload';
import { useToast } from '@/hooks/use-toast';
import { FirebaseRulesError } from '@/components/storage/FirebaseRulesError';
import { runFirebaseDiagnostics, generateFixInstructions } from '@/lib/firebase-diagnostics';
import { processFilesLocally, getFileUrls } from '@/lib/local-file-handler';

interface DragDropUploadProps {
  onUpload: (files: File[], urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
}

export function DragDropUpload({
  onUpload,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}: DragDropUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; url: string }[]>([]);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await runFirebaseDiagnostics();
      setDiagnostics(results);
      const instructions = generateFixInstructions(results);
      console.log('🔍 Firebase Diagnostics Results:', results);
      console.log('📋 Fix Instructions:', instructions);
      
      toast({
        title: 'تم فحص Firebase',
        description: 'انظر في وحدة التحكم للحصول على تفاصيل المشكلة',
      });
    } catch (error) {
      console.error('Diagnostics failed:', error);
      toast({
        title: 'فشل الفحص',
        description: 'لا يمكن فحص إعدادات Firebase',
        variant: 'destructive'
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const uploadWithLocalFallback = async (acceptedFiles: File[]) => {
    console.log('🚀 Trying local processing first while Firebase issues are resolved...');
    
    try {
      const processedFiles = await processFilesLocally(acceptedFiles, (progress) => {
        setProgress(progress);
      });
      
      const urls = getFileUrls(processedFiles);
      const uploads = acceptedFiles.map((file, index) => ({
        file,
        url: urls[index]
      }));
      
      setUploadedFiles(uploads);
      onUpload(uploads.map(u => u.file), uploads.map(u => u.url));
      
      toast({
        title: 'تم معالجة الملفات محلياً',
        description: `تم معالجة ${uploads.length} ملف بنجاح (مؤقتاً بدون Firebase)`,
      });
      
      return true;
    } catch (localError) {
      console.error('Local processing failed:', localError);
      return false;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);
    setFirebaseError(null);
    
    try {
      // First try Firebase upload
      console.log('Attempting Firebase upload...');
      const uploads: { file: File; url: string }[] = [];
      
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        console.log(`Uploading file ${i + 1}/${acceptedFiles.length}:`, file.name);
        
        // Upload to Firebase with fallback
        const downloadUrl = await uploadWithFallback(file, 'drag-drop-uploads', (fileProgress) => {
          const totalProgress = ((i / acceptedFiles.length) * 100) + ((fileProgress / acceptedFiles.length));
          setProgress(totalProgress);
        });
        
        uploads.push({ file, url: downloadUrl });
        console.log(`File ${i + 1} uploaded successfully:`, downloadUrl);
      }
      
      setUploadedFiles(uploads);
      onUpload(uploads.map(u => u.file), uploads.map(u => u.url));
      
      toast({
        title: 'تم الرفع بنجاح',
        description: `تم رفع ${uploads.length} ملف بنجاح`,
      });
      
    } catch (error) {
      console.error('Firebase upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في رفع الملفات';
      
      // Try local processing as immediate fallback
      console.log('Firebase failed, trying local processing...');
      const localSuccess = await uploadWithLocalFallback(acceptedFiles);
      
      if (!localSuccess) {
        // Check if it's a Firebase Storage Rules error
        if (errorMessage.includes('Firebase Storage Rules') || 
            errorMessage.includes('unauthorized') || 
            errorMessage.includes('غير مصرح') ||
            errorMessage.includes('Firebase') ||
            errorMessage.includes('وقتاً طويلاً') ||
            errorMessage.includes('انتهت مهلة') ||
            errorMessage.includes('بكلا الطريقتين')) {
          setFirebaseError(errorMessage);
        } else {
          toast({
            title: 'خطأ في الرفع',
            description: errorMessage,
            variant: 'destructive'
          });
        }
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload, toast]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    disabled: uploading
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    return <FileText className="w-8 h-8 text-red-500" />;
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Firebase Rules Error */}
      {firebaseError && (
        <div className="space-y-3">
          <FirebaseRulesError 
            error={firebaseError} 
            onRetry={() => setFirebaseError(null)} 
          />
          <div className="text-center">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunningDiagnostics}
              variant="outline"
              className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            >
              {isRunningDiagnostics ? 'جاري الفحص...' : '🔍 فحص مشكلة Firebase'}
            </Button>
          </div>
        </div>
      )}
      
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : isDragReject 
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CardContent className="p-8">
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive 
                    ? 'اسقط الملفات هنا...' 
                    : 'اسحب أو أفلت ملفك هنا أو انقر للاختيار'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  يدعم: PDF, DOC, DOCX, JPG, PNG
                </p>
                <p className="text-xs text-gray-400">
                  الحد الأقصى: {Math.round(maxSize / (1024 * 1024))} ميجابايت لكل ملف
                </p>
              </div>
              
              {!isDragActive && (
                <Button type="button" variant="outline" disabled={uploading}>
                  اختيار الملفات
                </Button>
              )}
            </div>
          </div>
          
          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">جاري الرفع...</span>
                <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">الملفات المرفوعة</h3>
            <div className="space-y-2">
              {uploadedFiles.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {getFileIcon(item.file)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(item.file.size / 1024 / 1024).toFixed(2)} ميجابايت
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Check className="w-5 h-5 text-green-500" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}