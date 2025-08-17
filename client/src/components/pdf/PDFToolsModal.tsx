import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  compressPDF, 
  mergePDFs, 
  splitPDF, 
  rotatePDF, 
  downloadBlob,
  getPDFInfo,
  type PDFToolResult 
} from '@/lib/pdf-tools';

interface PDFToolsModalProps {
  tool: 'compress' | 'merge' | 'split' | 'rotate';
  icon: string;
  title: string;
  children: React.ReactNode;
}

export function PDFToolsModal({ tool, icon, title, children }: PDFToolsModalProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PDFToolResult | null>(null);
  
  // Split tool specific states
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  
  // Rotate tool specific states
  const [rotation, setRotation] = useState<number>(90);
  
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      
      // Validate PDF files
      const pdfFiles = fileArray.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length !== fileArray.length) {
        toast({
          title: 'نوع ملف غير مدعوم',
          description: 'يجب اختيار ملفات PDF فقط',
          variant: 'destructive'
        });
        return;
      }
      
      // Check file limits for merge tool
      if (tool === 'merge' && pdfFiles.length < 2) {
        toast({
          title: 'ملفات غير كافية',
          description: 'يجب اختيار ملفين على الأقل للدمج',
          variant: 'destructive'
        });
        return;
      }
      
      // Single file tools
      if ((tool === 'compress' || tool === 'split' || tool === 'rotate') && pdfFiles.length > 1) {
        toast({
          title: 'ملف واحد فقط',
          description: `يمكن ${title} ملف واحد فقط في المرة`,
          variant: 'destructive'
        });
        return;
      }
      
      setFiles(pdfFiles);
      setResult(null);
    }
  };

  const processPDF = async () => {
    if (files.length === 0) {
      toast({
        title: 'لا توجد ملفات',
        description: 'يجب اختيار ملف أو أكثر أولاً',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      let result: PDFToolResult;

      switch (tool) {
        case 'compress':
          result = await compressPDF(files[0]);
          break;
          
        case 'merge':
          result = await mergePDFs(files);
          break;
          
        case 'split':
          result = await splitPDF(files[0], startPage, endPage);
          break;
          
        case 'rotate':
          result = await rotatePDF(files[0], rotation);
          break;
          
        default:
          throw new Error('أداة غير مدعومة');
      }

      setProgress(100);
      setResult(result);

      if (result.success) {
        toast({
          title: 'تمت العملية بنجاح',
          description: result.message
        });

        // Auto-download result
        if (result.data) {
          if (Array.isArray(result.data)) {
            // Multiple files (split)
            result.data.forEach((blob, index) => {
              downloadBlob(blob, `${result.fileName}_page_${index + 1}.pdf`);
            });
          } else {
            // Single file
            downloadBlob(result.data, result.fileName!);
          }
        }
      } else {
        toast({
          title: 'فشلت العملية',
          description: result.message,
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('PDF processing error:', error);
      toast({
        title: 'خطأ في المعالجة',
        description: 'حدث خطأ أثناء معالجة الملف',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
      setProgress(0);
      clearInterval(progressInterval);
    }
  };

  const resetModal = () => {
    setFiles([]);
    setResult(null);
    setProgress(0);
    setStartPage(1);
    setEndPage(1);
    setRotation(90);
  };

  const renderToolSpecificInputs = () => {
    switch (tool) {
      case 'split':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-page">صفحة البداية</Label>
              <Input
                id="start-page"
                type="number"
                min="1"
                value={startPage}
                onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="end-page">صفحة النهاية</Label>
              <Input
                id="end-page"
                type="number"
                min="1"
                value={endPage}
                onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        );

      case 'rotate':
        return (
          <div>
            <Label htmlFor="rotation">زاوية الدوران</Label>
            <Select value={rotation.toString()} onValueChange={(value) => setRotation(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">90 درجة (ربع لفة)</SelectItem>
                <SelectItem value="180">180 درجة (نصف لفة)</SelectItem>
                <SelectItem value="270">270 درجة (ثلاثة أرباع لفة)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      setOpen(open);
      if (!open) resetModal();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 space-x-reverse">
            <i className={`${icon} text-accent`}></i>
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Selection */}
          <div>
            <Label htmlFor="pdf-files">
              اختر ملف{tool === 'merge' ? 'ات' : ''} PDF
            </Label>
            <Input
              id="pdf-files"
              type="file"
              accept="application/pdf"
              multiple={tool === 'merge'}
              onChange={handleFileSelect}
              className="mt-2"
            />
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-center justify-between">
                    <span>{file.name}</span>
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tool-specific inputs */}
          {renderToolSpecificInputs()}

          {/* Processing Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>جاري المعالجة...</span>
                <span className="arabic-nums">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Result Display */}
          {result && !processing && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 space-x-reverse">
            <Button
              onClick={processPDF}
              disabled={files.length === 0 || processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <i className={`${icon} ml-2`}></i>
                  {title}
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={() => setOpen(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}