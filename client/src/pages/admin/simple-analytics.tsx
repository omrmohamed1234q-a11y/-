import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart3, Database, AlertCircle, Info } from 'lucide-react';
import { Link } from 'wouter';

export default function SimpleAnalytics() {
  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
                <p className="text-gray-600">مراجعة أداء المنصة والمقاييس المهمة</p>
              </div>
            </div>
            <Link to="/admin">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>

        {/* No Data Message */}
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Database className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              لا توجد بيانات متاحة حالياً
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              سيتم عرض التقارير والإحصائيات هنا عندما تبدأ بيانات حقيقية في التدفق من استخدام المنصة
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">ماذا ستشمل التقارير؟</p>
                  <ul className="text-blue-800 space-y-1">
                    <li>• إحصائيات الطلبات والمبيعات</li>
                    <li>• تحليل أداء المنتجات</li>
                    <li>• مقاييس رضا العملاء</li>
                    <li>• تقارير الإيرادات والأرباح</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Note */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 mb-1">ملاحظة للتطوير</p>
              <p className="text-amber-800">
                هذه الصفحة ستعرض البيانات الحقيقية من قاعدة البيانات عندما يتم ربطها بـ APIs الخاصة بالتقارير والإحصائيات
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}