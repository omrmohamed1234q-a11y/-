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
import { PDFToolsModal } from '@/components/pdf/PDFToolsModal';

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

  const handleDragDropUpload = (files: File[], urls: string[]) => {
    setSelectedFiles(files);
    setUploadedUrls(urls);
    console.log('Files uploaded:', files.map(f => f.name), 'URLs:', urls);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <i className="fas fa-upload text-accent ml-2"></i>
                رفع الملف
              </h2>
              
              <DragDropUpload
                onUpload={handleDragDropUpload}
                maxFiles={5}
                maxSize={50 * 1024 * 1024} // 50MB
                acceptedTypes={['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
              />
              
              {/* Camera and Scanner Integration */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <CameraCapture
                  onCapture={handleCameraCapture}
                  allowedTypes={['document', 'image']}
                  maxFileSize={20 * 1024 * 1024}
                />
                <DocumentScanner onScan={handleCameraCapture} />
              </div>
            </CardContent>
          </Card>

          {/* Print Settings */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <i className="fas fa-cog text-accent ml-2"></i>
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

        {/* PDF Tools */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <i className="fas fa-file-pdf text-accent ml-2"></i>
              أدوات PDF
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: 'fas fa-compress', label: 'ضغط PDF', action: 'compress' as const },
                { icon: 'fas fa-object-group', label: 'دمج ملفات', action: 'merge' as const },
                { icon: 'fas fa-cut', label: 'تقسيم PDF', action: 'split' as const },
                { icon: 'fas fa-sync-alt', label: 'تدوير الصفحات', action: 'rotate' as const },
              ].map((tool) => (
                <PDFToolsModal
                  key={tool.action}
                  tool={tool.action}
                  icon={tool.icon}
                  title={tool.label}
                >
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center hover-lift w-full"
                  >
                    <i className={`${tool.icon} text-2xl text-accent mb-2`}></i>
                    <span className="text-sm">{tool.label}</span>
                  </Button>
                </PDFToolsModal>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      
      <BottomNav />
    </div>
  );
}
