// Upload Status Component - Shows detailed upload progress with MB tracking
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Upload, AlertCircle, FileText, HardDrive } from 'lucide-react';

interface UploadProgress {
  fileName: string;
  fileSize: number; // in bytes
  uploadedSize: number; // in bytes
  progress: number; // 0-100
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

interface UploadStatusProps {
  isUploading: boolean;
  uploadProgress?: UploadProgress[];
  uploadResults?: Array<{
    name: string;
    url: string;
    provider?: 'cloudinary' | 'firebase' | 'google_drive';
    previewUrl?: string;
    success?: boolean;
    error?: string;
    fileSize?: number;
  }>;
  uploadErrors?: Array<{
    name: string;
    error: string;
    fileSize?: number;
  }>;
}

// Helper functions for file size formatting
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/ثانية`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} ثانية`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} دقيقة ${Math.round(remainingSeconds)} ثانية`;
}

export function UploadStatus({ isUploading, uploadProgress = [], uploadResults = [], uploadErrors = [] }: UploadStatusProps) {
  if (!isUploading && uploadResults.length === 0 && uploadErrors.length === 0 && uploadProgress.length === 0) {
    return null;
  }

  // Calculate total progress
  const totalSize = uploadProgress.reduce((sum, file) => sum + file.fileSize, 0);
  const totalUploaded = uploadProgress.reduce((sum, file) => sum + file.uploadedSize, 0);
  const overallProgress = totalSize > 0 ? (totalUploaded / totalSize) * 100 : 0;

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        {/* Overall Upload Progress */}
        {isUploading && uploadProgress.length > 0 && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <HardDrive className="w-4 h-4 text-blue-500" />
                <span>رفع الملفات ({uploadProgress.length} ملف)</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(totalUploaded)} / {formatFileSize(totalSize)}
              </div>
            </div>
            
            <div className="space-y-1">
              <Progress value={overallProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(overallProgress)}% مكتمل</span>
                <span>المجموع: {formatFileSize(totalSize)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Individual File Progress */}
        {isUploading && uploadProgress.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              تفاصيل الملفات
            </h4>
            
            {uploadProgress.map((file, index) => (
              <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span className="text-sm font-medium truncate max-w-[200px]">{file.fileName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(file.fileSize)}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <Progress value={file.progress} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{Math.round(file.progress)}%</span>
                      <span>•</span>
                      <span>{formatFileSize(file.uploadedSize)} / {formatFileSize(file.fileSize)}</span>
                    </div>
                    
                    {file.speed && file.timeRemaining && (
                      <div className="flex items-center gap-2">
                        <span>{formatSpeed(file.speed)}</span>
                        <span>•</span>
                        <span>باقي {formatTime(file.timeRemaining)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simple Upload Loading (when no detailed progress) */}
        {isUploading && uploadProgress.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            جاري رفع الملفات...
          </div>
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              تم رفع الملفات بنجاح
            </h4>
            
            {uploadResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-sm">{result.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {result.fileSize && (
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(result.fileSize)}
                    </Badge>
                  )}
                  
                  {result.provider && (
                    <Badge variant={
                      result.provider === 'cloudinary' ? 'default' : 
                      result.provider === 'google_drive' ? 'destructive' : 
                      'secondary'
                    } className="text-xs">
                      {result.provider === 'cloudinary' ? '☁️ Cloudinary' : 
                       result.provider === 'google_drive' ? '☁️ التخزين السحابي' :
                       '🔥 Firebase'}
                    </Badge>
                  )}
                  
                  {result.previewUrl && (
                    <a 
                      href={result.previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      معاينة
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="space-y-2 mt-3">
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              فشل في رفع بعض الملفات
            </h4>
            
            {uploadErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-sm">{error.name}</span>
                  {error.fileSize && (
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(error.fileSize)}
                    </Badge>
                  )}
                </div>
                
                <span className="text-xs text-red-600">{error.error}</span>
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}