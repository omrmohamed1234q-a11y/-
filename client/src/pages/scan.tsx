import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'wouter'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CameraIcon, 
  FileImageIcon, 
  CheckIcon,
  XIcon,
  RotateCcwIcon,
  ArrowLeft,
  Download,
  Eye
} from 'lucide-react'

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

export default function ScanPage() {
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

  // ✅ تنظيف الكاميرا عند الخروج من الصفحة
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // ✅ بدء تشغيل الكاميرا مع معالجة أخطاء محسّنة
  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Starting camera...')
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('CAMERA_NOT_SUPPORTED')
      }

      // إيقاف أي كاميرا سابقة
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      // تجربة الكاميرا الخلفية أولاً
      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
        console.log('✅ Back camera activated')
      } catch (backCameraError) {
        // تجربة أي كاميرا متاحة
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
        console.log('✅ Front camera activated')
      }

      setStream(mediaStream)
      setIsUsingCamera(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // انتظار حتى يتم تحميل الفيديو
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Camera video loaded')
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

      // إعادة تعيين حالة الكاميرا
      setIsUsingCamera(false)
      setStream(null)
    }
  }, [stream, toast])

  // ✅ إيقاف الكاميرا
  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...')
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        console.log(`Stopped track: ${track.kind}`)
      })
      setStream(null)
    }
    setIsUsingCamera(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  // ✅ التقاط صورة من الكاميرا
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
      // تعيين حجم الكانفاس
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // رسم الصورة
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // تحويل إلى Data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageDataUrl)
      setCurrentStep('preview')
      stopCamera()
      
      console.log('✅ Photo captured successfully')
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

  // ✅ اختيار ملف من الجهاز
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

  // ✅ معالجة ورفع الصورة
  const processAndUpload = useCallback(async () => {
    if (!capturedImage) {
      toast({
        title: "لا توجد صورة",
        description: "لا توجد صورة للمعالجة",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setIsUploading(true)
    setCurrentStep('processing')

    try {
      console.log('🎨 Processing image...')
      
      // إنشاء كانفاس للمعالجة
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('لا يمكن إنشاء Canvas للمعالجة')
      }

      // تحميل الصورة
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('فشل في تحميل الصورة'))
        img.src = capturedImage
      })

      // تعيين حجم الكانفاس
      canvas.width = img.width
      canvas.height = img.height
      
      // رسم الصورة
      ctx.drawImage(img, 0, 0)
      
      // تطبيق المرشحات حسب النوع المحدد
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

      // تحويل إلى Blob
      const processedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      
      const response = await fetch(processedImageDataUrl)
      const blob = await response.blob()
      const file = new File([blob], `scan_${selectedMode}_${Date.now()}.jpg`, { type: 'image/jpeg' })

      console.log('📤 Uploading to Cloudinary...')

      // رفع إلى Cloudinary مع الحذف التلقائي
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
      formData.append('folder', 'temp-scans')
      formData.append('tags', `temp-scan,${selectedMode},auto-delete-1h`)
      formData.append('transformation', 'c_scale,w_1200,q_auto')

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`
      const uploadResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'فشل في رفع الصورة إلى Cloudinary')
      }

      const uploadResult = await uploadResponse.json()
      console.log('✅ Upload successful:', uploadResult.secure_url)

      // إنشاء سجل المستند
      const newDocument: ScannedDocument = {
        id: uploadResult.public_id || `scan_${Date.now()}`,
        originalImage: capturedImage,
        processedImage: processedImageDataUrl,
        mode: selectedMode,
        uploadUrl: uploadResult.secure_url,
        timestamp: new Date()
      }

      setScannedDocuments(prev => [newDocument, ...prev])
      setCurrentStep('complete')

      toast({
        title: "تم المسح بنجاح!",
        description: "تم مسح المستند ورفعه على Cloudinary (سيُحذف تلقائياً بعد ساعة)",
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
      setIsUploading(false)
    }
  }, [capturedImage, selectedMode, toast])

  // ✅ إعادة تعيين المسح
  const resetScan = useCallback(() => {
    setCapturedImage(null)
    setCurrentStep('capture')
    setIsProcessing(false)
    setIsUploading(false)
    stopCamera()
    
    // مسح input الملف
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [stopCamera])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4" />
                <span>العودة</span>
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-center">مسح المستندات</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              مسح ضوئي ذكي
            </CardTitle>
            <CardDescription className="text-gray-600">
              استخدم الكاميرا أو اختر صورة لمسح المستندات مع معالجة احترافية
              <div className="mt-1 text-sm text-orange-600 font-medium">
                ⏱️ الصور الممسوحة تُحذف تلقائياً بعد ساعة واحدة
              </div>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* اختيار نوع المسح */}
            <ScanModeSelector
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
              disabled={currentStep !== 'capture'}
            />

            <AnimatePresence mode="wait">
              {/* مرحلة التقاط الصورة */}
              {currentStep === 'capture' && (
                <motion.div
                  key="capture"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* عرض الكاميرا */}
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
                        
                        {/* إطار التوجيه */}
                        <div className="absolute inset-4 border-2 border-white/50 border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                          <div className="text-white/70 text-center text-sm">
                            <p>ضع المستند داخل الإطار</p>
                          </div>
                        </div>
                        
                        {/* زر التقاط الصورة */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <Button
                            onClick={capturePhoto}
                            className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black shadow-xl border-4 border-white/20"
                            data-testid="button-capture-photo"
                          >
                            <CameraIcon className="w-6 h-6" />
                          </Button>
                        </div>
                        
                        {/* زر الإغلاق */}
                        <Button
                          onClick={stopCamera}
                          variant="outline"
                          size="sm"
                          className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black border-0"
                        >
                          <XIcon className="w-4 h-4" />
                        </Button>
                        
                        {/* مؤشر البث المباشر */}
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          Live
                        </div>
                      </div>
                    </div>
                  )}

                  {/* الإرشادات */}
                  {!isUsingCamera && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <h3 className="font-semibold text-blue-800 mb-2">إرشادات الاستخدام:</h3>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• تأكد من السماح بالوصول للكاميرا عند الطلب</li>
                        <li>• استخدم إضاءة جيدة للحصول على أفضل النتائج</li>
                        <li>• ضع المستند على سطح مستوٍ</li>
                        <li>• اختر نوع المسح المناسب (ملون/رمادي/أبيض وأسود)</li>
                      </ul>
                    </div>
                  )}

                  {/* خيارات التقاط الصورة */}
                  {!isUsingCamera && (
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={startCamera}
                        className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex-col transition-all duration-200"
                        data-testid="button-start-camera"
                      >
                        <CameraIcon className="w-8 h-8 mb-2" />
                        <span>استخدام الكاميرا</span>
                      </Button>
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="h-24 border-2 border-gray-200 hover:border-gray-300 rounded-xl flex-col transition-all duration-200"
                        data-testid="button-select-file"
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

              {/* مرحلة معاينة الصورة */}
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
                      disabled={isProcessing || isUploading}
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
                          تأكيد الرفع
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* مرحلة المعالجة */}
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
                  <h3 className="text-lg font-semibold mb-2">جاري المعالجة والرفع...</h3>
                  <p className="text-gray-600">يتم تطبيق المرشحات ورفع الملف على Cloudinary (مؤقت - ساعة واحدة)</p>
                </motion.div>
              )}

              {/* مرحلة الاكتمال */}
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
                  <h3 className="text-lg font-semibold mb-2">تم المسح بنجاح!</h3>
                  <p className="text-gray-600 mb-4">تم معالجة المستند ورفعه بنجاح</p>
                  
                  <Button
                    onClick={resetScan}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                  >
                    مسح مستند جديد
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* عرض المستندات الممسوحة */}
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
                          onClick={() => window.open(doc.uploadUrl, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = doc.uploadUrl
                            link.download = `scan_${doc.mode}_${doc.timestamp.getTime()}.jpg`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}