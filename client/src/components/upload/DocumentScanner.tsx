import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Scan, 
  Download, 
  Eye, 
  Trash2, 
  RotateCw,
  Crop,
  Contrast,
  FileType
} from 'lucide-react';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { uploadToFirebase } from '@/lib/firebase-storage';

interface ScannedDocument {
  id: string;
  fileName: string;
  downloadUrl: string;
  thumbnailUrl: string;
  fileType: string;
  size: number;
  pages: number;
  scannedAt: Date;
  processed: boolean;
}

export function DocumentScanner() {
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();

  const handleDocumentCapture = async (file: File, downloadUrl: string) => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate document processing with progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create document entry
      const newDocument: ScannedDocument = {
        id: `doc_${Date.now()}`,
        fileName: file.name,
        downloadUrl,
        thumbnailUrl: downloadUrl, // In production, generate thumbnail
        fileType: file.type || 'application/octet-stream',
        size: file.size,
        pages: 1, // Would be detected from actual document
        scannedAt: new Date(),
        processed: false
      };

      // Simulate OCR and document enhancement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingProgress(100);
      
      // Mark as processed
      newDocument.processed = true;
      
      setDocuments(prev => [newDocument, ...prev]);
      
      toast({
        title: 'تم المسح بنجاح',
        description: 'تم مسح المستند ومعالجته بنجاح'
      });

    } catch (error) {
      console.error('Document processing error:', error);
      toast({
        title: 'خطأ في المعالجة',
        description: 'فشل في معالجة المستند',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    toast({
      title: 'تم الحذف',
      description: 'تم حذف المستند بنجاح'
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileType className="w-4 h-4 text-blue-500" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Scan className="w-5 h-5" />
            <span>ماسح المستندات الذكي</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            امسح المستندات باستخدام الكاميرا أو ارفع ملفات من جهازك
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <CameraCapture
              onCapture={handleDocumentCapture}
              allowedTypes={['document', 'image']}
              maxFileSize={20 * 1024 * 1024} // 20MB for documents
            />
          </div>
        </CardContent>
      </Card>

      {/* Processing indicator */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <h3 className="font-semibold">جاري معالجة المستند...</h3>
              <Progress value={processingProgress} className="w-full" />
              <p className="text-sm text-gray-600">
                {processingProgress < 30 && 'جاري تحليل المستند...'}
                {processingProgress >= 30 && processingProgress < 60 && 'جاري تحسين جودة الصورة...'}
                {processingProgress >= 60 && processingProgress < 90 && 'جاري استخراج النص (OCR)...'}
                {processingProgress >= 90 && 'جاري الانتهاء...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents list */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>المستندات الممسوحة ({documents.length})</span>
              <Badge variant="outline">{formatFileSize(documents.reduce((sum, doc) => sum + doc.size, 0))}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc, index) => (
                <div key={doc.id}>
                  <div className="flex items-center space-x-4 space-x-reverse p-4 border rounded-lg">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {doc.fileType.startsWith('image/') ? (
                        <img 
                          src={doc.thumbnailUrl} 
                          alt={doc.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getFileTypeIcon(doc.fileType)
                      )}
                    </div>

                    {/* Document info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{doc.fileName}</h4>
                      <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600 mt-1">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>{doc.pages} صفحة</span>
                        <span>{doc.scannedAt.toLocaleTimeString('ar-EG')}</span>
                      </div>
                      <div className="mt-2">
                        {doc.processed ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            تم المعالجة
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            جاري المعالجة...
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 space-x-reverse">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(doc.downloadUrl, '_blank')}
                        data-testid={`button-view-${doc.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.downloadUrl;
                          link.download = doc.fileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${doc.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {index < documents.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 && !isProcessing && (
        <Card>
          <CardContent className="p-8 text-center">
            <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد مستندات</h3>
            <p className="text-gray-500">ابدأ بمسح مستند جديد باستخدام الكاميرا</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}