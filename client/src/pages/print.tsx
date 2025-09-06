import { useState } from 'react';
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
import { 
  Printer, 
  FileText, 
  Clock, 
  DollarSign, 
  Download,
  Upload,
  Scan,
  Camera,
  ShoppingCart
} from 'lucide-react';
import { DocumentScanner } from '@/components/upload/DocumentScanner';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { DragDropUpload } from '@/components/upload/DragDropUpload';
import { uploadFile, uploadFileToGoogleDrive, validateFile, checkUploadServiceStatus } from '@/lib/upload-service';
import { PDFProcessor } from '@/components/pdf/PDFProcessor';
import { UploadStatus } from '@/components/upload/UploadStatus';
import { PriceGuide } from '@/components/print/PriceGuide';
import { calculate_price, convertLegacySettings } from '@/lib/pricing';

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
          const result = await uploadFileToGoogleDrive(file);
          
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

    // الحصول على امتداد الملف الأصلي
    const fileExtension = originalName.split('.').pop() || '';
    const displayName = `عدد ${settings.copies} ${settings.paperSize} ${paperTypeLabels[settings.paperType as keyof typeof paperTypeLabels]} ${colorModeLabels[settings.colorMode as keyof typeof colorModeLabels]}`;
    
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              رفع الملفات
            </TabsTrigger>
            <TabsTrigger value="pdf-tools" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              أدوات PDF
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              المسح الضوئي
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              الكاميرا
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

          <TabsContent value="scan">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Scan className="h-5 w-5 text-accent ml-2" />
                  المسح الضوئي للمستندات
                </h2>
                <DocumentScanner onScan={handleCameraCapture} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="camera">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Camera className="h-5 w-5 text-accent ml-2" />
                  التصوير بالكاميرا
                </h2>
                <CameraCapture
                  onCapture={handleCameraCapture}
                  allowedTypes={['document', 'image']}
                  maxFileSize={20 * 1024 * 1024}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
}