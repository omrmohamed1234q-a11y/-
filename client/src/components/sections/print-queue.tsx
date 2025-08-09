import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PrintJob {
  id: string;
  filename: string;
  pages: number;
  status: 'printing' | 'pending' | 'completed' | 'failed';
  progress: number;
  colorMode: string;
  queuePosition?: number;
}

// Mock data - replace with actual data from Supabase
const mockJobs: PrintJob[] = [
  {
    id: '1',
    filename: 'تقرير_الفيزياء.pdf',
    pages: 12,
    status: 'printing',
    progress: 75,
    colorMode: 'color',
  },
  {
    id: '2',
    filename: 'ملخص_الرياضيات.docx',
    pages: 8,
    status: 'pending',
    progress: 0,
    colorMode: 'grayscale',
    queuePosition: 2,
  },
];

const getStatusBadge = (status: PrintJob['status']) => {
  switch (status) {
    case 'printing':
      return <Badge className="bg-warning text-white">جاري الطباعة</Badge>;
    case 'pending':
      return <Badge variant="secondary">في الانتظار</Badge>;
    case 'completed':
      return <Badge className="bg-success text-white">مكتمل</Badge>;
    case 'failed':
      return <Badge variant="destructive">فشل</Badge>;
    default:
      return <Badge variant="outline">غير معروف</Badge>;
  }
};

const getStatusColor = (status: PrintJob['status']) => {
  switch (status) {
    case 'printing':
      return 'border-warning';
    case 'pending':
      return 'border-muted';
    case 'completed':
      return 'border-success';
    case 'failed':
      return 'border-destructive';
    default:
      return 'border-muted';
  }
};

export default function PrintQueue() {
  if (mockJobs.length === 0) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <i className="fas fa-print text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">لا توجد مهام طباعة</h3>
              <p className="text-muted-foreground">ابدأ بطباعة ملف لرؤية المهام هنا</p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center">
              <i className="fas fa-clock-rotate-left text-accent ml-2"></i>
              طابور الطباعة
            </h2>
            <span className="text-sm text-muted-foreground">
              مهام نشطة: <span className="arabic-nums font-semibold">{mockJobs.length}</span>
            </span>
          </div>
          
          <div className="space-y-3">
            {mockJobs.map((job) => (
              <div
                key={job.id}
                className={`flex items-center justify-between p-4 bg-secondary/50 rounded-lg border-r-4 ${getStatusColor(job.status)}`}
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    job.status === 'printing' ? 'bg-warning/10' : 'bg-muted'
                  }`}>
                    <i className={`fas fa-file ${
                      job.status === 'printing' ? 'text-warning' : 'text-muted-foreground'
                    }`}></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{job.filename}</h4>
                    <p className="text-xs text-muted-foreground">
                      صفحات: <span className="arabic-nums">{job.pages}</span> • {job.colorMode === 'color' ? 'ملون' : 'أبيض وأسود'}
                    </p>
                    {job.status === 'printing' && (
                      <div className="mt-2">
                        <Progress value={job.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="arabic-nums">{job.progress}٪</span> مكتمل
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  {getStatusBadge(job.status)}
                  {job.queuePosition && (
                    <p className="text-xs text-muted-foreground mt-1">
                      الموضع: <span className="arabic-nums">{job.queuePosition}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
