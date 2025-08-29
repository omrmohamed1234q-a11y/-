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
import { uploadFile, validateFile, checkUploadServiceStatus } from '@/lib/upload-service';
import { PDFProcessor } from '@/components/pdf/PDFProcessor';
import { UploadStatus } from '@/components/upload/UploadStatus';

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
    doubleSided: false,
    pages: 'all',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<Array<{
    name: string;
    url: string;
    provider?: 'cloudinary' | 'firebase';
    previewUrl?: string;
  }>>([]);
  const [uploadErrors, setUploadErrors] = useState<Array<{
    name: string;
    error: string;
  }>>([]);

  // Mutation to add print jobs to cart
  const addToCartMutation = useMutation({
    mutationFn: async (printJobData: any) => {
      return await apiRequest('POST', '/api/cart/print-job', printJobData);
    },
    onSuccess: () => {
      // Invalidate cart queries to refresh the cart
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'تمت إضافة المهمة للسلة',
        description: 'تم إضافة ملفاتك للطباعة إلى السلة بنجاح',
      });
    },
    onError: (error) => {
      console.error('Error adding to cart:', error);
      toast({
        title: 'خطأ في إضافة المهمة',
        description: 'فشل في إضافة ملفات الطباعة للسلة',
        variant: 'destructive'
      });
    }
  });

  // Enhanced upload handler using hybrid upload service
  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadResults([]);
    setUploadErrors([]);
    
    const uploadedFiles: string[] = [];
    const results: typeof uploadResults = [];
    const errors: typeof uploadErrors = [];

    try {
      console.log(`📤 Starting upload of ${files.length} files...`);
      
      // Check upload service status first
      const serviceStatus = await checkUploadServiceStatus();
      console.log('Upload service status:', serviceStatus);

      for (const file of files) {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          errors.push({
            name: file.name,
            error: validation.error || 'ملف غير صالح'
          });
          
          toast({
            title: 'ملف غير صالح',
            description: validation.error,
            variant: 'destructive'
          });
          continue;
        }

        // Upload using hybrid service
        const result = await uploadFile(file);
        
        if (result.success && result.url) {
          uploadedFiles.push(result.url);
          results.push({
            name: file.name,
            url: result.url,
            provider: result.provider,
            previewUrl: result.previewUrl
          });

          // Server automatically tracks uploads via the upload service

          toast({
            title: 'تم رفع الملف بنجاح ☁️',
            description: `${file.name} - تم الرفع إلى التخزين السحابي`,
          });
        } else {
          errors.push({
            name: file.name,
            error: result.error || 'فشل في الرفع'
          });
          
          console.error('Upload failed for file:', file.name, result.error);
          toast({
            title: 'فشل في رفع الملف',
            description: `${file.name}: ${result.error}`,
            variant: 'destructive'
          });
        }
      }

      // Update state with results
      setSelectedFiles(files);
      setUploadedUrls(uploadedFiles);
      setUploadResults(results);
      setUploadErrors(errors);
      
      if (uploadedFiles.length > 0) {
        console.log(`✅ Successfully uploaded ${uploadedFiles.length}/${files.length} files`);
        console.log('Upload results:', results);
      }

    } catch (error) {
      console.error('Upload process error:', error);
      toast({
        title: 'خطأ في عملية الرفع',
        description: error instanceof Error ? error.message : 'خطأ غير معروف',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragDropUpload = (files: File[], urls: string[]) => {
    // For backward compatibility, but use new upload handler
    handleFileUpload(files);
  };

  const handleCameraCapture = async (file: File, downloadUrl: string) => {
    setSelectedFiles([file]);
    setUploadedUrls([downloadUrl]);
    console.log('File captured:', file.name, 'URL:', downloadUrl);
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

    setIsUploading(true);
    
    try {
      console.log('Adding print jobs to cart:', selectedFiles.map(f => f.name), 'with settings:', printSettings);
      console.log('File URLs:', uploadedUrls);
      
      // Create print job data for each file
      const printJobs = selectedFiles.map((file, index) => ({
        filename: file.name,
        fileUrl: uploadedUrls[index],
        fileSize: file.size,
        fileType: file.type,
        pages: 1, // Will be calculated properly later
        copies: printSettings.copies,
        colorMode: printSettings.colorMode,
        paperSize: printSettings.paperSize,
        doubleSided: printSettings.doubleSided,
        pageRange: printSettings.pages
      }));

      // Add each print job to cart
      for (const printJob of printJobs) {
        await addToCartMutation.mutateAsync(printJob);
      }
      
      // Clear the form after success
      setSelectedFiles([]);
      setUploadedUrls([]);
      setPrintSettings({
        copies: 1,
        colorMode: 'grayscale',
        paperSize: 'A4',
        doubleSided: false,
        pages: 'all',
      });
      
    } catch (error) {
      console.error('Failed to add print jobs to cart:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const calculateCost = () => {
    if (selectedFiles.length === 0) return 0;
    
    // Mock cost calculation - replace with actual pricing logic
    const basePrice = printSettings.colorMode === 'color' ? 2 : 1; // per page
    const pages = selectedFiles.length * 10; // Mock page count per file
    const total = pages * printSettings.copies * basePrice;
    
    return total;
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
                    maxSize={50 * 1024 * 1024} // 50MB
                    acceptedTypes={['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                  />
                  
                  {/* Upload Status Display */}
                  <UploadStatus 
                isUploading={isUploading}
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
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    <span className="text-xl font-bold text-accent arabic-nums">
                      {calculateCost()} جنيه
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>نقاط المكافآت المحتملة:</span>
                      <span className="arabic-nums">+{Math.floor(calculateCost() / 2)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  onClick={handlePrint}
                  disabled={selectedFiles.length === 0 || isUploading || addToCartMutation.isPending}
                  data-testid="button-start-printing"
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
        </div>

      </main>
      
      <BottomNav />
    </div>
  );
}
