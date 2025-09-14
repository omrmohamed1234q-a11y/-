import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  Eye,
  Info,
  Palette
} from 'lucide-react';
import { DragDropUpload } from '@/components/upload/DragDropUpload';
import { uploadFile, uploadFileToGoogleDrive, validateFile, checkUploadServiceStatus } from '@/lib/upload-service';
import { PDFProcessor } from '@/components/pdf/PDFProcessor';
import { UploadStatus } from '@/components/upload/UploadStatus';
import { PriceGuide } from '@/components/print/PriceGuide';
import { calculate_price, convertLegacySettings } from '@/lib/pricing';
import { getPDFInfo } from '@/lib/pdf-tools';

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
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
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

  // التقاط صورة مبسط
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
      // تعيين حجم محسن للكانفاس
      const maxWidth = 1200
      const ratio = video.videoWidth / video.videoHeight
      
      if (video.videoWidth > maxWidth) {
        canvas.width = maxWidth
        canvas.height = maxWidth / ratio
      } else {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // حفظ الصورة كـ data URL للمعاينة فقط
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageDataUrl)
      setCurrentStep('preview')
      stopCamera()
      
      toast({
        title: "تم التقاط الصورة",
        description: "يمكنك الآن إضافتها للطباعة",
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

  // اختيار ملف مع معالجة المرشحات
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

    // قراءة الملف وعرضه للمعاينة قبل المعالجة
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

  // معالجة ورفع مع تطبيق المرشحات
  const processAndUpload = useCallback(() => {
    if (!capturedImage) return

    setIsProcessing(true)
    setCurrentStep('processing')

    try {
      // إنشاء كانفاس لتطبيق المرشحات
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('فشل في إنشاء Canvas للمعالجة')
      }

      // تحميل الصورة
      const img = new Image()
      img.onload = () => {
        try {
          // تعيين حجم الكانفاس
          canvas.width = img.width
          canvas.height = img.height
          
          // رسم الصورة
          ctx.drawImage(img, 0, 0)
          
          // تطبيق المرشح حسب النوع المحدد
          if (selectedMode === 'grayscale') {
            console.log('🎨 Applying grayscale filter...')
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data
            
            for (let i = 0; i < data.length; i += 4) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
              data[i] = gray     // red
              data[i + 1] = gray // green  
              data[i + 2] = gray // blue
            }
            
            ctx.putImageData(imageData, 0, 0)
          } else if (selectedMode === 'blackwhite') {
            console.log('🎨 Applying black & white filter...')
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data
            
            for (let i = 0; i < data.length; i += 4) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
              const threshold = gray > 128 ? 255 : 0
              data[i] = threshold     // red
              data[i + 1] = threshold // green  
              data[i + 2] = threshold // blue
            }
            
            ctx.putImageData(imageData, 0, 0)
          }

          // تحويل إلى ملف
          canvas.toBlob((blob) => {
            if (!blob) {
              throw new Error('فشل في تحويل الصورة')
            }

            const file = new File([blob], `scan_${selectedMode}_${Date.now()}.jpg`, { type: 'image/jpeg' })
            
            // إرسال الملف للمكون الأب
            onScanComplete([file])

            // حفظ الصورة المعالجة للعرض
            const processedImageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
            const newDocument: ScannedDocument = {
              id: `scan_${Date.now()}`,
              originalImage: capturedImage,
              processedImage: processedImageDataUrl,
              mode: selectedMode,
              uploadUrl: '',
              timestamp: new Date()
            }

            setScannedDocuments(prev => [newDocument, ...prev])
            setCurrentStep('complete')
            setIsProcessing(false)

            toast({
              title: "تم المسح بنجاح!",
              description: `تم تطبيق مرشح "${selectedMode === 'color' ? 'الألوان الأصلية' : selectedMode === 'grayscale' ? 'الرمادي' : 'الأبيض والأسود'}" وإضافة الملف للمسح`,
            })

          }, 'image/jpeg', 0.8)

        } catch (error: any) {
          console.error('❌ Canvas processing error:', error)
          setIsProcessing(false)
          setCurrentStep('preview')
          toast({
            title: "خطأ في المعالجة",
            description: error?.message || "حدث خطأ أثناء تطبيق المرشح",
            variant: "destructive",
          })
        }
      }

      img.onerror = () => {
        setIsProcessing(false)
        setCurrentStep('preview')
        toast({
          title: "خطأ في تحميل الصورة",
          description: "فشل في تحميل الصورة للمعالجة",
          variant: "destructive",
        })
      }

      img.src = capturedImage

    } catch (error: any) {
      console.error('❌ Processing error:', error)
      toast({
        title: "خطأ في المعالجة",
        description: error?.message || "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive",
      })
      setCurrentStep('preview')
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

  // تسجيل حالة المكون للتشخيص
  console.log('SmartScan render:', { currentStep, isUsingCamera, capturedImage: !!capturedImage })

  return (
    <Card className="bg-white border shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-blue-600">
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

        {/* تبسيط المكون للتشخيص - بدون framer-motion مؤقتاً */}
        {currentStep === 'capture' && (
          <div className="space-y-4">
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
          </div>
        )}

        {currentStep === 'preview' && capturedImage && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-green-600 mb-2">✅ تم تحميل الصورة بنجاح!</h3>
              <p className="text-gray-600">اختر المرشح المطلوب ثم اضغط "إضافة للمسح"</p>
            </div>
            
            <div className="relative bg-gray-100 rounded-xl overflow-hidden border-2 border-green-200">
              <img 
                src={capturedImage} 
                alt="معاينة الصورة"
                className="w-full h-64 object-contain"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                معاينة
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🎨 المرشح المحدد:</h4>
              <p className="text-blue-700">
                {selectedMode === 'color' ? '🌈 ملون - ستبقى الألوان كما هي' : 
                 selectedMode === 'grayscale' ? '⚫ رمادي - ستتحول للرمادي' : 
                 '⚪ أبيض وأسود - ستتحول لأبيض وأسود حاد'}
              </p>
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
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    معالجة...
                  </div>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 ml-2" />
                    إضافة للمسح
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-lg font-semibold mb-2">جاري معالجة الصورة...</h3>
            <p className="text-gray-600">يتم تحضير الملف للطباعة</p>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">تم بنجاح!</h3>
            <p className="text-gray-600 mb-4">تم إضافة الملف للمسح</p>
            
            <Button
              onClick={resetScan}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
            >
              مسح مستند جديد
            </Button>
          </div>
        )}

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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewImage(doc.processedImage)}
                      title="معاينة الصورة"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = doc.processedImage
                        link.download = `scan_${doc.mode}_${doc.timestamp.getTime()}.jpg`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                      title="تحميل الصورة"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* نافذة معاينة منبثقة */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <Button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 left-0 bg-white/20 hover:bg-white/30 text-white border-white/20"
                size="sm"
              >
                <XIcon className="w-4 h-4 ml-1" />
                إغلاق
              </Button>
              <img
                src={previewImage}
                alt="معاينة الصورة"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={() => setPreviewImage(null)}
              />
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

  // Individual file settings - each file gets its own print settings
  const [fileSettings, setFileSettings] = useState<{[fileName: string]: {
    copies: number;
    colorMode: 'grayscale' | 'color';
    paperSize: 'A4' | 'A3' | 'A0' | 'A1' | 'A2';
    paperType: 'plain' | 'coated' | 'glossy' | 'sticker';
    doubleSided: boolean;
  }}>({});
  
  // File collapse state - tracks which files are expanded/collapsed
  const [fileExpandedState, setFileExpandedState] = useState<{[fileName: string]: boolean}>({});
  
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

  // Pending uploads system (persistent file cart)
  const { data: pendingUploads = [], refetch: refetchPendingUploads } = useQuery({
    queryKey: ['/api/pending-uploads'],
    enabled: !!user,
    refetchOnWindowFocus: false, // Prevent auto-refetch on window focus
    refetchOnReconnect: false,   // Prevent auto-refetch on network reconnect
    staleTime: 5 * 60 * 1000,    // Consider data fresh for 5 minutes
  });

  const createPendingUploadMutation = useMutation({
    mutationFn: async (uploadData: any) => {
      return await apiRequest('POST', '/api/pending-uploads', uploadData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pending-uploads'] });
      console.log('📁 Pending upload saved to cart');
    },
    onError: (error) => {
      console.error('❌ Failed to save pending upload:', error);
    },
  });

  // Helper function to persist uploaded files as pending uploads
  const persistPendingUploads = async (uploadedFiles: any[]) => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.log('⚠️ No files to persist to pending uploads');
      return;
    }

    console.log(`💾 Saving ${uploadedFiles.length} uploaded files to pending uploads cart...`);
    try {
      const uploadSession = `upload_${Date.now()}`;
      
      // Use Promise.all to save all files to pending uploads with PDF analysis
      await Promise.all(uploadedFiles.map(async (file) => {
        console.log(`📁 Saving ${file.name} to pending uploads...`);
        
        // Analyze PDF for real page count if it's a PDF file
        let actualPages = 1; // Default fallback
        let actualFileType = file.fileType || 'application/pdf';
        
        if (file.url && file.name.toLowerCase().endsWith('.pdf')) {
          try {
            console.log(`📄 Analyzing PDF: ${file.name}`);
            // Download PDF and analyze it
            const response = await fetch(file.url);
            if (response.ok) {
              const blob = await response.blob();
              const pdfFile = new File([blob], file.name, { type: 'application/pdf' });
              const pdfInfo = await getPDFInfo(pdfFile);
              actualPages = pdfInfo.pages;
              actualFileType = 'application/pdf';
              console.log(`✅ PDF analyzed: ${file.name} has ${actualPages} pages`);
            } else {
              console.warn(`⚠️ Could not download PDF for analysis: ${file.name}`);
            }
          } catch (error) {
            console.error(`❌ Error analyzing PDF ${file.name}:`, error);
            console.log(`⚠️ Using fallback page count (1) for: ${file.name}`);
          }
        }
        
        return await createPendingUploadMutation.mutateAsync({
          filename: file.name,
          originalName: file.name,
          fileUrl: file.url,
          fileSize: file.fileSize || 0,
          fileType: actualFileType,
          provider: file.provider || 'google_drive',
          uploadSession,
          pages: actualPages, // Real page count from PDF analysis
          // Default print settings
          copies: 1,
          colorMode: 'grayscale',
          paperSize: 'A4',
          paperType: 'plain',
          doubleSided: false,
          isExpanded: false,
          // Book printing defaults
          bookPrinting: false,
          bindingType: 'spiral',
          bindingPrice: 20
        });
      }));
      
      console.log(`✅ All ${uploadedFiles.length} files saved to pending uploads cart successfully!`);
    } catch (error) {
      console.error('❌ Failed to save files to pending uploads cart:', error);
    }
  };

  const updatePendingUploadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest('PUT', `/api/pending-uploads/${id}/settings`, updates);
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['/api/pending-uploads'] });
      
      // Snapshot the previous value
      const previousUploads = queryClient.getQueryData(['/api/pending-uploads']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/pending-uploads'], (old: any) => {
        if (!old) return old;
        return old.map((upload: any) => 
          upload.id === id ? { ...upload, ...updates } : upload
        );
      });
      
      console.log('⚡ Optimistic update applied for', id);
      
      // Return a context object with the snapshotted value
      return { previousUploads };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUploads) {
        queryClient.setQueryData(['/api/pending-uploads'], context.previousUploads);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pending-uploads'] });
      console.log('⚙️ Pending upload settings updated');
    },
  });

  const deletePendingUploadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/pending-uploads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pending-uploads'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الملف من سلة الملفات',
      });
    },
  });

  const clearPendingUploadsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/pending-uploads');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pending-uploads'] });
      toast({
        title: 'تم المسح',
        description: 'تم مسح جميع الملفات من سلة الملفات',
      });
    },
  });

  // Helper functions for pending uploads (persistent file cart)
  const togglePendingUploadExpanded = (uploadId: string) => {
    const upload = pendingUploads.find((u: any) => u.id === uploadId);
    if (upload) {
      updatePendingUploadMutation.mutate({
        id: uploadId,
        updates: { isExpanded: !upload.isExpanded }
      });
    }
  };

  const updatePendingUploadSettings = (uploadId: string, settingName: string, value: any) => {
    updatePendingUploadMutation.mutate({
      id: uploadId,
      updates: { [settingName]: value }
    });
  };

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
      
      // إضافة النتائج للنتائج الموجودة بدلاً من استبدالها
      setUploadResults(prev => [...prev, ...results]);
      setUploadErrors(prev => [...prev, ...errors]);
      // لا نعيد تعيين selectedFiles هنا لأنها تم تعيينها بالفعل
      setUploadedUrls(prev => [...prev, ...results.map(r => r.url)]);
      
      // Success message
      if (results.length > 0) {
        toast({
          title: '✅ حُفظت الملفات في سلة الملفات',
          description: `تم حفظ ${results.length} ملف - ستبقى متاحة حتى لو غادرت الصفحة`,
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

  // Calculate current cart size from uploaded files
  const calculateCurrentCartSize = () => {
    return uploadResults.reduce((total, result) => total + (result.fileSize || 0), 0);
  };

  const handleDragDropUpload = async (files: File[], urls: string[]) => {
    console.log('Files selected via drag & drop:', files.map(f => f.name));
    console.log('URLs received:', urls);
    
    // Create upload results for the UI
    const uploadResults = files.map((file, index) => ({
      name: file.name,
      url: urls[index],
      fileSize: file.size,
      provider: 'google_drive',
      status: 'success'
    }));
    
    // **FIXED: Only save to pending uploads (remove selectedFiles duplication)**
    await persistPendingUploads(uploadResults);
    setUploadedUrls(prev => [...prev, ...urls]);
    
    // إضافة نتائج الرفع
    const newResults = files.map((file, index) => ({
      name: file.name,
      url: urls[index],
      provider: 'google_drive' as 'google_drive',
      fileSize: file.size
    }));
    
    setUploadResults(prev => [...prev, ...newResults]);
    
    // رسالة النجاح محذوفة - الزر الجماعي سيظهر بدلاً منها
  };

  const handleCameraCapture = async (file: File, downloadUrl: string) => {
    setSelectedFiles(prev => [...prev, file]);
    setUploadedUrls(prev => [...prev, downloadUrl]);
    console.log('File captured:', file.name, 'URL:', downloadUrl);
  };

  // دالة للمسح الذكي
  const handleSmartScan = (files: File[]) => {
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      console.log('Smart scan completed:', files.map(f => f.name));
    }
  };

  // دالة لتوليد اسم واضح للملف حسب إعدادات الطباعة
  // دالة لحذف ملف معين
  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
    setUploadResults(prev => prev.filter(r => r.name !== fileName));
    setUploadedUrls(prev => {
      const fileIndex = selectedFiles.findIndex(f => f.name === fileName);
      return prev.filter((_, index) => index !== fileIndex);
    });
    
    toast({
      title: 'تم حذف الملف',
      description: `تم حذف ${fileName}`,
    });
  };

  // دالة لمسح جميع الملفات
  const clearAllFiles = () => {
    // Clear old system (selectedFiles, uploadResults, etc.)
    setSelectedFiles([]);
    setUploadResults([]);
    setUploadedUrls([]);
    setUploadProgress([]);
    setUploadErrors([]);
    setFileSettings({});
    setFileExpandedState({});
    
    // Clear new system (pending uploads)
    clearPendingUploadsMutation.mutate(undefined, {
      onSuccess: () => {
        // Force immediate cache refresh to update UI
        queryClient.invalidateQueries({ queryKey: ['/api/pending-uploads'] });
      }
    });
    
    toast({
      title: 'تم مسح جميع الملفات',
      description: 'تم مسح جميع الملفات من القائمة وسلة الملفات',
    });
  };

  // دالة للتبديل بين طي وفتح ملف معين
  const toggleFileExpanded = (fileName: string) => {
    setFileExpandedState(prev => ({
      ...prev,
      [fileName]: !prev[fileName] // إذا كان مفتوح يصبح مطوي والعكس
    }));
  };

  // دالة الإضافة الجماعية للسلة
  const addAllFilesToCart = async () => {
    if (!user || uploadResults.length === 0) {
      toast({
        title: 'خطأ',
        description: !user ? 'يرجى تسجيل الدخول أولاً' : 'لا توجد ملفات للإضافة',
        variant: 'destructive'
      });
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // إنشاء print jobs لكل ملف مع إعداداته
    for (const result of uploadResults) {
      const fileName = result.name;
      const settings = fileSettings[fileName] || {
        copies: 1,
        colorMode: 'grayscale' as 'grayscale' | 'color',
        paperSize: 'A4' as 'A4' | 'A3' | 'A0' | 'A1' | 'A2',
        paperType: 'plain' as 'plain' | 'coated' | 'glossy' | 'sticker',
        doubleSided: false,
      };

      const printJob = {
        filename: fileName,
        fileUrl: result.url,
        pages: 'all',
        copies: settings.copies,
        colorMode: settings.colorMode,
        paperSize: settings.paperSize,
        paperType: settings.paperType,
        doubleSided: settings.doubleSided,
        userId: user.id,
        displayName: generatePrintJobFilename(settings, fileName),
        // معلومات المعاينة
        previewUrl: result.previewUrl,
        fileId: (result as any).fileId,
        fileType: (result as any).type || 'application/octet-stream', // استخدام النوع من نتيجة الرفع
        provider: result.provider
      };

      try {
        await addToCartMutation.mutateAsync(printJob);
        successCount++;
      } catch (error) {
        console.error(`فشل في إضافة ${fileName} للسلة:`, error);
        failureCount++;
      }
    }

    // رسالة النتيجة
    if (successCount > 0) {
      toast({
        title: `تم إضافة ${successCount} ملف للسلة`,
        description: failureCount > 0 ? `فشل في إضافة ${failureCount} ملف` : 'جميع الملفات أضيفت بنجاح',
        variant: failureCount > 0 ? 'default' : 'default'
      });
    } else {
      toast({
        title: 'فشل في الإضافة',
        description: 'لم يتم إضافة أي ملف للسلة',
        variant: 'destructive'
      });
    }
  };

  const generatePrintJobFilename = (settings: any, originalName: string) => {
    const paperTypeLabels = {
      'plain': 'ورق عادي',
      'coated': 'ورق كوشيه',
      'glossy': 'ورق جلوسي',
      'sticker': 'ورق لاصق'
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
      
      const printJobs = selectedFiles.map((file, index) => {
        // إيجاد بيانات الرفع الكاملة للملف
        const uploadResult = uploadResults.find(result => result.name === file.name);
        
        return {
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
          pageRange: printSettings.pages,
          // معلومات المعاينة
          previewUrl: uploadResult?.previewUrl,
          fileId: (uploadResult as any)?.fileId,
          provider: uploadResult?.provider
        };
      });

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Upload Area - Takes 2 columns */}
              <div className="md:col-span-2 space-y-6">
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
                      currentCartSize={calculateCurrentCartSize()}
                      maxCartSize={50 * 1024 * 1024}
                    />
                    
                    <UploadStatus 
                      isUploading={isUploading}
                      uploadProgress={uploadProgress}
                      uploadResults={uploadResults}
                      uploadErrors={uploadErrors}
                    />
                  </CardContent>
                </Card>

                {/* Compact Price Guide */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                      <Info className="h-5 w-5 text-accent ml-2" />
                      دليل الطباعة الشامل
                    </h2>
                    
                    <div className="text-center">
                      <PriceGuide compact />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Files Sidebar - Takes 1 column */}
              <div className="md:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="p-0">
                    {/* Files Header */}
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Printer className="h-5 w-5 text-accent" />
                          <h3 className="text-lg font-bold">سلة الملفات ({pendingUploads.length + uploadResults.length})</h3>
                        </div>
                        {(pendingUploads.length > 0 || uploadResults.length > 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFiles}
                            className="text-red-500 hover:text-red-700 border-red-300 hover:border-red-500"
                          >
                            <XIcon className="h-4 w-4 ml-1" />
                            مسح الكل
                          </Button>
                        )}
                      </div>
                      
                      {/* زر الإضافة الجماعية للسلة */}
                      {uploadResults.length > 0 && (
                        <Button
                          onClick={addAllFilesToCart}
                          disabled={addToCartMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-11 text-base"
                        >
                          {addToCartMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                              جاري الإضافة...
                            </>
                          ) : (
                            <>
                              <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m4.5-5h6" />
                              </svg>
                              إضافة كل الملفات للسلة ({uploadResults.length})
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Files List - Now using persistent pending uploads (Amazon-like cart) */}
                    {pendingUploads.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">لا توجد ملفات محفوظة</p>
                        <p className="text-xs">ارفع ملفات لتبدأ الطباعة - ستبقى محفوظة حتى لو غادرت الصفحة</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-4 p-4">
                        {pendingUploads.map((upload: any, index: number) => {
                          const fileName = upload.originalName || upload.filename;
                          // Use settings directly from pending upload (persistent across page reloads)
                          const currentSettings = {
                            copies: upload.copies || 1,
                            colorMode: upload.colorMode || 'grayscale',
                            paperSize: upload.paperSize || 'A4',
                            paperType: upload.paperType || 'plain',
                            doubleSided: upload.doubleSided || false,
                          };

                          // Use expanded state from pending upload (persistent across page reloads)
                          const isExpanded = upload.isExpanded ?? false;

                          return (
                            <Card key={upload.id || index} className="border border-gray-200 hover:border-blue-300 transition-colors">
                              <CardContent className="p-0">
                                {/* Header مع اسم الملف وأزرار التحكم */}
                                <div className="flex items-center justify-between p-3 border-b bg-gray-50 cursor-pointer" onClick={() => togglePendingUploadExpanded(upload.id)}>
                                  <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
                                    <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-sm text-gray-800 truncate">{fileName}</p>
                                      <p className="text-xs text-gray-500">
                                        {(upload.fileSize && upload.fileSize > 0) ? 
                                          `${(upload.fileSize / 1024 / 1024).toFixed(1)} MB` : 
                                          'حجم غير محدد'
                                        }
                                        <span className="ml-2 text-green-600">• محفوظ</span>
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1 space-x-reverse">
                                    {/* زر الطي/الفتح */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        togglePendingUploadExpanded(upload.id);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 flex-shrink-0 border border-blue-200 rounded-md"
                                      title={isExpanded ? "إخفاء إعدادات الطباعة" : "عرض إعدادات الطباعة"}
                                    >
                                      {isExpanded ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                      ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      )}
                                    </Button>
                                    
                                    {/* زر الحذف */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deletePendingUploadMutation.mutate(upload.id);
                                      }}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 flex-shrink-0"
                                    >
                                      <XIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* إعدادات الطباعة - تظهر فقط عند التوسع */}
                                {isExpanded && (
                                <div className="p-4">
                                  {/* الصف الأول: النسخ وحجم الورق */}
                                  <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                      <Label className="text-xs font-medium text-gray-700 mb-1 block">عدد النسخ</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={currentSettings.copies}
                                        onChange={(e) => {
                                          const copies = parseInt(e.target.value) || 1;
                                          updatePendingUploadMutation.mutate({
                                            id: upload.id,
                                            updates: { copies }
                                          });
                                        }}
                                        className="h-9 text-center"
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-xs font-medium text-gray-700 mb-1 block">حجم الورق</Label>
                                      <Select
                                        value={currentSettings.paperSize}
                                        onValueChange={(value: 'A4' | 'A3' | 'A0' | 'A1' | 'A2') => {
                                          updatePendingUploadMutation.mutate({
                                            id: upload.id,
                                            updates: { paperSize: value }
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="h-9">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="A4">A4</SelectItem>
                                          <SelectItem value="A3">A3</SelectItem>
                                          <SelectItem value="A0">A0</SelectItem>
                                          <SelectItem value="A1">A1</SelectItem>
                                          <SelectItem value="A2">A2</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {/* الصف الثاني: نوع الورق ووضع الألوان */}
                                  <div className="grid grid-cols-2 gap-3 mb-4">
                                    {!['A0', 'A1', 'A2'].includes(currentSettings.paperSize) && (
                                      <div>
                                        <Label className="text-xs font-medium text-gray-700 mb-1 block">نوع الورق</Label>
                                        <Select
                                          value={currentSettings.paperType}
                                          onValueChange={(value: 'plain' | 'coated' | 'glossy' | 'sticker') => {
                                            updatePendingUploadMutation.mutate({
                                              id: upload.id,
                                              updates: { paperType: value }
                                            });
                                          }}
                                        >
                                          <SelectTrigger className="h-9">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="plain">
                                              <div className="flex items-center space-x-2 space-x-reverse">
                                                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                                                <span>عادي</span>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="coated">
                                              <div className="flex items-center space-x-2 space-x-reverse">
                                                <div className="w-3 h-3 bg-gradient-to-r from-white to-gray-200 border border-gray-400 rounded shadow-sm"></div>
                                                <span>كوشيه</span>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="glossy">
                                              <div className="flex items-center space-x-2 space-x-reverse">
                                                <div className="w-3 h-3 bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-400 rounded shadow-lg"></div>
                                                <span>جلوسي</span>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="sticker">
                                              <div className="flex items-center space-x-2 space-x-reverse">
                                                <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
                                                <span>لاصق</span>
                                              </div>
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                    
                                    {['A0', 'A1', 'A2'].includes(currentSettings.paperSize) && (
                                      <div className="col-span-2">
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                                          <p className="text-sm text-amber-700 font-medium">
                                            📄 ورق عادي فقط متاح للحجم {currentSettings.paperSize}
                                          </p>
                                          <p className="text-xs text-amber-600 mt-1">
                                            ⏳ باقي أنواع الأوراق متوفرة قريباً
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    <div className={['A0', 'A1', 'A2'].includes(currentSettings.paperSize) ? 'col-span-2' : ''}>
                                      <Label className="text-xs font-medium text-gray-700 mb-1 block">وضع الألوان</Label>
                                      <Select
                                        value={currentSettings.colorMode}
                                        onValueChange={(value: 'grayscale' | 'color') => {
                                          updatePendingUploadMutation.mutate({
                                            id: upload.id,
                                            updates: { colorMode: value }
                                          });
                                        }}
                                        disabled={['A0', 'A1', 'A2'].includes(currentSettings.paperSize)}
                                      >
                                        <SelectTrigger className="h-9">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="grayscale">أبيض وأسود</SelectItem>
                                          <SelectItem value="color">ملون</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      {['A0', 'A1', 'A2'].includes(currentSettings.paperSize) && (
                                        <p className="text-xs text-orange-600 mt-1">
                                          {currentSettings.paperSize} متوفر بالأبيض والأسود فقط
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* طباعة على الوجهين */}
                                  {!['A0', 'A1', 'A2'].includes(currentSettings.paperSize) && (
                                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                                      <Label className="text-sm font-medium text-gray-700">طباعة على الوجهين</Label>
                                      <Switch
                                        checked={currentSettings.doubleSided}
                                        onCheckedChange={(checked) => {
                                          updatePendingUploadMutation.mutate({
                                            id: upload.id,
                                            updates: { doubleSided: checked }
                                          });
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* عرض السعر */}
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-blue-800">تكلفة هذا الملف:</span>
                                      <span className="text-xl font-bold text-blue-600">
                                        {(() => {
                                          // Get actual page count (default to 1 for single-page uploads)
                                          // TODO: Enhance with proper PDF page detection
                                          const pageCount = upload.pageCount || upload.pages || 1;
                                          
                                          // Calculate price for all pages
                                          const pricingForAllPages = calculate_price(
                                            currentSettings.paperSize,
                                            currentSettings.paperType,
                                            currentSettings.doubleSided ? 'face_back' : 'face',
                                            pageCount,
                                            currentSettings.colorMode === 'grayscale'
                                          );
                                          
                                          // Multiply by number of copies
                                          const copiesCost = pricingForAllPages.finalPrice * currentSettings.copies;
                                          
                                          // Apply binding cost per copy (each copy = separate book)
                                          const bindingCost = upload.bookPrinting ? 
                                            (upload.bindingType === 'book' ? 25 : 20) : 0;
                                          
                                          const totalPrice = copiesCost + (bindingCost * currentSettings.copies);
                                          return totalPrice.toFixed(2);
                                        })()} جنيه
                                      </span>
                                    </div>
                                    {currentSettings.colorMode === 'grayscale' && (
                                      <p className="text-xs text-green-700 mt-2 flex items-center">
                                        ✓ خصم 10% للطباعة بالأبيض والأسود
                                      </p>
                                    )}
                                  </div>

                                  {/* خيارات طباعة الكتاب */}
                                  {!['A0', 'A1', 'A2'].includes(currentSettings.paperSize) && (
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                      <div className="flex items-center space-x-2 space-x-reverse mb-3">
                                        <input
                                          id={`book-printing-${upload.id}`}
                                          type="checkbox"
                                          checked={upload.bookPrinting || false}
                                          onChange={(e) => {
                                            const bookPrinting = e.target.checked;
                                            const bindingPrice = bookPrinting ? 
                                              (upload.bindingType === 'book' ? 25 : 20) : 0;
                                            updatePendingUploadMutation.mutate({
                                              id: upload.id,
                                              updates: { 
                                                bookPrinting,
                                                bindingPrice
                                              }
                                            });
                                          }}
                                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                          data-testid={`checkbox-book-printing-${upload.id}`}
                                        />
                                        <Label htmlFor={`book-printing-${upload.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                          📖 طباعة كتاب
                                        </Label>
                                      </div>
                                    
                                    {upload.bookPrinting && (
                                      <div className="grid grid-cols-2 gap-3 pr-6 bg-blue-50 p-3 rounded-md">
                                        <div>
                                          <Label className="text-xs font-medium text-gray-700 mb-1 block">نوع التغليف</Label>
                                          <Select
                                            value={upload.bindingType || 'spiral'}
                                            onValueChange={(value: 'spiral' | 'book') => {
                                              const bindingPrice = value === 'book' ? 25 : 20;
                                              updatePendingUploadMutation.mutate({
                                                id: upload.id,
                                                updates: { 
                                                  bindingType: value,
                                                  bindingPrice
                                                }
                                              });
                                            }}
                                          >
                                            <SelectTrigger className="h-9" data-testid={`select-binding-type-${upload.id}`}>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="spiral">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                  <span>🌀</span>
                                                  <span>تغليف لولبي</span>
                                                  <span className="text-green-600 font-medium">(20 جنيه)</span>
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="book">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                  <span>📘</span>
                                                  <span>تغليف كتاب</span>
                                                  <span className="text-green-600 font-medium">(25 جنيه)</span>
                                                </div>
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div className="flex items-end">
                                          <div className="bg-green-100 border border-green-300 rounded-md px-3 py-2 text-xs w-full text-center">
                                            <span className="text-green-800 font-bold">
                                              التكلفة الإضافية: {upload.bindingPrice || 20} جنيه
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    </div>
                                  )}
                                </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
            <SmartScanComponent onScanComplete={handleSmartScan} />
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
}