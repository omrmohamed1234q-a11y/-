import React, { useState, useRef, useCallback } from 'react'
import { Link } from 'wouter'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CameraIcon, 
  FileImageIcon, 
  UploadIcon,
  ScanIcon,
  SettingsIcon,
  CheckIcon,
  XIcon,
  RotateCcwIcon,
  DownloadIcon,
  ImageIcon,
  PaletteIcon,
  ArrowLeft
} from 'lucide-react'
import { LogoPresets } from '@/components/AnimatedLogo'

type ScanMode = 'color' | 'grayscale' | 'blackwhite'
type ScanStep = 'capture' | 'preview' | 'processing' | 'complete'

interface ScannedDocument {
  id: string
  originalImage: string
  processedImage: string
  mode: ScanMode
  uploadUrl?: string
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

const ImagePreview = ({ 
  src, 
  alt, 
  onRetake, 
  onConfirm, 
  isProcessing 
}: {
  src: string
  alt: string
  onRetake: () => void
  onConfirm: () => void
  isProcessing: boolean
}) => {
  return (
    <div className="space-y-4">
      <div className="relative bg-gray-100 rounded-xl overflow-hidden">
        <img 
          src={src} 
          alt={alt}
          className="w-full h-64 object-contain"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"
            />
          </div>
        )}
      </div>
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onRetake}
          disabled={isProcessing}
          className="flex-1 h-12 border-2 border-gray-200 hover:border-red-300 rounded-xl"
        >
          <RotateCcwIcon className="w-4 h-4 ml-2" />
          إعادة التقاط
        </Button>
        <Button
          onClick={onConfirm}
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
              تأكيد الرفع
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function ScanPage() {
  const [currentStep, setCurrentStep] = useState<ScanStep>('capture')
  const [selectedMode, setSelectedMode] = useState<ScanMode>('color')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [scannedDocuments, setScannedDocuments] = useState<ScannedDocument[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isUsingCamera, setIsUsingCamera] = useState(false)
  const { toast } = useToast()

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('المتصفح لا يدعم الكاميرا')
      }

      // Request camera permissions with fallback options
      let constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      try {
        // Try with back camera first
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        setStream(mediaStream)
        setIsUsingCamera(true)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
        
        toast({
          title: "تم تفعيل الكاميرا",
          description: "يمكنك الآن التقاط الصور",
        })
      } catch (backCameraError) {
        // Fallback to any available camera
        constraints = { video: true }
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        setStream(mediaStream)
        setIsUsingCamera(true)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
        
        toast({
          title: "تم تفعيل الكاميرا",
          description: "استخدام الكاميرا الأمامية",
        })
      }
    } catch (error) {
      console.error('Camera error:', error)
      
      let errorMessage = "لا يمكن الوصول إلى الكاميرا"
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "يرجى السماح بالوصول إلى الكاميرا من إعدادات المتصفح"
        } else if (error.name === 'NotFoundError') {
          errorMessage = "لم يتم العثور على كاميرا على هذا الجهاز"
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "المتصفح لا يدعم استخدام الكاميرا"
        } else if (error.name === 'SecurityError') {
          errorMessage = "لا يمكن الوصول للكاميرا لأسباب أمنية"
        }
      }
      
      toast({
        title: "خطأ في الكاميرا",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [toast])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsUsingCamera(false)
    }
  }, [stream])

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageDataUrl)
        setCurrentStep('preview')
        stopCamera()
      }
    }
  }, [stopCamera])

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCapturedImage(result)
        setCurrentStep('preview')
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Process and upload image
  const processAndUpload = useCallback(async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    setCurrentStep('processing')

    try {
      // Apply scan mode filter to image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      await new Promise((resolve) => {
        img.onload = resolve
        img.src = capturedImage
      })

      canvas.width = img.width
      canvas.height = img.height
      
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        
        // Apply filters based on scan mode
        if (selectedMode === 'grayscale') {
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
        // For 'color' mode, no processing needed
      }

      const processedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9)

      // Convert to blob for Cloudinary upload
      const response = await fetch(processedImageDataUrl)
      const blob = await response.blob()
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' })

      // Create form data for Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
      formData.append('folder', 'scanned-documents')
      
      // Add tags based on scan mode
      const tags = ['scanned-document', selectedMode]
      formData.append('tags', tags.join(','))

      // Upload to Cloudinary
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`
      const uploadResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('فشل في رفع الصورة')
      }

      const uploadResult = await uploadResponse.json()

      // Create scanned document record
      const newDocument: ScannedDocument = {
        id: uploadResult.public_id,
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
        description: "تم رفع المستند على Cloudinary وحفظه في المكتبة",
      })

    } catch (error) {
      toast({
        title: "خطأ في المعالجة",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive",
      })
      setCurrentStep('preview')
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImage, selectedMode, toast])

  // Reset to capture mode
  const resetScan = useCallback(() => {
    setCapturedImage(null)
    setCurrentStep('capture')
    stopCamera()
  }, [stopCamera])

  // Download processed image
  const downloadImage = useCallback((doc: ScannedDocument) => {
    const link = window.document.createElement('a')
    link.href = doc.processedImage
    link.download = `scanned_document_${doc.id}.jpg`
    link.click()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4" />
                <span>العودة</span>
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <ScanIcon className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-800">المسح الضوئي</span>
            </div>
            
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl pt-8 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6 mx-auto w-fit">
            <LogoPresets.Landing />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">المسح الضوئي للمستندات</h1>
          <p className="text-gray-600">امسح مستنداتك بجودة عالية مثل CamScanner</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Scanning Interface */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanIcon className="w-5 h-5 text-red-500" />
                  مسح جديد
                </CardTitle>
                <CardDescription>
                  اختر طريقة المسح ونوع المعالجة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Scan Mode Selector */}
                <ScanModeSelector 
                  selectedMode={selectedMode}
                  onModeChange={setSelectedMode}
                  disabled={currentStep === 'processing' || isUsingCamera}
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
                      {/* Camera View */}
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
                            
                            {/* Camera overlay guide */}
                            <div className="absolute inset-4 border-2 border-white/50 border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                              <div className="text-white/70 text-center text-sm">
                                <ScanIcon className="w-8 h-8 mx-auto mb-2" />
                                <p>ضع المستند داخل الإطار</p>
                              </div>
                            </div>
                            
                            {/* Capture button */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                              <Button
                                onClick={capturePhoto}
                                className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black shadow-xl border-4 border-white/20"
                              >
                                <CameraIcon className="w-6 h-6" />
                              </Button>
                            </div>
                            
                            {/* Close button */}
                            <Button
                              onClick={stopCamera}
                              variant="outline"
                              size="sm"
                              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black border-0"
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                            
                            {/* Camera info */}
                            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                              🔴 Live
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-gray-600 text-sm">
                              تأكد من وضوح النص ووضع المستند بشكل مستقيم
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Camera Instructions */}
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

                      {/* Capture Options */}
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

                      {/* Browser Compatibility Check */}
                      {!navigator.mediaDevices && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-4">
                          <div className="flex items-center gap-2 text-orange-800">
                            <span>⚠️</span>
                            <span className="font-semibold">تنبيه</span>
                          </div>
                          <p className="text-orange-700 text-sm mt-1">
                            المتصفح الحالي لا يدعم الكاميرا. يمكنك استخدام خيار "اختيار من الجهاز" بدلاً من ذلك.
                          </p>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </motion.div>
                  )}

                  {currentStep === 'preview' && capturedImage && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <ImagePreview
                        src={capturedImage}
                        alt="معاينة الصورة الملتقطة"
                        onRetake={resetScan}
                        onConfirm={processAndUpload}
                        isProcessing={isProcessing}
                      />
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
                      <h3 className="text-lg font-semibold mb-2">جاري المعالجة والرفع...</h3>
                      <p className="text-gray-600">يتم تطبيق المرشحات ورفع الملف على Cloudinary</p>
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"
                      >
                        <CheckIcon className="w-8 h-8 text-green-600" />
                      </motion.div>
                      <h3 className="text-lg font-semibold mb-2">تم المسح بنجاح!</h3>
                      <p className="text-gray-600 mb-6">تم رفع المستند وحفظه في المكتبة</p>
                      <Button
                        onClick={resetScan}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl"
                      >
                        مسح مستند جديد
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Scanned Documents Library */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  مكتبة المستندات الممسوحة
                  <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {scannedDocuments.length}
                  </span>
                </CardTitle>
                <CardDescription>
                  جميع المستندات المرفوعة على Cloudinary
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scannedDocuments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>لا توجد مستندات ممسوحة بعد</p>
                    <p className="text-sm">ابدأ بمسح مستندك الأول</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {scannedDocuments.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <img 
                          src={doc.processedImage} 
                          alt="Scanned document"
                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`
                              px-2 py-1 rounded-full text-xs font-medium
                              ${doc.mode === 'color' ? 'bg-rainbow-100 text-rainbow-600' : ''}
                              ${doc.mode === 'grayscale' ? 'bg-gray-100 text-gray-600' : ''}
                              ${doc.mode === 'blackwhite' ? 'bg-black text-white' : ''}
                            `}>
                              {doc.mode === 'color' && 'ملون'}
                              {doc.mode === 'grayscale' && 'رمادي'}
                              {doc.mode === 'blackwhite' && 'أبيض وأسود'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {doc.timestamp.toLocaleString('ar')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadImage(doc)}
                            className="p-2"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </Button>
                          {doc.uploadUrl && (
                            <Button
                              size="sm"
                              onClick={() => window.open(doc.uploadUrl, '_blank')}
                              className="p-2 bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <UploadIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}