// Upload Status Component - Shows upload progress and results
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Upload, AlertCircle } from 'lucide-react';

interface UploadStatusProps {
  isUploading: boolean;
  uploadResults?: Array<{
    name: string;
    url: string;
    provider?: 'cloudinary' | 'firebase';
    previewUrl?: string;
    success?: boolean;
    error?: string;
  }>;
  uploadErrors?: Array<{
    name: string;
    error: string;
  }>;
}

export function UploadStatus({ isUploading, uploadResults = [], uploadErrors = [] }: UploadStatusProps) {
  if (!isUploading && uploadResults.length === 0 && uploadErrors.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        {/* Upload Progress */}
        {isUploading && (
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
                  {result.provider && (
                    <Badge variant={result.provider === 'cloudinary' ? 'default' : 'secondary'} className="text-xs">
                      {result.provider === 'cloudinary' ? '🟡 Cloudinary' : '🔥 Firebase'}
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