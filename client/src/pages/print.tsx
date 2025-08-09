import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function Print() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [printSettings, setPrintSettings] = useState({
    copies: 1,
    colorMode: 'grayscale',
    paperSize: 'A4',
    doubleSided: false,
    pages: 'all',
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePrint = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    
    try {
      // TODO: Upload file to Supabase Storage
      // TODO: Create print job in database
      // TODO: Add to print queue
      
      console.log('Printing file:', selectedFile.name, 'with settings:', printSettings);
      
      // Simulate printing process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const calculateCost = () => {
    if (!selectedFile) return 0;
    
    // Mock cost calculation - replace with actual pricing logic
    const basePrice = printSettings.colorMode === 'color' ? 2 : 1; // per page
    const pages = 10; // Mock page count
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
              
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center mb-4">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-lg font-medium mb-2">اسحب وأفلت ملفك هنا</p>
                  <p className="text-sm text-muted-foreground mb-4">أو انقر للاختيار</p>
                  <Button variant="outline">اختيار ملف</Button>
                </label>
              </div>
              
              {selectedFile && (
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center">
                    <i className="fas fa-file text-accent text-2xl ml-3"></i>
                    <div className="flex-1">
                      <h4 className="font-medium">{selectedFile.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Badge variant="secondary">جاهز للطباعة</Badge>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button variant="outline" className="w-full">
                  <i className="fas fa-camera ml-2"></i>
                  التقط صورة
                </Button>
                <Button variant="outline" className="w-full">
                  <i className="fas fa-scan ml-2"></i>
                  مسح ضوئي
                </Button>
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
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-print ml-2"></i>
                      ابدأ الطباعة
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
                { icon: 'fas fa-compress', label: 'ضغط PDF', action: 'compress' },
                { icon: 'fas fa-object-group', label: 'دمج ملفات', action: 'merge' },
                { icon: 'fas fa-cut', label: 'تقسيم PDF', action: 'split' },
                { icon: 'fas fa-sync-alt', label: 'تدوير الصفحات', action: 'rotate' },
              ].map((tool) => (
                <Button
                  key={tool.action}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center hover-lift"
                  onClick={() => console.log('Tool:', tool.action)}
                >
                  <i className={`${tool.icon} text-2xl text-accent mb-2`}></i>
                  <span className="text-sm">{tool.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      
      <BottomNav />
    </div>
  );
}
