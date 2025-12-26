/**
 * Advanced Smart Scanner Component
 * مكون المسح الذكي المتقدم
 * 
 * ميزات:
 * - اكتشاف حواف المستند تلقائياً
 * - تصحيح المنظور
 * - فلاتر ذكية متعددة
 * - دعم مسح عدة صفحات
 * - تصدير كـ PDF
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    Camera,
    FileImage,
    Check,
    X,
    RotateCcw,
    Download,
    FileText,
    Plus,
    Trash2,
    Eye,
    Sparkles,
    ScanLine,
    Palette,
    GripVertical,
    Crop,
    ChevronUp,
    ChevronDown,
    Printer,
} from 'lucide-react';

import {
    applyFilter,
    enhanceForPrinting,
    dataUrlToCanvas,
    canvasToDataUrl,
    createThumbnail,
    generateId,
    cropImage,
    type FilterType,
    type ScannedPage,
} from '@/lib/document-scanner';

import {
    createAndSavePDF,
    createPDFBytes,
    estimatePDFSize,
} from '@/lib/pdf-export';

// الفلاتر المتاحة
const FILTERS: { id: FilterType; label: string; description: string }[] = [
    { id: 'original', label: 'أصلي', description: 'بدون تعديل' },
    { id: 'document', label: 'مستند', description: 'مثالي للنصوص' },
    { id: 'grayscale', label: 'رمادي', description: 'تدرج رمادي' },
    { id: 'blackwhite', label: 'أبيض وأسود', description: 'نص واضح' },
    { id: 'magic', label: 'تحسين تلقائي', description: 'تحسين الجودة' },
];

type ScanStep = 'capture' | 'filter' | 'pages';

interface AdvancedSmartScannerProps {
    onScanComplete: (files: File[]) => void;
}

export default function AdvancedSmartScanner({ onScanComplete }: AdvancedSmartScannerProps) {
    // الحالات الأساسية
    const [currentStep, setCurrentStep] = useState<ScanStep>('capture');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('document');
    const [isProcessing, setIsProcessing] = useState(false);

    // الكاميرا
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isUsingCamera, setIsUsingCamera] = useState(false);

    // الصفحات المتعددة
    const [pages, setPages] = useState<ScannedPage[]>([]);
    const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);

    // Manual Crop - Full Drag
    const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [cropBox, setCropBox] = useState({ left: 10, top: 10, width: 80, height: 80 }); // percentages
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
    const cropCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // المعاينة
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // المراجع
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { toast } = useToast();

    // Track if component has been mounted and restored
    const hasRestoredRef = useRef(false);

    // حفظ الصفحات في localStorage تلقائياً
    useEffect(() => {
        // Don't save on initial mount before restoration
        if (!hasRestoredRef.current) {
            return;
        }

        if (pages.length > 0) {
            try {
                localStorage.setItem('scanner_pages', JSON.stringify(pages));
                console.log(`💾 Saved ${pages.length} pages to localStorage`);
            } catch (error) {
                console.error('❌ Failed to save pages to localStorage:', error);
            }
        } else {
            // Only clear if we've already restored (not on initial mount)
            console.log('🗑️ Clearing localStorage (no pages)');
            localStorage.removeItem('scanner_pages');
        }
    }, [pages]);

    // استعادة الصفحات من localStorage عند التحميل
    useEffect(() => {
        console.log('🔄 Scanner component mounted - checking localStorage...');
        try {
            const saved = localStorage.getItem('scanner_pages');
            console.log('📦 localStorage data:', saved ? `Found ${saved.length} chars` : 'Empty');

            if (saved) {
                const savedPages = JSON.parse(saved);
                console.log('📄 Parsed pages:', savedPages.length, 'pages');

                if (Array.isArray(savedPages) && savedPages.length > 0) {
                    console.log('✅ Restoring pages to state...');
                    setPages(savedPages);
                    setCurrentStep('pages');
                    console.log(`✅ Restored ${savedPages.length} pages from localStorage`);

                    // Show toast after a small delay to ensure it's visible
                    setTimeout(() => {
                        toast({
                            title: 'تم استعادة الصفحات',
                            description: `تم استعادة ${savedPages.length} صفحة محفوظة`,
                        });
                    }, 100);
                } else {
                    console.log('⚠️ Saved data is not a valid array or is empty');
                }
            } else {
                console.log('ℹ️ No saved pages found in localStorage');
            }
        } catch (error) {
            console.error('❌ Failed to restore pages from localStorage:', error);
            localStorage.removeItem('scanner_pages');
        } finally {
            // Mark that we've completed the restoration attempt
            hasRestoredRef.current = true;
            console.log('✅ Restoration check complete');
        }
    }, [toast]); // Include toast in dependencies

    // تنظيف الكاميرا عند الخروج
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // تحميل الصورة على canvas عند فتح محرر القص
    useEffect(() => {
        if (editingPageIndex !== null && cropCanvasRef.current) {
            const page = pages[editingPageIndex];
            console.log('🎨 useEffect: Loading image for crop editor');

            dataUrlToCanvas(page.image).then(canvas => {
                if (cropCanvasRef.current) {
                    cropCanvasRef.current.width = canvas.width;
                    cropCanvasRef.current.height = canvas.height;
                    const ctx = cropCanvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(canvas, 0, 0);
                        console.log('✅ useEffect: Image drawn successfully');
                    }

                    // تعيين منطقة القص الافتراضية
                    setCropArea({
                        x: 0,
                        y: 0,
                        width: canvas.width,
                        height: canvas.height
                    });
                }
            }).catch(error => {
                console.error('❌ useEffect: Error loading image:', error);
            });
        }
    }, [editingPageIndex, pages]);

    // ===== وظائف الكاميرا =====

    const startCamera = useCallback(async () => {
        try {
            console.log('📸 Starting camera...');

            // Stop existing stream if any
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported in this browser');
            }

            let mediaStream: MediaStream;

            // Try back camera first (mobile)
            try {
                console.log('📱 Trying back camera...');
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });
                console.log('✅ Back camera activated');
            } catch (backCameraError) {
                console.log('⚠️ Back camera failed, trying any camera...');
                // Fallback to any available camera
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });
                console.log('✅ Front camera activated');
            }

            setStream(mediaStream);
            setIsUsingCamera(true);

            // Set video source and play
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;

                // Wait for video to be ready and play it
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current?.play();
                        console.log('▶️ Video playing');

                        toast({
                            title: 'تم تفعيل الكاميرا',
                            description: 'وجه الكاميرا نحو المستند',
                        });
                    } catch (playError) {
                        console.error('Play error:', playError);
                    }
                };
            }

        } catch (error: any) {
            console.error('❌ Camera error:', error);

            let errorMessage = 'لا يمكن الوصول للكاميرا';

            if (error?.name === 'NotAllowedError') {
                errorMessage = 'يرجى السماح بالوصول للكاميرا من إعدادات المتصفح';
            } else if (error?.name === 'NotFoundError') {
                errorMessage = 'لم يتم العثور على كاميرا';
            } else if (error?.name === 'NotReadableError') {
                errorMessage = 'الكاميرا قيد الاستخدام من تطبيق آخر';
            }

            toast({
                title: 'خطأ في الكاميرا',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    }, [stream, toast]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsUsingCamera(false);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageDataUrl);
        stopCamera();

        // الانتقال لمرحلة اكتشاف الحواف
        processImageForCropping(imageDataUrl);
    }, [stopCamera]);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: 'نوع ملف غير مدعوم',
                description: 'يرجى اختيار صورة',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);

        try {
            // قراءة الملف
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target?.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            setCapturedImage(dataUrl);

            // تطبيق الفلتر الافتراضي
            const canvas = await dataUrlToCanvas(dataUrl);
            const filteredCanvas = applyFilter(canvas, selectedFilter);
            const processedImage = canvasToDataUrl(filteredCanvas, 0.85);
            setProcessedImage(processedImage);

            // الانتقال لمرحلة الفلتر
            setCurrentStep('filter');

            toast({
                title: 'تم تحضير الصورة',
                description: 'اختر الفلتر المناسب وأضف للمستند',
            });
        } catch (error) {
            console.error('File processing error:', error);
            toast({
                title: 'خطأ في المعالجة',
                description: 'فشل في معالجة الصورة',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [toast, selectedFilter]);

    // ===== معالجة الصورة =====

    const processImageForCropping = useCallback(async (imageDataUrl: string) => {
        setIsProcessing(true);

        try {
            // تحويل الصورة لكانفاس وتطبيق الفلتر الافتراضي مباشرة
            let canvas = await dataUrlToCanvas(imageDataUrl);
            canvas = applyFilter(canvas, selectedFilter);

            const processedDataUrl = canvasToDataUrl(canvas, 0.85);
            setProcessedImage(processedDataUrl);
            setCurrentStep('filter');

            toast({
                title: 'تم تحضير الصورة',
                description: 'اختر الفلتر المناسب وأضف للمستند',
            });
        } catch (error) {
            console.error('Processing error:', error);
            // في حالة الخطأ، استخدم الصورة الأصلية
            setProcessedImage(imageDataUrl);
            setCurrentStep('filter');
        } finally {
            setIsProcessing(false);
        }
    }, [toast, selectedFilter]);


    // ===== إدارة الصفحات =====

    const addCurrentPageToList = useCallback(async () => {
        if (!processedImage) return;

        const canvas = await dataUrlToCanvas(processedImage);
        const thumbnail = canvasToDataUrl(createThumbnail(canvas, 100), 0.6);

        const newPage: ScannedPage = {
            id: generateId(),
            image: processedImage,
            thumbnail,
            filter: selectedFilter,
            timestamp: new Date(),
        };

        setPages(prev => [...prev, newPage]);
        resetForNewScan();
        setCurrentStep('pages');

        toast({
            title: 'تمت الإضافة',
            description: `الصفحة ${pages.length + 1} أضيفت للمستند`,
        });
    }, [processedImage, selectedFilter, pages.length, toast]);

    const removePage = useCallback((pageId: string) => {
        setPages(prev => prev.filter(p => p.id !== pageId));
        toast({
            title: 'تم حذف الصفحة',
        });
    }, [toast]);

    const movePage = useCallback((fromIndex: number, toIndex: number) => {
        setPages(prev => {
            const newPages = [...prev];
            const [removed] = newPages.splice(fromIndex, 1);
            newPages.splice(toIndex, 0, removed);
            return newPages;
        });
    }, []);

    // ===== التصدير =====

    const exportAsPDF = useCallback(async () => {
        if (pages.length === 0) {
            toast({
                title: 'لا توجد صفحات',
                description: 'أضف صفحة واحدة على الأقل',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);

        try {
            console.log('=== PDF Export Debug ===');
            console.log('Pages count:', pages.length);
            console.log('Pages:', pages.map(p => ({ id: p.id, filter: p.filter })));

            const images = pages.map(p => p.image);
            console.log('Images array length:', images.length);
            console.log('Images array:', images.map((img, idx) => `Image ${idx + 1}: ${img.substring(0, 50)}...`));

            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `Itbaaly_Document_${dateStr}.pdf`;

            await createAndSavePDF(images, filename, {
                pageSize: 'a4',
                title: `مستند اطبعلي - ${new Date().toLocaleDateString('ar-EG')}`,
            });

            toast({
                title: 'تم التصدير',
                description: `تم تصدير ${pages.length} صفحة كـ PDF`,
            });
        } catch (error) {
            console.error('PDF export error:', error);
            toast({
                title: 'خطأ في التصدير',
                description: 'فشل في إنشاء PDF',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    }, [pages, toast]);

    // إضافة للطباعة - تحويل الصفحات إلى PDF وإرسالها للطباعة
    const addToPrint = useCallback(async () => {
        if (pages.length === 0) {
            toast({
                title: 'لا توجد صفحات',
                description: 'أضف صفحة واحدة على الأقل',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);

        try {
            console.log('=== Adding to Print ===');
            console.log('Pages count:', pages.length);

            const images = pages.map(p => p.image);

            // إنشاء PDF bytes
            const pdfBytes = await createPDFBytes(images, {
                pageSize: 'a4',
                title: `مستند اطبعلي - ${new Date().toLocaleDateString('ar-EG')}`,
            });

            // تحويل إلى File object
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `Scanned_Document_${dateStr}.pdf`;
            const pdfFile = new File([pdfBytes as any], filename, { type: 'application/pdf' });

            console.log(`✅ PDF File created: ${filename}, ${(pdfFile.size / 1024).toFixed(1)} KB`);

            // إرسال للطباعة عبر callback
            onScanComplete([pdfFile]);

            // مسح localStorage والصفحات بعد الرفع الناجح
            localStorage.removeItem('scanner_pages');
            setPages([]);
            setCurrentStep('capture');
            console.log('🗑️ Cleared scanner state after successful upload');

            toast({
                title: 'تم الإضافة للطباعة',
                description: `تم إضافة ${pages.length} صفحة - يمكنك الآن تعديل الإعدادات`,
            });
        } catch (error) {
            console.error('Add to print error:', error);
            toast({
                title: 'خطأ',
                description: 'فشل في إضافة المستند للطباعة',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    }, [pages, onScanComplete, toast]);

    const addPagesToQueue = useCallback(async () => {
        if (pages.length === 0) return;

        try {
            const files: File[] = [];

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const response = await fetch(page.image);
                const blob = await response.blob();
                const file = new File([blob], `scan_page_${i + 1}.jpg`, { type: 'image/jpeg' });
                files.push(file);
            }

            onScanComplete(files);

            toast({
                title: 'تمت الإضافة للطباعة',
                description: `تم إضافة ${files.length} صورة`,
            });

            // إعادة تعيين
            setPages([]);
            setCurrentStep('capture');
        } catch (error) {
            console.error('Error adding to queue:', error);
            toast({
                title: 'خطأ',
                description: 'فشل في إضافة الصور',
                variant: 'destructive',
            });
        }
    }, [pages, onScanComplete, toast]);

    // ===== Manual Crop =====

    const startEditPage = useCallback((index: number) => {
        console.log('🔍 Starting edit for page:', index);
        setEditingPageIndex(index);

        // تعيين cropArea مبدئي عشان الـ modal يظهر
        // الـ useEffect هيحدثه بالقيم الصحيحة
        setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    }, []);

    const cancelCrop = useCallback(() => {
        setEditingPageIndex(null);
        setCropArea(null);
        setCropBox({ left: 10, top: 10, width: 80, height: 80 });
        setIsDragging(false);
        setIsResizing(null);
    }, []);

    const applyCrop = useCallback(async () => {
        if (editingPageIndex === null || !cropCanvasRef.current || !imageContainerRef.current) return;

        try {
            setIsProcessing(true);

            const canvas = cropCanvasRef.current;

            // Convert percentage cropBox to pixel coordinates
            const cropX = (cropBox.left / 100) * canvas.width;
            const cropY = (cropBox.top / 100) * canvas.height;
            const cropWidth = (cropBox.width / 100) * canvas.width;
            const cropHeight = (cropBox.height / 100) * canvas.height;

            console.log('Cropping:', { cropX, cropY, cropWidth, cropHeight });

            // قص الصورة
            const croppedCanvas = cropImage(
                canvas,
                Math.round(cropX),
                Math.round(cropY),
                Math.round(cropWidth),
                Math.round(cropHeight)
            );

            // تحويل لـ data URL
            const croppedImage = canvasToDataUrl(croppedCanvas, 0.85);
            const thumbnail = canvasToDataUrl(createThumbnail(croppedCanvas, 100), 0.6);

            console.log('🔪 Crop applied - Image size:', croppedImage.length, 'bytes');
            console.log('🔪 Cropped image preview:', croppedImage.substring(0, 100));

            // تحديث الصفحة
            setPages(prev => prev.map((page, idx) =>
                idx === editingPageIndex
                    ? { ...page, image: croppedImage, thumbnail }
                    : page
            ));

            toast({
                title: 'تم القص',
                description: 'تم تحديث الصورة',
            });

            // إغلاق محرر القص
            cancelCrop();
        } catch (error) {
            console.error('Crop error:', error);
            toast({
                title: 'خطأ في القص',
                description: 'فشل في قص الصورة',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    }, [editingPageIndex, cropBox, toast, cancelCrop]);

    // ===== Drag Handlers =====

    const handleCropBoxMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setIsDragging(true);
        setDragStart({ x: clientX, y: clientY });
    }, []);

    const handleCornerMouseDown = useCallback((corner: 'tl' | 'tr' | 'bl' | 'br', e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setIsResizing(corner);
        setDragStart({ x: clientX, y: clientY });
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragStart || !imageContainerRef.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const container = imageContainerRef.current;
        const rect = container.getBoundingClientRect();

        const deltaX = ((clientX - dragStart.x) / rect.width) * 100;
        const deltaY = ((clientY - dragStart.y) / rect.height) * 100;

        if (isDragging) {
            // Move the crop box
            setCropBox(prev => ({
                ...prev,
                left: Math.max(0, Math.min(100 - prev.width, prev.left + deltaX)),
                top: Math.max(0, Math.min(100 - prev.height, prev.top + deltaY))
            }));
        } else if (isResizing) {
            // Resize from corner
            setCropBox(prev => {
                let newBox = { ...prev };

                switch (isResizing) {
                    case 'tl': // Top-left
                        newBox.width = Math.max(10, prev.width - deltaX);
                        newBox.height = Math.max(10, prev.height - deltaY);
                        newBox.left = Math.max(0, prev.left + deltaX);
                        newBox.top = Math.max(0, prev.top + deltaY);
                        break;
                    case 'tr': // Top-right
                        newBox.width = Math.max(10, Math.min(100 - prev.left, prev.width + deltaX));
                        newBox.height = Math.max(10, prev.height - deltaY);
                        newBox.top = Math.max(0, prev.top + deltaY);
                        break;
                    case 'bl': // Bottom-left
                        newBox.width = Math.max(10, prev.width - deltaX);
                        newBox.height = Math.max(10, Math.min(100 - prev.top, prev.height + deltaY));
                        newBox.left = Math.max(0, prev.left + deltaX);
                        break;
                    case 'br': // Bottom-right
                        newBox.width = Math.max(10, Math.min(100 - prev.left, prev.width + deltaX));
                        newBox.height = Math.max(10, Math.min(100 - prev.top, prev.height + deltaY));
                        break;
                }

                return newBox;
            });
        }

        setDragStart({ x: clientX, y: clientY });
    }, [dragStart, isDragging, isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(null);
        setDragStart(null);
    }, []);

    // Add/remove event listeners
    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('touchmove', handleMouseMove);
                window.removeEventListener('touchend', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    // ===== إعادة التعيين =====

    const resetForNewScan = useCallback(() => {
        setCapturedImage(null);
        setProcessedImage(null);
        setCurrentStep('capture');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const resetAll = useCallback(() => {
        resetForNewScan();
        setPages([]);
        stopCamera();
    }, [resetForNewScan, stopCamera]);

    // ===== العرض =====

    return (
        <Card className="bg-white border shadow-lg">
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-2">
                    <ScanLine className="h-6 w-6" />
                    ماسح المستندات
                </CardTitle>
                <p className="text-gray-600 text-sm">
                    امسح مستنداتك بجودة عالية وصدّرها كـ PDF
                </p>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* شريط التقدم */}
                <div className="flex justify-center gap-3 mb-4">
                    {(['capture', 'filter', 'pages'] as ScanStep[]).map((step, index) => (
                        <div
                            key={step}
                            className={`flex items-center gap-2 ${currentStep === step
                                ? 'text-blue-600'
                                : ['capture', 'filter', 'pages'].indexOf(currentStep) > index
                                    ? 'text-green-500'
                                    : 'text-gray-300'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${currentStep === step
                                ? 'bg-blue-600 text-white border-blue-600'
                                : ['capture', 'filter', 'pages'].indexOf(currentStep) > index
                                    ? 'bg-green-500 text-white border-green-500'
                                    : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}>
                                {index + 1}
                            </div>
                            {index < 2 && <div className={`w-8 h-0.5 ${['capture', 'filter', 'pages'].indexOf(currentStep) > index
                                ? 'bg-green-500'
                                : 'bg-gray-200'
                                }`} />}
                        </div>
                    ))}
                </div>

                {/* ===== مرحلة الالتقاط ===== */}
                {currentStep === 'capture' && (
                    <div className="space-y-4">
                        {isUsingCamera ? (
                            <div className="relative bg-black rounded-xl overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-64 object-cover"
                                />

                                {/* إطار التوجيه */}
                                <div className="absolute inset-8 border-2 border-white/60 border-dashed rounded-lg pointer-events-none">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                                </div>

                                {/* زر الالتقاط */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                    <Button
                                        onClick={capturePhoto}
                                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black shadow-xl"
                                    >
                                        <Camera className="w-6 h-6" />
                                    </Button>
                                </div>

                                {/* زر الإغلاق */}
                                <Button
                                    onClick={stopCamera}
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                                >
                                    <X className="w-4 h-4" />
                                </Button>

                                {/* مؤشر البث */}
                                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    Live
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* عرض الصفحات الحالية إن وجدت */}
                                {pages.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                        <p className="text-blue-700 text-sm text-center">
                                            لديك {pages.length} صفحة في المستند
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        onClick={startCamera}
                                        className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex flex-col gap-2"
                                    >
                                        <Camera className="w-8 h-8" />
                                        <span>استخدام الكاميرا</span>
                                    </Button>

                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        variant="outline"
                                        className="h-24 border-2 border-gray-200 hover:border-gray-300 rounded-xl flex flex-col gap-2"
                                    >
                                        <FileImage className="w-8 h-8 text-gray-600" />
                                        <span>اختيار من الجهاز</span>
                                    </Button>
                                </div>
                            </>
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

                {/* ===== مرحلة اختيار الفلتر ===== */}
                {currentStep === 'filter' && processedImage && (
                    <div className="space-y-4">
                        <div className="text-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">🎨 اختر الفلتر</h3>
                        </div>

                        {/* عرض الصورة المعالجة */}
                        <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                            <img
                                src={processedImage}
                                alt="معاينة"
                                className="w-full h-48 object-contain"
                            />
                        </div>

                        {/* اختيار الفلتر */}
                        <div className="grid grid-cols-5 gap-2">
                            {FILTERS.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={async () => {
                                        setSelectedFilter(filter.id);
                                        // إعادة تطبيق الفلتر
                                        if (capturedImage) {
                                            setIsProcessing(true);
                                            try {
                                                let canvas = await dataUrlToCanvas(capturedImage);
                                                canvas = applyFilter(canvas, filter.id);
                                                setProcessedImage(canvasToDataUrl(canvas, 0.85));
                                            } finally {
                                                setIsProcessing(false);
                                            }
                                        }
                                    }}
                                    className={`p-2 rounded-lg border-2 transition-all ${selectedFilter === filter.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-sm font-medium">{filter.label}</div>
                                    <div className="text-xs text-gray-500">{filter.description}</div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={resetForNewScan}
                                className="flex-1"
                            >
                                <RotateCcw className="w-4 h-4 ml-2" />
                                صورة جديدة
                            </Button>
                            <Button
                                onClick={addCurrentPageToList}
                                disabled={isProcessing}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Plus className="w-4 h-4 ml-2" />
                                إضافة للمستند
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== مرحلة إدارة الصفحات ===== */}
                {currentStep === 'pages' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                                الصفحات ({pages.length})
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStep('capture')}
                            >
                                <Plus className="w-4 h-4 ml-1" />
                                إضافة صفحة
                            </Button>
                        </div>

                        {pages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>لا توجد صفحات</p>
                                <Button
                                    onClick={() => setCurrentStep('capture')}
                                    className="mt-4"
                                    variant="outline"
                                >
                                    ابدأ المسح
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* قائمة الصفحات */}
                                <div className="grid grid-cols-3 gap-3">
                                    {pages.map((page, index) => (
                                        <div
                                            key={page.id}
                                            className="relative group bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <img
                                                src={page.thumbnail}
                                                alt={`صفحة ${index + 1}`}
                                                className="w-full h-24 object-cover cursor-pointer"
                                                onClick={() => setPreviewImage(page.image)}
                                            />

                                            {/* رقم الصفحة */}
                                            <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                                                {index + 1}
                                            </div>

                                            {/* أزرار التحكم */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                {/* Up arrow */}
                                                {index > 0 && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-white hover:bg-white/20 p-1 h-auto"
                                                        onClick={() => movePage(index, index - 1)}
                                                        title="تحريك لأعلى"
                                                    >
                                                        <ChevronUp className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {/* Down arrow */}
                                                {index < pages.length - 1 && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-white hover:bg-white/20 p-1 h-auto"
                                                        onClick={() => movePage(index, index + 1)}
                                                        title="تحريك لأسفل"
                                                    >
                                                        <ChevronDown className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-white hover:bg-white/20 p-1 h-auto"
                                                    onClick={() => setPreviewImage(page.image)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-white hover:bg-white/20 p-1 h-auto"
                                                    onClick={() => startEditPage(index)}
                                                >
                                                    <Crop className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-400 hover:bg-red-500/20 p-1 h-auto"
                                                    onClick={() => removePage(page.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* أزرار التصدير */}
                                <div className="pt-4 border-t space-y-3">
                                    <div className="text-sm text-gray-500 text-center">
                                        حجم PDF التقريبي: {estimatePDFSize(pages.length).toFixed(1)} MB
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            onClick={exportAsPDF}
                                            disabled={isProcessing}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <FileText className="w-4 h-4 ml-2" />
                                            تصدير PDF
                                        </Button>
                                        <Button
                                            onClick={addToPrint}
                                            disabled={isProcessing}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Printer className="w-4 h-4 ml-2" />
                                            إضافة للطباعة
                                        </Button>
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={resetAll}
                                        className="w-full text-red-500 hover:text-red-600 hover:border-red-300"
                                    >
                                        <Trash2 className="w-4 h-4 ml-2" />
                                        مسح الكل
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* نافذة المعاينة */}
                {previewImage && (
                    <div
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 cursor-pointer"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                            <Button
                                onClick={() => setPreviewImage(null)}
                                className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 text-white"
                                size="sm"
                            >
                                <X className="w-4 h-4 ml-1" />
                                إغلاق
                            </Button>
                            <img
                                src={previewImage}
                                alt="معاينة الصورة"
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            />
                        </div>
                    </div>
                )}

                {/* نافذة القص اليدوي - Mobile Friendly */}
                {editingPageIndex !== null && cropArea && (
                    <div className="fixed inset-0 bg-black z-50 flex flex-col">
                        {/* Header */}
                        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
                            <Button
                                onClick={cancelCrop}
                                variant="ghost"
                                size="sm"
                                className="text-white"
                            >
                                <X className="w-5 h-5 ml-2" />
                                إلغاء
                            </Button>
                            <h3 className="text-lg font-semibold">قص الصورة</h3>
                            <Button
                                onClick={applyCrop}
                                disabled={isProcessing}
                                variant="ghost"
                                size="sm"
                                className="text-blue-400"
                            >
                                <Check className="w-5 h-5 ml-2" />
                                {isProcessing ? 'جاري...' : 'تم'}
                            </Button>
                        </div>

                        {/* Crop Area */}
                        <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                            {/* Hidden canvas for processing */}
                            <canvas
                                ref={cropCanvasRef}
                                className="hidden"
                            />

                            {/* Display image with crop overlay */}
                            {pages[editingPageIndex] && (
                                <div
                                    ref={imageContainerRef}
                                    className="relative max-w-full max-h-full"
                                >
                                    <img
                                        src={pages[editingPageIndex].image}
                                        alt="Crop preview"
                                        className="max-w-full max-h-[calc(100vh-120px)] object-contain"
                                        style={{ opacity: 0.5 }}
                                    />

                                    {/* Crop overlay - draggable */}
                                    <div
                                        className="absolute border-2 border-white cursor-move"
                                        style={{
                                            left: `${cropBox.left}%`,
                                            top: `${cropBox.top}%`,
                                            width: `${cropBox.width}%`,
                                            height: `${cropBox.height}%`,
                                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                                        }}
                                        onMouseDown={handleCropBoxMouseDown}
                                        onTouchStart={handleCropBoxMouseDown}
                                    >
                                        {/* Corner handles */}
                                        <div
                                            className="absolute -top-2 -left-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize"
                                            onMouseDown={(e) => handleCornerMouseDown('tl', e)}
                                            onTouchStart={(e) => handleCornerMouseDown('tl', e)}
                                        ></div>
                                        <div
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize"
                                            onMouseDown={(e) => handleCornerMouseDown('tr', e)}
                                            onTouchStart={(e) => handleCornerMouseDown('tr', e)}
                                        ></div>
                                        <div
                                            className="absolute -bottom-2 -left-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize"
                                            onMouseDown={(e) => handleCornerMouseDown('bl', e)}
                                            onTouchStart={(e) => handleCornerMouseDown('bl', e)}
                                        ></div>
                                        <div
                                            className="absolute -bottom-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize"
                                            onMouseDown={(e) => handleCornerMouseDown('br', e)}
                                            onTouchStart={(e) => handleCornerMouseDown('br', e)}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="bg-gray-900 text-white p-3 text-center text-sm">
                            <p>اسحب الحواف لتحديد المنطقة المطلوبة</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
