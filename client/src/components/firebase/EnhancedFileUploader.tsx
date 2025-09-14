import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { firebaseFileService, FileMetadata, UploadProgress } from '@/services/firebaseFileService';
import { 
  Upload, FileText, Image, Video, Music, Archive,
  CheckCircle, AlertCircle, X, Download, Trash2,
  Play, Pause, RotateCcw, Zap, Cloud, TrendingUp,
  HardDrive, Layers, Eye
} from 'lucide-react';

interface EnhancedFileUploaderProps {
  category?: string;
  maxFiles?: number;
  allowedTypes?: string[];
  maxSize?: number; // in MB
  onUploadComplete?: (files: FileMetadata[]) => void;
  showStats?: boolean;
}

export function EnhancedFileUploader({
  category = 'prints',
  maxFiles = 10,
  allowedTypes = ['image/*', 'application/pdf'],
  maxSize = 50,
  onUploadComplete,
  showStats = true
}: EnhancedFileUploaderProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [activeUploads, setActiveUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);

  // Subscribe to real-time file updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = firebaseFileService.subscribeToUploads(user.id, (updatedFiles) => {
      setFiles(updatedFiles);
      if (onUploadComplete) {
        const completedFiles = updatedFiles.filter(f => f.status === 'completed');
        onUploadComplete(completedFiles);
      }
    });

    return unsubscribe;
  }, [user?.id, onUploadComplete]);

  // Load storage statistics
  useEffect(() => {
    if (user?.id && showStats) {
      firebaseFileService.getStorageStats(user.id).then(setStorageStats);
    }
  }, [user?.id, showStats, files]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('zip') || type.includes('rar')) return Archive;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `حجم الملف يجب أن يكون أقل من ${maxSize} ميجابايت`;
    }

    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return 'نوع الملف غير مدعوم';
    }

    return null;
  };

  const handleFileUpload = async (selectedFiles: FileList) => {
    if (!user?.id) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    const currentFileCount = files.filter(f => f.status !== 'error').length;
    if (currentFileCount + selectedFiles.length > maxFiles) {
      alert(`يمكنك رفع ${maxFiles} ملفات كحد أقصى`);
      return;
    }

    Array.from(selectedFiles).forEach(async (file) => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }

      try {
        const uploadId = await firebaseFileService.uploadFile(
          file,
          category,
          user.id,
          (progress) => {
            setActiveUploads(prev => new Map(prev.set(uploadId, progress)));
          },
          (metadata) => {
            setActiveUploads(prev => {
              const newMap = new Map(prev);
              newMap.delete(uploadId);
              return newMap;
            });
          },
          (error) => {
            console.error('Upload failed:', error);
            setActiveUploads(prev => {
              const newMap = new Map(prev);
              newMap.delete(uploadId);
              return newMap;
            });
          }
        );
      } catch (error) {
        console.error('Upload initiation failed:', error);
        alert('فشل في بدء رفع الملف');
      }
    });
  };

  const handleUploadControl = (uploadId: string, action: 'pause' | 'resume' | 'cancel') => {
    switch (action) {
      case 'pause':
        firebaseFileService.pauseUpload(uploadId);
        break;
      case 'resume':
        firebaseFileService.resumeUpload(uploadId);
        break;
      case 'cancel':
        firebaseFileService.cancelUpload(uploadId);
        setActiveUploads(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
        break;
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      try {
        await firebaseFileService.deleteFile(fileId);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('فشل في حذف الملف');
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'uploading': return 'جاري الرفع';
      case 'processing': return 'جاري المعالجة';
      case 'completed': return 'مكتمل';
      case 'error': return 'خطأ';
      default: return status;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Statistics */}
      {showStats && storageStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <HardDrive className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي الملفات</p>
                  <p className="text-2xl font-bold text-blue-600">{storageStats.totalFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <Cloud className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">الحجم المستخدم</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatFileSize(storageStats.totalSize)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <Layers className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">الفئات</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Object.keys(storageStats.byCategory).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">متوسط الحجم</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {storageStats.totalFiles > 0 
                      ? formatFileSize(storageStats.totalSize / storageStats.totalFiles)
                      : '0 Bytes'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Zap className="w-5 h-5 text-orange-500" />
            <span>رفع ملفات Firebase المحسن</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${isDragging 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          >
            <motion.div
              animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
              className="space-y-4"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  رفع محسن مع Firebase
                </h3>
                <p className="text-gray-600 mb-4">
                  اسحب الملفات هنا أو انقر للاختيار
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 mb-4">
                  <Badge variant="outline">تحسين تلقائي</Badge>
                  <Badge variant="outline">استئناف الرفع</Badge>
                  <Badge variant="outline">توزيع عالمي</Badge>
                  <Badge variant="outline">معالجة أخطاء ذكية</Badge>
                </div>
              </div>
              
              <label htmlFor="file-upload">
                <Button className="cursor-pointer bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  <Upload className="w-4 h-4 mr-2" />
                  اختر الملفات
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                accept={allowedTypes.join(',')}
              />
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Active Uploads */}
      <AnimatePresence>
        {activeUploads.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>الرفع قيد التنفيذ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(activeUploads.entries()).map(([uploadId, progress]) => (
                    <motion.div
                      key={uploadId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">رفع الملف</span>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {progress.state === 'running' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUploadControl(uploadId, 'pause')}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          {progress.state === 'paused' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUploadControl(uploadId, 'resume')}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUploadControl(uploadId, 'cancel')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Progress value={progress.percentage} className="h-2 mb-2" />
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{Math.round(progress.percentage)}% مكتمل</span>
                        <span>
                          {formatFileSize(progress.bytesTransferred)} / {formatFileSize(progress.totalBytes)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FileText className="w-5 h-5 text-green-500" />
              <span>الملفات المرفوعة ({files.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => {
                const IconComponent = getFileIcon(file.mimeType);
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-4 space-x-reverse p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="p-2 bg-white rounded-lg">
                      <IconComponent className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {file.originalName}
                      </h4>
                      <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>{file.category}</span>
                        {file.optimized && (
                          <Badge variant="outline" className="text-xs">
                            محسن {Math.round((1 - file.compressionRatio) * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge className={getStatusColor(file.status)}>
                        {getStatusLabel(file.status)}
                      </Badge>
                      
                      {file.status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.downloadURL, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = file.downloadURL;
                              a.download = file.originalName;
                              a.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileDelete(file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Firebase Benefits */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-orange-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <Zap className="w-5 h-5" />
            <span>مزايا Firebase المفعلة</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>تحديثات مباشرة</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>تحسين تلقائي</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>استئناف الرفع</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>توزيع عالمي</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedFileUploader;