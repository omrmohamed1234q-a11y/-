import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from "framer-motion"
import { 
  Printer, 
  FileText, 
  Clock, 
  DollarSign, 
  Download,
  Upload,
  Scan,
  ShoppingCart,
  CameraIcon, 
  FileImageIcon, 
  CheckIcon,
  XIcon,
  RotateCcwIcon,
  Eye
} from 'lucide-react';
import { DragDropUpload } from '@/components/upload/DragDropUpload';
import { uploadFile, uploadFileToGoogleDrive, validateFile, checkUploadServiceStatus } from '@/lib/upload-service';
import { PDFProcessor } from '@/components/pdf/PDFProcessor';
import { UploadStatus } from '@/components/upload/UploadStatus';
import { PriceGuide } from '@/components/print/PriceGuide';
import { calculate_price, convertLegacySettings } from '@/lib/pricing';

type ScanMode = 'color' | 'grayscale' | 'blackwhite'
type ScanStep = 'capture' | 'preview' | 'processing' | 'complete'

interface ScannedDocument {
  id: string
  originalImage: string
  processedImage: string
  mode: ScanMode
  uploadUrl: string
  timestamp: Date
}

const ScanModeSelector = ({ 
  selectedMode, 
  onModeChange, 
  disabled 
}: { 
  selectedMode: ScanMode
  onModeChange: (mode: ScanMode) => void
  disabled: boolean
}) => {
  const modes = [
    { 
      value: 'color' as ScanMode, 
      label: 'ملون', 
      icon: '🌈', 
      description: 'احتفظ بالألوان الأصلية'
    },
    { 
      value: 'grayscale' as ScanMode, 
      label: 'رمادي', 
      icon: '⚫', 
      description: 'تحويل إلى رمادي للوضوح'
    },
    { 
      value: 'blackwhite' as ScanMode, 
      label: 'أبيض وأسود', 
      icon: '⚪', 
      description: 'نص واضح وحاد'
    }
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {modes.map((mode) => (
        <motion.button
          key={mode.value}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={() => !disabled && onModeChange(mode.value)}
          disabled={disabled}
          className={`
            p-4 rounded-xl border-2 transition-all duration-200
            ${selectedMode === mode.value 
              ? 'border-red-500 bg-red-50 text-red-700' 
              : 'border-gray-200 bg-white hover:border-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-2xl mb-2">{mode.icon}</div>
          <div className="font-semibold text-sm mb-1">{mode.label}</div>
          <div className="text-xs text-gray-500">{mode.description}</div>
        </motion.button>
      ))}
    </div>
  )
}

const SmartScanComponent = ({ onScanComplete }: { onScanComplete: (files: File[]) => void }) => {
  const [currentStep, setCurrentStep] = useState<ScanStep>('capture')
  const [selectedMode, setSelectedMode] = useState<ScanMode>('color')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [scannedDocuments, setScannedDocuments] = useState<ScannedDocument[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isUsingCamera, setIsUsingCamera] = useState(false)
  const { toast } = useToast()

  // تنظيف الكاميرا عند إلغاء التحديد
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsUsingCamera(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  // بدء الكاميرا
  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Starting camera...')
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('CAMERA_NOT_SUPPORTED')
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      } catch (backCameraError) {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      setStream(mediaStream)
      setIsUsingCamera(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        videoRef.current.onloadedmetadata = () => {
          toast({
            title: "تم تفعيل الكاميرا",
            description: "يمكنك الآن التقاط الصور",
          })
        }
      }

    } catch (error: any) {
      console.error('❌ Camera error:', error)
      
      let errorMessage = "لا يمكن الوصول إلى الكاميرا"
      
      if (error?.name === 'NotAllowedError') {
        errorMessage = "يرجى السماح بالوصول إلى الكاميرا من إعدادات المتصفح"
      } else if (error?.name === 'NotFoundError') {
        errorMessage = "لم يتم العثور على كاميرا على هذا الجهاز"
      } else if (error?.name === 'NotSupportedError' || error?.message === 'CAMERA_NOT_SUPPORTED') {
        errorMessage = "المتصفح لا يدعم استخدام الكاميرا"
      }
      
      toast({
        title: "خطأ في الكاميرا",
        description: errorMessage,
        variant: "destructive",
      })

      setIsUsingCamera(false)
      setStream(null)
    }
  }, [stream, toast])

  // التقاط صورة
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "خطأ",
        description: "لا يمكن التقاط الصورة، تأكد من تشغيل الكاميرا",
        variant: "destructive"
      })
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context || !video.videoWidth || !video.videoHeight) {
      toast({
        title: "خطأ",
        description: "الكاميرا غير جاهزة، حاول مرة أخرى",
        variant: "destructive"
      })
      return
    }

    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageDataUrl)
      setCurrentStep('preview')
      stopCamera()
      
      toast({
        title: "تم التقاط الصورة",
        description: "يمكنك الآن معاينتها ومعالجتها",
      })
    } catch (error) {
      console.error('❌ Capture error:', error)
      toast({
        title: "فشل التقاط الصورة",
        description: "حدث خطأ، حاول مرة أخرى",
        variant: "destructive"
      })
    }
  }, [stopCamera, toast])

  // اختيار ملف
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "نوع ملف غير صحيح",
        description: "يرجى اختيار صورة فقط (JPG, PNG, etc.)",
        variant: "destructive"
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setCapturedImage(result)
      setCurrentStep('preview')
      
      toast({
        title: "تم تحديد الصورة",
        description: "يمكنك الآن معاينتها ومعالجتها",
      })
    }
    reader.onerror = () => {
      toast({
        title: "خطأ في قراءة الملف",
        description: "لا يمكن قراءة الصورة المحددة",
        variant: "destructive"
      })
    }
    reader.readAsDataURL(file)
  }, [toast])

  // معالجة ورفع
  const processAndUpload = useCallback(async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    setCurrentStep('processing')

    try {
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      const file = new File([blob], `scan_${selectedMode}_${Date.now()}.jpg`, { type: 'image/jpeg' })

      // إرسال الملف للمكون الأب
      onScanComplete([file])

      const newDocument: ScannedDocument = {
        id: `scan_${Date.now()}`,
        originalImage: capturedImage,
        processedImage: capturedImage,
        mode: selectedMode,
        uploadUrl: '',
        timestamp: new Date()
      }

      setScannedDocuments(prev => [newDocument, ...prev])
      setCurrentStep('complete')

      toast({
        title: "تم المسح بنجاح!",
        description: "تم إضافة الملف للطباعة",
      })

    } catch (error: any) {
      console.error('❌ Processing error:', error)
      toast({
        title: "خطأ في المعالجة",
        description: error?.message || "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive",
      })
      setCurrentStep('preview')
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImage, selectedMode, toast, onScanComplete])

  // إعادة تعيين
  const resetScan = useCallback(() => {
    setCapturedImage(null)
    setCurrentStep('capture')
    setIsProcessing(false)
    stopCamera()
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [stopCamera])

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          مسح ضوئي ذكي
        </CardTitle>
        <p className="text-gray-600">
          استخدم الكاميرا أو اختر صورة لمسح المستندات
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <ScanModeSelector
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          disabled={currentStep !== 'capture'}
        />

        <AnimatePresence mode="wait">
          {currentStep === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {isUsingCamera && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-xl overflow-hidden">
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-64 object-cover"
                    />
                    
                    <div className="absolute inset-4 border-2 border-white/50 border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                      <div className="text-white/70 text-center text-sm">
                        <p>ضع المستند داخل الإطار</p>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <Button
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black shadow-xl border-4 border-white/20"
                      >
                        <CameraIcon className="w-6 h-6" />
                      </Button>
                    </div>
                    
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      size="sm"
                      className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black border-0"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                    
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Live
                    </div>
                  </div>
                </div>
              )}

              {!isUsingCamera && (
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={startCamera}
                    className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex-col transition-all duration-200"
                  >
                    <CameraIcon className="w-8 h-8 mb-2" />
                    <span>استخدام الكاميرا</span>
                  </Button>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="h-24 border-2 border-gray-200 hover:border-gray-300 rounded-xl flex-col transition-all duration-200"
                  >
                    <FileImageIcon className="w-8 h-8 mb-2 text-gray-600" />
                    <span>اختيار من الجهاز</span>
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}

          {currentStep === 'preview' && capturedImage && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                <img 
                  src={capturedImage} 
                  alt="معاينة الصورة"
                  className="w-full h-64 object-contain"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetScan}
                  disabled={isProcessing}
                  className="flex-1 h-12 border-2 border-gray-200 hover:border-red-300 rounded-xl"
                >
                  <RotateCcwIcon className="w-4 h-4 ml-2" />
                  إعادة التقاط
                </Button>
                <Button
                  onClick={processAndUpload}
                  disabled={isProcessing}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      معالجة...
                    </div>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 ml-2" />
                      إضافة للطباعة
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 border-4 border-red-500 border-t-transparent rounded-full"
              />
              <h3 className="text-lg font-semibold mb-2">جاري معالجة الصورة...</h3>
              <p className="text-gray-600">يتم تحضير الملف للطباعة</p>
            </motion.div>
          )}

          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">تم بنجاح!</h3>
              <p className="text-gray-600 mb-4">تم إضافة الملف للطباعة</p>
              
              <Button
                onClick={resetScan}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
              >
                مسح مستند جديد
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {scannedDocuments.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">المستندات الممسوحة ({scannedDocuments.length})</h3>
            <div className="space-y-3">
              {scannedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={doc.processedImage} 
                      alt="مصغرة المستند"
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">مسح {doc.mode === 'color' ? 'ملون' : doc.mode === 'grayscale' ? 'رمادي' : 'أبيض وأسود'}</p>
                      <p className="text-sm text-gray-500">{doc.timestamp.toLocaleString('ar-EG')}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(doc.processedImage, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function Print() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [printSettings, setPrintSettings] = useState({
    copies: 1,
    colorMode: 'grayscale',
    paperSize: 'A4',
    paperType: 'plain',
    doubleSided: false,
    pages: 'all',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Array<{
    fileName: string;
    fileSize: number;
    uploadedSize: number;
    progress: number;
    speed?: number;
    timeRemaining?: number;
  }>>([]);
  const [uploadResults, setUploadResults] = useState<Array<{
    name: string;
    url: string;
    provider?: 'cloudinary' | 'firebase' | 'google_drive';
    previewUrl?: string;
    fileSize?: number;
  }>>([]);
  const [uploadErrors, setUploadErrors] = useState<Array<{
    name: string;
    error: string;
    fileSize?: number;
  }>>([]);

  // Mutation to add print jobs to cart
  const addToCartMutation = useMutation({
    mutationFn: async (printJobData: any) => {
      const response = await apiRequest('POST', '/api/cart/print-job', printJobData);
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      console.log('✅ Print job added successfully:', variables.filename);
    },
    onError: (error: any, variables: any) => {
      console.error('❌ Failed to add print job:', variables.filename, error);
      throw error; // Re-throw للسماح للـ parent handler بمعالجة الخطأ
    },
  });

  const handleFileUpload = async (files: File[]) => {
    if (!user) {
      toast({
        title: 'غير مسجل الدخول',
        description: 'يرجى تسجيل الدخول أولاً',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadResults([]);
    setUploadErrors([]);
    setUploadProgress([]);
    
    console.log('📤 Starting upload of', files.length, 'files...');
    
    // Initialize progress tracking for all files
    const initialProgress = files.map(file => ({
      fileName: file.name,
      fileSize: file.size,
      uploadedSize: 0,
      progress: 0,
      speed: 0,
      timeRemaining: 0
    }));
    setUploadProgress(initialProgress);
    
    try {
      console.log('🔍 Checking Cloudinary status...');
      const status = await checkUploadServiceStatus();
      console.log('Upload service status:', status);
      
      const results: Array<{ name: string; url: string; provider?: 'cloudinary' | 'firebase' | 'google_drive'; fileSize?: number }> = [];
      const errors: Array<{ name: string; error: string; fileSize?: number }> = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const startTime = Date.now();
        
        try {
          console.log(`🚀 Uploading to Google Drive (Primary): ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          
          // Simulate detailed progress tracking
          const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const simulatedProgress = Math.min((elapsed / 3000) * 100, 95); // Simulate progress over 3 seconds, max 95%
            const uploadedBytes = Math.floor((simulatedProgress / 100) * file.size);
            const speed = uploadedBytes / (elapsed / 1000); // bytes per second
            const remainingBytes = file.size - uploadedBytes;
            const timeRemaining = speed > 0 ? remainingBytes / speed : 0;
            
            setUploadProgress(prev => prev.map((p, index) => 
              index === i ? {
                ...p,
                progress: simulatedProgress,
                uploadedSize: uploadedBytes,
                speed: speed,
                timeRemaining: timeRemaining
              } : p
            ));
          }, 200);
          
          // Use Google Drive as primary upload method for cost optimization
          const result = await uploadFileToGoogleDrive(file, printSettings);
          
          clearInterval(progressInterval);
          
          if (result.success && result.url) {
            console.log('✅ Google Drive upload successful! Cost savings activated 💰');
            
            // Complete progress
            setUploadProgress(prev => prev.map((p, index) => 
              index === i ? {
                ...p,
                progress: 100,
                uploadedSize: file.size,
                speed: file.size / ((Date.now() - startTime) / 1000),
                timeRemaining: 0
              } : p
            ));
            
            results.push({
              name: file.name,
              url: result.url,
              provider: 'google_drive',
              fileSize: file.size
            });
          } else {
            // Fallback to Cloudinary if Google Drive fails
            console.warn('⚠️ Google Drive failed, trying Cloudinary fallback...');
            const fallbackResult = await uploadFile(file);
            
            if (fallbackResult.success && fallbackResult.url) {
              console.log('✅ Cloudinary fallback successful!');
              
              // Complete progress
              setUploadProgress(prev => prev.map((p, index) => 
                index === i ? {
                  ...p,
                  progress: 100,
                  uploadedSize: file.size,
                  speed: file.size / ((Date.now() - startTime) / 1000),
                  timeRemaining: 0
                } : p
              ));
              
              results.push({
                name: file.name,
                url: fallbackResult.url,
                provider: 'cloudinary',
                fileSize: file.size
              });
            } else {
              throw new Error(result.error || fallbackResult.error || 'Both Google Drive and Cloudinary failed');
            }
          }
        } catch (error) {
          console.error(`❌ Upload failed for ${file.name}:`, error);
          errors.push({
            name: file.name,
            error: error instanceof Error ? error.message : 'Unknown error',
            fileSize: file.size
          });
        }
      }
      
      console.log('✅ Successfully uploaded', results.length, 'files');
      console.log('Upload results:', results);
      
      setUploadResults(results);
      setUploadErrors(errors);
      setSelectedFiles(files);
      setUploadedUrls(results.map(r => r.url));
      
      if (results.length > 0) {
        toast({
          title: 'تم رفع الملفات بنجاح',
          description: `تم رفع ${results.length} من ${files.length} ملف`,
        });
      }
      
      if (errors.length > 0) {
        toast({
          title: 'بعض الملفات فشلت في الرفع',
          description: `فشل رفع ${errors.length} ملف`,
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Upload process failed:', error);
      toast({
        title: 'خطأ في رفع الملفات',
        description: 'حدث خطأ أثناء رفع الملفات',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragDropUpload = (files: File[]) => {
    console.log('Files selected via drag & drop:', files.map(f => f.name));
    handleFileUpload(files);
  };

  const handleCameraCapture = async (file: File, downloadUrl: string) => {
    setSelectedFiles([file]);
    setUploadedUrls([downloadUrl]);
    console.log('File captured:', file.name, 'URL:', downloadUrl);
  };

  // دالة لتوليد اسم واضح للملف حسب إعدادات الطباعة
  const generatePrintJobFilename = (settings: any, originalName: string) => {
    const paperTypeLabels = {
      'plain': 'ورق عادي',
      'glossy': 'ورق لامع',
      'matte': 'ورق مطفي',
      'sticker': 'استيكر'
    };
    
    const colorModeLabels = {
      'grayscale': 'أبيض وأسود',
      'color': 'ملون'
    };

    // الحصول على اسم الملف بدون امتداد
    const fileNameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const fileExtension = originalName.split('.').pop() || '';
    
    // تكوين اسم الملف: الاسم الأصلي + عدد النسخ + نوع الورق
    const printSettings = `عدد ${settings.copies} - ${settings.paperSize} ${paperTypeLabels[settings.paperType as keyof typeof paperTypeLabels]} ${colorModeLabels[settings.colorMode as keyof typeof colorModeLabels]}`;
    const displayName = `${fileNameWithoutExt} - ${printSettings}`;
    
    return settings.doubleSided ? `${displayName} (وجهين).${fileExtension}` : `${displayName}.${fileExtension}`;
  };

  const handlePrint = async () => {
    if (selectedFiles.length === 0 || !user) {
      toast({
        title: 'لا توجد ملفات',
        description: 'يرجى رفع ملف واحد على الأقل للطباعة',
        variant: 'destructive'
      });
      return;
    }

    if (uploadedUrls.length !== selectedFiles.length) {
      toast({
        title: 'خطأ في الملفات',
        description: 'يرجى التأكد من رفع جميع الملفات بنجاح',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    
    try {
      console.log('Adding print jobs to cart:', selectedFiles.map(f => f.name), 'with settings:', printSettings);
      console.log('File URLs:', uploadedUrls);
      
      const printJobs = selectedFiles.map((file, index) => ({
        filename: generatePrintJobFilename(printSettings, file.name),
        fileUrl: uploadedUrls[index],
        fileSize: file.size,
        fileType: file.type,
        pages: 1,
        copies: printSettings.copies,
        colorMode: printSettings.colorMode,
        paperSize: printSettings.paperSize,
        paperType: printSettings.paperType,
        doubleSided: printSettings.doubleSided,
        pageRange: printSettings.pages
      }));

      // إضافة الملفات للسلة بشكل متتالي مع معالجة أفضل للأخطاء
      let successCount = 0;
      let failureCount = 0;

      for (const printJob of printJobs) {
        try {
          console.log('Adding to cart:', printJob);
          await addToCartMutation.mutateAsync(printJob);
          successCount++;
        } catch (error) {
          console.error('Failed to add single print job:', error);
          failureCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'تمت الإضافة للسلة',
          description: `تم إضافة ${successCount} من ${printJobs.length} ملف للطباعة`,
        });

        // إعادة تعيين النماذج فقط إذا تم إضافة ملف واحد على الأقل بنجاح
        setSelectedFiles([]);
        setUploadedUrls([]);
        setPrintSettings({
          copies: 1,
          colorMode: 'grayscale',
          paperSize: 'A4',
          paperType: 'plain',
          doubleSided: false,
          pages: 'all',
        });
      }

      if (failureCount > 0) {
        toast({
          title: 'خطأ في بعض الملفات',
          description: `فشل في إضافة ${failureCount} ملف للسلة`,
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Failed to add print jobs to cart:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في إضافة الملفات للسلة',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const calculateCost = () => {
    if (selectedFiles.length === 0) return 0;
    
    // Convert current settings to new pricing format
    const pricingSettings = convertLegacySettings(printSettings);
    
    // Calculate estimated pages (1 page per file for now, can be improved with PDF page detection)
    const estimatedPages = selectedFiles.length;
    
    // Calculate price using professional pricing function
    const pricingResult = calculate_price(
      pricingSettings.paper_size,
      pricingSettings.paper_type,
      pricingSettings.print_type,
      estimatedPages,
      pricingSettings.is_black_white
    );
    
    // Multiply by copies
    const totalCost = pricingResult.finalPrice * printSettings.copies;
    
    return totalCost;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">خدمات الطباعة</h1>
          <p className="text-muted-foreground">اطبع مستنداتك بسهولة وجودة عالية</p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              رفع الملفات
            </TabsTrigger>
            <TabsTrigger value="pdf-tools" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              أدوات PDF
            </TabsTrigger>
            <TabsTrigger value="smart-scan" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              المسح الذكي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Upload Section */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Upload className="h-5 w-5 text-accent ml-2" />
                    رفع الملف
                  </h2>
                  
                  <DragDropUpload
                    onUpload={handleDragDropUpload}
                    maxFiles={5}
                    maxSize={50 * 1024 * 1024}
                    acceptedTypes={['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                  />
                  
                  <UploadStatus 
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    uploadResults={uploadResults}
                    uploadErrors={uploadErrors}
                  />
                </CardContent>
              </Card>

              {/* Print Settings */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Printer className="h-5 w-5 text-accent ml-2" />
                    إعدادات الطباعة
                  </h2>
              
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="copies">عدد النسخ</Label>
                        <Input
                          id="copies"
                          type="number"
                          min="1"
                          max="100"
                          value={printSettings.copies}
                          onChange={(e) => setPrintSettings({
                            ...printSettings,
                            copies: parseInt(e.target.value) || 1
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="paper-size">حجم الورق</Label>
                        <Select
                          value={printSettings.paperSize}
                          onValueChange={(value) => setPrintSettings({
                            ...printSettings,
                            paperSize: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A4">A4</SelectItem>
                            <SelectItem value="A3">A3</SelectItem>
                            <SelectItem value="A5">A5</SelectItem>
                            <SelectItem value="Letter">Letter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="paper-type">نوع الورق</Label>
                      <Select
                        value={printSettings.paperType}
                        onValueChange={(value) => setPrintSettings({
                          ...printSettings,
                          paperType: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plain">عادي (Plain)</SelectItem>
                          <SelectItem value="glossy">لامع (Glossy)</SelectItem>
                          <SelectItem value="matte">مطفي (Matte)</SelectItem>
                          <SelectItem value="sticker">استيكر (Sticker)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="color-mode">وضع الألوان</Label>
                      <Select
                        value={printSettings.colorMode}
                        onValueChange={(value) => setPrintSettings({
                          ...printSettings,
                          colorMode: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grayscale">أبيض وأسود</SelectItem>
                          <SelectItem value="color">ملون</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="double-sided">طباعة على الوجهين</Label>
                      <Switch
                        id="double-sided"
                        checked={printSettings.doubleSided}
                        onCheckedChange={(checked) => setPrintSettings({
                          ...printSettings,
                          doubleSided: checked
                        })}
                      />
                    </div>
                    
                    {/* Cost Estimation */}
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">التكلفة المتوقعة:</span>
                        <span className="text-xl font-bold text-accent number-with-arabic">
                          <span className="arabic-nums">{calculateCost().toFixed(2)}</span> جنيه
                        </span>
                      </div>
                      {printSettings.colorMode === 'grayscale' && (
                        <div className="text-sm text-green-600 mb-2">
                          ✓ خصم 10% للطباعة بالأبيض والأسود
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>نقاط المكافآت المحتملة:</span>
                          <span className="number-with-arabic">+<span className="arabic-nums">{Math.floor(calculateCost() / 2)}</span></span>
                        </div>
                      </div>
                      
                      {/* Price Guide Button */}
                      <div className="mt-3">
                        <PriceGuide compact />
                      </div>
                    </div>
                    
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-white"
                      onClick={handlePrint}
                      disabled={selectedFiles.length === 0 || isUploading || addToCartMutation.isPending}
                    >
                      {isUploading || addToCartMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                          {addToCartMutation.isPending ? 'إضافة للسلة...' : 'جاري الرفع...'}
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 ml-2" />
                          إضافة للسلة - ابدأ الطباعة
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pdf-tools">
            <PDFProcessor 
              files={selectedFiles.filter(f => f.type === 'application/pdf')}
              onProcessComplete={(files) => {
                setSelectedFiles(files);
                console.log('PDF tools processing complete:', files.map(f => f.name));
              }}
            />
          </TabsContent>

          <TabsContent value="smart-scan">
            <SmartScanComponent onScanComplete={handleCameraCapture} />
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
}