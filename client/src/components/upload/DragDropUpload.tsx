import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Image, X, Check, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFileToGoogleDrive, uploadFile, uploadFileWithChunks, ChunkUploadProgress } from '@/lib/upload-service';

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
  acceptedTypes = ['image/*', 'application/pdf'],
  currentCartSize = 0,
  maxCartSize = 50 * 1024 * 1024 // 50MB
}: DragDropUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; url: string; provider?: string }[]>([]);
  
  // ⏱️ TIMER: Upload time tracking
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [uploadProvider, setUploadProvider] = useState<string>('');

  // 📊 IDM STATS: Advanced upload statistics
  const [sessionStats, setSessionStats] = useState({
    filesTotal: 0,
    filesCompleted: 0,
    bytesTotal: 0,
    bytesUploaded: 0,
  });
  const [currentSpeed, setCurrentSpeed] = useState(0); // bytes per second
  const [speedSamples, setSpeedSamples] = useState<{ time: number; bytes: number }[]>([]);
  const [eta, setEta] = useState(0); // seconds remaining
  const [lastProgressUpdate, setLastProgressUpdate] = useState<{ time: number; bytes: number } | null>(null);

  // 🎯 SECRET ICONS: Map providers to secret icons
  const getProviderIcon = (provider: string | undefined): string => {
    if (!provider) return '🔄';
    if (provider === 'google_drive' || provider.includes('Google Drive')) return '🔵';
    if (provider === 'cloudinary' || provider.includes('Cloudinary')) return '🔶';
    return '🔄';
  };

  const getProviderName = (provider: string): string => {
    if (provider === 'google_drive') return '🔵 مزود أول';
    if (provider === 'cloudinary') return '🔶 مزود ثاني';
    return '🔄 جاري التحديد...';
  };

  // 📊 IDM STATS: Helper functions for speed and ETA calculation
  const updateSpeed = useCallback((totalBytesUploaded: number, sessionStartTime: number) => {
    const now = Date.now();
    const elapsedTimeSeconds = (now - sessionStartTime) / 1000;
    
    if (elapsedTimeSeconds > 0 && totalBytesUploaded > 0) {
      const instantSpeed = totalBytesUploaded / elapsedTimeSeconds; // bytes per second
      setCurrentSpeed(instantSpeed);
    }
  }, []);

  const calculateETA = useCallback((totalBytes: number, uploadedBytes: number, speed: number): number => {
    if (speed <= 0 || uploadedBytes >= totalBytes) return 0;
    const remainingBytes = totalBytes - uploadedBytes;
    return Math.round(remainingBytes / speed); // seconds
  }, []);

  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 KB/s';
    if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`;
  }, []);

  const formatETA = useCallback((seconds: number): string => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // 🚀 CHUNKED UPLOAD: Enhanced progress tracking with recovery info
  const [chunkProgress, setChunkProgress] = useState<{
    currentFile: string;
    totalFiles: number;
    currentFileIndex: number;
    chunks?: {
      current: number;
      total: number;
      percentage: number;
    };
    isChunked: boolean;
    speed?: string;
    retryAttempt?: number; // 🔧 FIX: Add retry tracking
    failedChunks?: number[]; // 🔧 FIX: Add failed chunks tracking
  } | null>(null);
  
  const { toast } = useToast();

  // ⏱️ TIMER: Update elapsed time every second during upload
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (uploading && uploadStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - uploadStartTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploading, uploadStartTime]);

  // ⏱️ TIMER: Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 🚀 ENHANCED: Smart upload with chunked support for large files
  const smartUpload = async (file: File, fileIndex: number, totalFiles: number): Promise<{ file: File; url: string; provider: string }> => {
    console.log(`📤 Smart upload ${fileIndex + 1}/${totalFiles}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // ⏱️ TIMER: Start timer for first file
    if (fileIndex === 0) {
      setUploadStartTime(Date.now());
      setElapsedTime(0);
    }
    
    // Update progress state
    setChunkProgress({
      currentFile: file.name,
      totalFiles,
      currentFileIndex: fileIndex + 1,
      isChunked: file.size > 10 * 1024 * 1024, // Files > 10MB use chunked upload
    });
    
    let result;
    setUploadProvider('🔄 جاري التحديد...'); // Initial state
    
    // 📊 IDM STATS: Start tracking upload progress for this file
    const fileStartTime = Date.now();
    let progressInterval: NodeJS.Timeout | null = null;
    
    // 🚀 CHUNKED UPLOAD: Use chunked upload for large files (>10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log(`🚀 Using chunked upload for large file: ${file.name}`);
      setUploadProvider('🔵 رفع متقدم');
      
      result = await uploadFileWithChunks(
        file,
        undefined, // printSettings
        (chunkProgressData: ChunkUploadProgress) => {
          // 🔧 FIX: Update chunk-specific progress with recovery info
          setChunkProgress(prev => prev ? {
            ...prev,
            chunks: {
              current: chunkProgressData.chunkIndex + 1,
              total: chunkProgressData.totalChunks,
              percentage: chunkProgressData.percentage
            },
            retryAttempt: chunkProgressData.retryAttempt, // 🔧 FIX: Wire retry info
            failedChunks: chunkProgressData.failedChunks // 🔧 FIX: Wire failed chunks
          } : null);
          
          // Update overall progress
          const overallProgress = ((fileIndex + (chunkProgressData.percentage / 100)) / totalFiles) * 100;
          setProgress(overallProgress);
        }
      );
      
      if (!result.success) {
        console.log('🔄 Chunked upload failed, trying standard Google Drive...');
        setUploadProvider('🔵 رفع عادي');
        result = await uploadFileToGoogleDrive(file);
      }
    } else {
      // Standard upload for smaller files with progress simulation
      console.log(`📁 Using standard upload for file: ${file.name}`);
      setUploadProvider('🔵 رفع سريع');
      
      // 📊 IDM STATS: Simulate progress for standard uploads
      const simulateProgress = () => {
        let simulatedProgress = 0;
        let currentFileBytes = 0;
        
        progressInterval = setInterval(() => {
          simulatedProgress += Math.random() * 10 + 5; // 5-15% increments
          if (simulatedProgress > 95) simulatedProgress = 95; // Stop at 95%
          
          currentFileBytes = Math.floor((simulatedProgress / 100) * file.size);
          
          // Update session progress correctly
          setSessionStats(prev => {
            const previousFilesBytes = prev.bytesTotal - file.size; // bytes from completed files
            const newTotalUploaded = previousFilesBytes + currentFileBytes;
            
            // Update speed calculation
            updateSpeed(newTotalUploaded, fileStartTime);
            
            // Calculate ETA
            const remaining = prev.bytesTotal - newTotalUploaded;
            const newEta = currentSpeed > 0 ? Math.round(remaining / currentSpeed) : 0;
            setEta(newEta);
            
            return {
              ...prev,
              bytesUploaded: newTotalUploaded
            };
          });
          
          if (simulatedProgress >= 95 && progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
        }, 300); // Update every 300ms for smoother animation
      };
      
      simulateProgress();
      result = await uploadFileToGoogleDrive(file);
      
      // Clear progress interval when upload completes
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }
    
    // Fallback to Cloudinary if Google Drive fails
    if (!result.success) {
      console.log('🔄 Cloud Storage failed, trying Cloudinary fallback...');
      setUploadProvider('🔶 النسخ الاحتياطي');
      result = await uploadFile(file);
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed on all services');
    }
    
    // Display upload performance info
    if ('chunks' in result && result.chunks) {
      console.log(`✅ Chunked upload completed: ${result.chunks} chunks, ${result.averageSpeed || 'N/A'}`);
      
      setChunkProgress(prev => prev ? {
        ...prev,
        speed: result.averageSpeed || undefined
      } : null);
    }
    
    // ⏱️ TIMER: Set final provider used for this file
    setUploadProvider(result.provider === 'google_drive' ? '🔵 مكتمل' : '🔶 مكتمل');
    
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
    
    // 📊 IDM STATS: Initialize session statistics
    const totalBytes = acceptedFiles.reduce((sum, file) => sum + file.size, 0);
    setSessionStats({
      filesTotal: acceptedFiles.length,
      filesCompleted: 0,
      bytesTotal: totalBytes,
      bytesUploaded: 0,
    });
    setCurrentSpeed(0);
    setSpeedSamples([]);
    setEta(0);
    setLastProgressUpdate(null);
    
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
        
        // 📊 IDM STATS: Update session statistics for completed file
        setSessionStats(prev => {
          const newFilesCompleted = prev.filesCompleted + 1;
          const newBytesUploaded = prev.bytesTotal * (newFilesCompleted / prev.filesTotal); // Proportional completion
          
          return {
            ...prev,
            filesCompleted: newFilesCompleted,
            bytesUploaded: newBytesUploaded,
          };
        });
        
        // Reset ETA to 0 when file is complete
        setEta(0);
        setCurrentSpeed(0);
        
        console.log(`✅ File ${i + 1} uploaded via ${uploadResult.provider}`);
      }
      
      // Final progress
      setProgress(100);
      
      setUploadedFiles(prev => [...prev, ...uploads]);
      onUpload(uploads.map(u => u.file), uploads.map(u => u.url));
      
      // Count providers
      const googleDriveCount = uploads.filter(u => u.provider === 'google_drive').length;
      const cloudinaryCount = uploads.filter(u => u.provider === 'cloudinary').length;
      
      let description = `تم رفع ${uploads.length} ملف بنجاح`;
      if (googleDriveCount > 0 && cloudinaryCount > 0) {
        description += ` (${googleDriveCount} عبر 🔵، ${cloudinaryCount} عبر 🔶)`;
      } else if (googleDriveCount > 0) {
        description += ` عبر 🔵`;
      } else {
        description += ` عبر 🔶`;
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
      setChunkProgress(null); // 🚀 CHUNKED UPLOAD: Reset chunk progress
      
      // ⏱️ TIMER: Reset timer state
      setUploadStartTime(null);
      setElapsedTime(0);
      setUploadProvider('');
      
      // 📊 IDM STATS: Reset statistics
      setSessionStats({ filesTotal: 0, filesCompleted: 0, bytesTotal: 0, bytesUploaded: 0 });
      setCurrentSpeed(0);
      setSpeedSamples([]);
      setEta(0);
      setLastProgressUpdate(null);
      
      // Clear any remaining progress intervals
      if (typeof progressInterval === 'number') {
        clearInterval(progressInterval);
      }
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
                  يدعم: PDF, JPG, JPEG, PNG, GIF
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
            <div className="mt-4 space-y-3">
              {/* 📊 IDM STATS: Advanced upload statistics display */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                {/* Header Row: Provider and Speed */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-purple-700" data-testid="text-provider-status">
                    {uploadProvider || '🔄 جاري التحديد...'}
                  </div>
                  <div className="text-sm font-bold text-green-700" data-testid="text-speed-current">
                    {formatSpeed(currentSpeed)}
                  </div>
                </div>

                {/* Session Progress Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-blue-600" data-testid="text-session-files">
                    📁 {sessionStats.filesCompleted}/{sessionStats.filesTotal} ملف
                  </div>
                  <div className="text-xs text-purple-600" data-testid="text-session-size">
                    📦 {formatFileSize(Math.min(sessionStats.bytesUploaded, sessionStats.bytesTotal))} / {formatFileSize(sessionStats.bytesTotal)}
                  </div>
                  <div className="text-xs text-green-600" data-testid="text-eta">
                    ⏱️ {eta > 0 ? `باقي ${formatETA(eta)}` : 'اكتمل'}
                  </div>
                </div>

                {/* Progress Percentage */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700" data-testid="text-overall-progress">
                    التقدم الإجمالي
                  </span>
                  <span className="text-sm font-bold text-blue-700" data-testid="text-progress-percentage">
                    {Math.min(100, Math.round((sessionStats.bytesUploaded / sessionStats.bytesTotal) * 100) || 0)}%
                  </span>
                </div>
              </div>
              
              {/* Overall Progress Bar */}
              <div className="mt-2">
                <Progress 
                  value={Math.min(100, Math.round((sessionStats.bytesUploaded / sessionStats.bytesTotal) * 100) || 0)} 
                  className="w-full h-3" 
                  data-testid="progress-overall"
                />
              </div>
              
              {/* Current File Info */}
              {chunkProgress && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      📄 {chunkProgress.currentFile}
                    </span>
                    {chunkProgress.speed && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        ⚡ {chunkProgress.speed}
                      </span>
                    )}
                  </div>
                  
                  {/* Chunked Upload Details */}
                  {chunkProgress.isChunked && chunkProgress.chunks && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-blue-700">
                        <span>
                          {chunkProgress.retryAttempt ? '🔄 إعادة محاولة الرفع' : '🚀 رفع متقطع عالي السرعة'}
                        </span>
                        <span>
                          جزء {chunkProgress.chunks.current}/{chunkProgress.chunks.total}
                        </span>
                      </div>
                      <Progress 
                        value={chunkProgress.chunks.percentage} 
                        className="h-2 bg-blue-100"
                      />
                      <div className="text-xs text-blue-600 text-center">
                        {Math.round(chunkProgress.chunks.percentage)}% من الجزء الحالي
                      </div>
                      
                      {/* 🔄 RECOVERY: Show retry information */}
                      {chunkProgress.retryAttempt && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                          <div className="flex items-center justify-between text-xs text-yellow-800">
                            <span>🔄 محاولة رقم {chunkProgress.retryAttempt}</span>
                            {chunkProgress.failedChunks && chunkProgress.failedChunks.length > 0 && (
                              <span>{chunkProgress.failedChunks.length} أجزاء فاشلة</span>
                            )}
                          </div>
                          <div className="text-xs text-yellow-700 mt-1">
                            يتم إعادة رفع الأجزاء المتعثرة تلقائياً
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Standard Upload */}
                  {!chunkProgress.isChunked && (
                    <div className="text-xs text-blue-700">
                      📁 رفع عادي للملفات الصغيرة
                    </div>
                  )}
                </div>
              )}
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