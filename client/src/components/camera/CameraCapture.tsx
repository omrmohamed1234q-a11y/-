import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, RotateCcw, Check, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToFirebaseStorage } from '@/lib/firebase-storage';

interface CameraCaptureProps {
  onCapture: (file: File, downloadUrl: string) => void;
  allowedTypes?: ('document' | 'image')[];
  maxFileSize?: number;
  quality?: number;
}

export function CameraCapture({ 
  onCapture, 
  allowedTypes = ['document', 'image'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  quality = 0.8 
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: 'خطأ في الكاميرا',
        description: 'لا يمكن الوصول للكاميرا. تأكد من الصلاحيات.',
        variant: 'destructive'
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }, 'image/jpeg', quality);
  }, [quality, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) return;

    setIsUploading(true);
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Upload to Firebase Storage
        const downloadUrl = await uploadToFirebaseStorage(file, 'camera-captures');
        
        onCapture(file, downloadUrl);
        
        toast({
          title: 'تم الحفظ بنجاح',
          description: 'تم رفع الصورة وحفظها بنجاح'
        });
        
        setIsOpen(false);
        setCapturedImage(null);
      }, 'image/jpeg', quality);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'خطأ في الرفع',
        description: 'فشل في رفع الملف. حاول مرة أخرى.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  }, [capturedImage, onCapture, quality, toast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    if (file.size > maxFileSize) {
      toast({
        title: 'حجم الملف كبير',
        description: `حجم الملف يجب أن يكون أقل من ${Math.round(maxFileSize / (1024 * 1024))} ميجابايت`,
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting Firebase upload...');
      const downloadUrl = await uploadToFirebaseStorage(file, 'uploads');
      console.log('Upload successful, URL:', downloadUrl);
      
      onCapture(file, downloadUrl);
      
      toast({
        title: 'تم الرفع بنجاح',
        description: 'تم رفع الملف بنجاح'
      });
      
      setIsOpen(false);
      
      // Clear the input value to allow selecting the same file again
      if (event.target) {
        event.target.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'خطأ في الرفع',
        description: error instanceof Error ? error.message : 'فشل في رفع الملف. حاول مرة أخرى.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  }, [maxFileSize, onCapture, toast]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (stream) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          data-testid="button-camera-capture"
        >
          <Camera className="w-4 h-4 ml-2" />
          التقط صورة أو ارفع ملف
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">
            التقاط الصور ورفع الملفات
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Type badges */}
          <div className="flex justify-center space-x-2 space-x-reverse">
            {allowedTypes.includes('document') && (
              <Badge variant="outline" className="flex items-center space-x-1 space-x-reverse">
                <FileText className="w-3 h-3" />
                <span>مستندات</span>
              </Badge>
            )}
            {allowedTypes.includes('image') && (
              <Badge variant="outline" className="flex items-center space-x-1 space-x-reverse">
                <ImageIcon className="w-3 h-3" />
                <span>صور</span>
              </Badge>
            )}
          </div>

          {/* Camera view */}
          {!capturedImage ? (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 bg-gray-100 rounded-lg object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <Button onClick={startCamera} data-testid="button-start-camera">
                        <Camera className="w-4 h-4 ml-2" />
                        تشغيل الكاميرا
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="space-y-3">
            {stream && !capturedImage && (
              <div className="flex space-x-2 space-x-reverse">
                <Button 
                  onClick={capturePhoto} 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  data-testid="button-capture-photo"
                >
                  <Camera className="w-4 h-4 ml-2" />
                  التقط صورة
                </Button>
                <Button 
                  onClick={toggleCamera} 
                  variant="outline"
                  data-testid="button-toggle-camera"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}

            {capturedImage && (
              <div className="flex space-x-2 space-x-reverse">
                <Button 
                  onClick={confirmCapture} 
                  disabled={isUploading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-confirm-capture"
                >
                  {isUploading ? (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>جاري الرفع...</span>
                    </div>
                  ) : (
                    <>
                      <Check className="w-4 h-4 ml-2" />
                      تأكيد
                    </>
                  )}
                </Button>
                <Button 
                  onClick={retakePhoto} 
                  variant="outline"
                  disabled={isUploading}
                  data-testid="button-retake-photo"
                >
                  <X className="w-4 h-4 ml-2" />
                  إعادة التقاط
                </Button>
              </div>
            )}

            {/* File upload option */}
            <div className="border-t pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline" 
                className="w-full"
                disabled={isUploading}
                data-testid="button-file-upload"
              >
                <Upload className="w-4 h-4 ml-2" />
                أو اختر ملف من الجهاز
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>يدعم: JPG, PNG, PDF, DOC, DOCX</p>
            <p>الحد الأقصى: {Math.round(maxFileSize / (1024 * 1024))} ميجابايت</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}