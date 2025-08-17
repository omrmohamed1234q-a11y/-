import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, FileText, Download, RotateCcw, FlashOff, FlashOn,
  Zap, CheckCircle, X, Maximize, Minimize, RefreshCw, Upload
} from 'lucide-react';

interface CameraCaptureProps {
  onCapture?: (imageDataUrl: string) => void;
  onFileSelect?: (files: FileList) => void;
  allowMultiple?: boolean;
  maxFiles?: number;
}

export function CameraCapture({
  onCapture,
  onFileSelect,
  allowMultiple = true,
  maxFiles = 5
}: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('فشل في الوصول للكاميرا. تأكد من إعطاء الإذن للموقع.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
    setIsFullscreen(false);
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Apply flash effect if enabled
    if (flashEnabled && videoRef.current.parentElement) {
      const flashOverlay = document.createElement('div');
      flashOverlay.style.position = 'absolute';
      flashOverlay.style.top = '0';
      flashOverlay.style.left = '0';
      flashOverlay.style.width = '100%';
      flashOverlay.style.height = '100%';
      flashOverlay.style.backgroundColor = 'white';
      flashOverlay.style.opacity = '0.8';
      flashOverlay.style.pointerEvents = 'none';
      flashOverlay.style.zIndex = '1000';
      
      videoRef.current.parentElement.appendChild(flashOverlay);
      
      setTimeout(() => {
        if (flashOverlay.parentElement) {
          flashOverlay.parentElement.removeChild(flashOverlay);
        }
      }, 100);
    }

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Add to captured images
    setCapturedImages(prev => {
      const newImages = [...prev, imageDataUrl];
      if (newImages.length > maxFiles) {
        newImages.shift(); // Remove oldest if exceeding limit
      }
      return newImages;
    });

    // Call callback
    if (onCapture) {
      onCapture(imageDataUrl);
    }
  }, [flashEnabled, maxFiles, onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isActive) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [isActive, startCamera, stopCamera]);

  const downloadImage = (imageDataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.download = `captured-image-${index + 1}.jpg`;
    link.href = imageDataUrl;
    link.click();
  };

  const clearImages = () => {
    setCapturedImages([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && onFileSelect) {
      onFileSelect(files);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Camera Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Camera className="w-5 h-5 text-blue-500" />
            <span>التقاط بالكاميرا</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isActive ? (
            <div className="text-center space-y-4">
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  التقط مستنداتك بجودة عالية
                </h3>
                <p className="text-gray-600 mb-4">
                  استخدم الكاميرا لالتقاط الوثائق، الكتب، أو أي محتوى تريد طباعته
                </p>
                <div className="flex justify-center space-x-2 space-x-reverse">
                  <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                    <Camera className="w-4 h-4 mr-2" />
                    تشغيل الكاميرا
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    اختر ملف
                  </Button>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple={allowMultiple}
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`w-full ${isFullscreen ? 'h-screen object-cover' : 'h-96 object-cover'}`}
                />
                
                {/* Camera Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 space-x-reverse">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFlashEnabled(!flashEnabled)}
                    className={flashEnabled ? 'bg-yellow-500 text-white' : ''}
                  >
                    {flashEnabled ? <FlashOn className="w-4 h-4" /> : <FlashOff className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    onClick={captureImage}
                    size="lg"
                    className="rounded-full w-16 h-16 bg-white text-black hover:bg-gray-200"
                  >
                    <Camera className="w-8 h-8" />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={switchCamera}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Top Controls */}
                <div className="absolute top-4 right-4 flex space-x-2 space-x-reverse">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={stopCamera}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Capture Count Badge */}
                {capturedImages.length > 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white">
                      {capturedImages.length} صورة
                    </Badge>
                  </div>
                )}
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Captured Images */}
      <AnimatePresence>
        {capturedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>الصور الملتقطة ({capturedImages.length})</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearImages}>
                    <X className="w-4 h-4 mr-1" />
                    مسح الكل
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {capturedImages.map((imageDataUrl, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={imageDataUrl}
                        alt={`Captured ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-500 transition-colors"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2 space-x-reverse">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadImage(imageDataUrl, index)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {index + 1}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <Zap className="w-5 h-5" />
            <span>مزايا الكاميرا المتطورة</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>جودة عالية HD</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>تبديل الكاميرا الأمامية/الخلفية</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>فلاش للإضاءة</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>وضع ملء الشاشة</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>تحميل فوري</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>دعم ملفات متعددة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CameraCapture;