import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Image, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFileToGoogleDrive, uploadFile } from '@/lib/upload-service';

interface DragDropUploadProps {
  onUpload: (files: File[], urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  currentCartSize?: number; // Current total cart size in bytes
  maxCartSize?: number; // Maximum cart size in bytes (50MB)
}

export function DragDropUpload({
  onUpload,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  currentCartSize = 0,
  maxCartSize = 50 * 1024 * 1024 // 50MB
}: DragDropUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; url: string; provider?: string }[]>([]);
  const { toast } = useToast();

  // Smart upload function with Cloud Storage primary and Cloudinary fallback
  const smartUpload = async (file: File, fileIndex: number, totalFiles: number): Promise<{ file: File; url: string; provider: string }> => {
    console.log(`📤 Smart upload ${fileIndex + 1}/${totalFiles}: ${file.name}`);
    
    // Try Cloud Storage first
    let result = await uploadFileToGoogleDrive(file);
    
    if (!result.success) {
      console.log('🔄 Cloud Storage failed, trying Cloudinary fallback...');
      result = await uploadFile(file);
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed on both services');
    }
    
    return {
      file,
      url: result.downloadUrl || result.url!,
      provider: result.provider!
    };
  };

  // Calculate total size of files being uploaded
  const calculateTotalSize = (files: File[]) => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Check cart size limit
    const newFilesSize = calculateTotalSize(acceptedFiles);
    const totalSizeAfterUpload = currentCartSize + newFilesSize;
    
    if (totalSizeAfterUpload > maxCartSize) {
      const remaining = maxCartSize - currentCartSize;
      toast({
        title: '🚫 تجاوز الحد الأقصى للسلة',
        description: `حجم الملفات ${formatFileSize(newFilesSize)} يتجاوز الحد المتاح ${formatFileSize(remaining)}. الحد الأقصى 50 ميجابايت.`,
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    
    try {
      console.log('🚀 Starting smart upload system...');
      const uploads: { file: File; url: string; provider?: string }[] = [];
      
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        
        // Update progress for this file
        const fileProgress = (i / acceptedFiles.length) * 100;
        setProgress(fileProgress);
        
        // Smart upload with fallback
        const uploadResult = await smartUpload(file, i, acceptedFiles.length);
        uploads.push(uploadResult);
        
        console.log(`✅ File ${i + 1} uploaded via ${uploadResult.provider}`);
      }
      
      // Final progress
      setProgress(100);
      
      setUploadedFiles(uploads);
      onUpload(uploads.map(u => u.file), uploads.map(u => u.url));
      
      // Count providers
      const googleDriveCount = uploads.filter(u => u.provider === 'google_drive').length;
      const cloudinaryCount = uploads.filter(u => u.provider === 'cloudinary').length;
      
      let description = `تم رفع ${uploads.length} ملف بنجاح`;
      if (googleDriveCount > 0 && cloudinaryCount > 0) {
        description += ` (${googleDriveCount} عبر Google Drive، ${cloudinaryCount} عبر Cloudinary)`;
      } else if (googleDriveCount > 0) {
        description += ` عبر Google Drive`;
      } else {
        description += ` عبر Cloudinary`;
      }
      
      toast({
        title: 'تم الرفع بنجاح',
        description,
      });
      
    } catch (error) {
      console.error('Smart upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في رفع الملفات';
      
      toast({
        title: 'خطأ في الرفع',
        description: errorMessage,
        variant: 'destructive'
      });
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

      {/* Cart Size Progress Bar */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>حجم السلة المستخدم</span>
          <span>{formatFileSize(currentCartSize)} / {formatFileSize(maxCartSize)}</span>
        </div>
        <Progress 
          value={(currentCartSize / maxCartSize) * 100} 
          className="h-2"
        />
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>متبقي: {formatFileSize(maxCartSize - currentCartSize)}</span>
          <span className={`font-medium ${
            currentCartSize / maxCartSize > 0.8 ? 'text-orange-600' : 
            currentCartSize / maxCartSize > 0.9 ? 'text-red-600' : 'text-green-600'
          }`}>
            {((currentCartSize / maxCartSize) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}