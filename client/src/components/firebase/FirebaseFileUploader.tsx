import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Image, Video, Music, Archive,
  CheckCircle, AlertCircle, X, Download, Trash2
} from 'lucide-react';

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface FirebaseFileUploaderProps {
  onUploadComplete?: (url: string, fileName: string) => void;
  maxFiles?: number;
  allowedTypes?: string[];
  maxSize?: number; // in MB
  storagePath?: string;
}

export function FirebaseFileUploader({
  onUploadComplete,
  maxFiles = 5,
  allowedTypes = ['image/*', 'application/pdf', 'text/*'],
  maxSize = 10,
  storagePath = 'uploads'
}: FirebaseFileUploaderProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `حجم الملف يجب أن يكون أقل من ${maxSize} ميجابايت`;
    }

    // Check file type
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

  const uploadFile = async (file: File) => {
    const uploadId = Math.random().toString(36).substr(2, 9);
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${storagePath}/${fileName}`);

    // Add to uploads list
    const newUpload: FileUpload = {
      id: uploadId,
      file,
      progress: 0,
      status: 'uploading'
    };

    setUploads(prev => [...prev, newUpload]);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress }
            : upload
        ));
      },
      (error) => {
        console.error('Upload error:', error);
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'error', error: error.message }
            : upload
        ));
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'completed', url: downloadURL }
            : upload
        ));
        
        onUploadComplete?.(downloadURL, file.name);
      }
    );
  };

  const handleFileSelect = (files: FileList) => {
    if (uploads.length + files.length > maxFiles) {
      alert(`يمكنك رفع ${maxFiles} ملفات كحد أقصى`);
      return;
    }

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }
      uploadFile(file);
    });
  };

  const removeUpload = async (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (upload?.url) {
      try {
        const fileRef = ref(storage, upload.url);
        await deleteObject(fileRef);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Upload Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          رفع الملفات باستخدام Firebase
        </h3>
        <p className="text-gray-600 mb-4">
          اسحب الملفات هنا أو انقر للاختيار
        </p>
        <p className="text-sm text-gray-500 mb-4">
          الحد الأقصى: {maxSize}MB لكل ملف، {maxFiles} ملفات كحد أقصى
        </p>
        
        <label htmlFor="file-upload">
          <Button className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            اختر الملفات
          </Button>
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          accept={allowedTypes.join(',')}
        />
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h4 className="font-semibold text-gray-900">الملفات المرفوعة</h4>
            
            {uploads.map((upload) => {
              const IconComponent = getFileIcon(upload.file.type);
              
              return (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <IconComponent className="w-6 h-6 text-gray-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate">
                            {upload.file.name}
                          </h5>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(upload.file.size)}
                          </p>
                          
                          {upload.status === 'uploading' && (
                            <div className="mt-2">
                              <Progress value={upload.progress} className="h-2" />
                              <p className="text-xs text-gray-500 mt-1">
                                {Math.round(upload.progress)}% مكتمل
                              </p>
                            </div>
                          )}
                          
                          {upload.status === 'error' && (
                            <p className="text-sm text-red-600 mt-1">
                              خطأ: {upload.error}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {upload.status === 'uploading' && (
                            <Badge variant="secondary">جاري الرفع...</Badge>
                          )}
                          
                          {upload.status === 'completed' && (
                            <>
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                مكتمل
                              </Badge>
                              {upload.url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(upload.url, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                          
                          {upload.status === 'error' && (
                            <Badge variant="destructive">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              خطأ
                            </Badge>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeUpload(upload.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Firebase Benefits Info */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-orange-900 mb-2">
            🔥 مزايا Firebase للرفع
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-orange-800">
            <div>✓ رفع سريع ومستقر</div>
            <div>✓ تحسين تلقائي للصور</div>
            <div>✓ شبكة توزيع عالمية</div>
            <div>✓ أمان متقدم</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FirebaseFileUploader;