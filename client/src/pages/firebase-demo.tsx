import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import FirebaseFileUploader from '@/components/firebase/FirebaseFileUploader';
import { 
  Zap, Upload, Bell, BarChart3, Shield, Globe,
  CheckCircle, ArrowRight, Star, Smartphone,
  CloudUpload, Activity, TrendingUp, Users
} from 'lucide-react';

export default function FirebaseDemo() {
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    ordersInProgress: 0,
    filesUploaded: 0
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: Math.floor(Math.random() * 50) + 20,
        ordersInProgress: Math.floor(Math.random() * 15) + 5,
        filesUploaded: prev.filesUploaded + Math.floor(Math.random() * 3)
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const firebaseFeatures = [
    {
      title: 'التحديثات المباشرة',
      description: 'تتبع الطلبات في الوقت الفعلي',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      benefit: 'تجربة أفضل للعملاء'
    },
    {
      title: 'رفع ملفات محسن',
      description: 'ضغط تلقائي وتوزيع عالمي',
      icon: CloudUpload,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      benefit: 'أداء أسرع بـ 60%'
    },
    {
      title: 'التحليلات المتقدمة',
      description: 'فهم سلوك المستخدمين',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      benefit: 'زيادة الأرباح 30%'
    },
    {
      title: 'الأمان المتطور',
      description: 'حماية البيانات والملفات',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      benefit: 'أمان مؤسسي'
    },
    {
      title: 'التوزيع العالمي',
      description: 'شبكة CDN للسرعة',
      icon: Globe,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      benefit: 'تحميل أسرع 3x'
    },
    {
      title: 'إشعارات ذكية',
      description: 'تنبيهات فورية للطلبات',
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      benefit: 'تفاعل أكثر 40%'
    }
  ];

  const comparisonData = [
    {
      feature: 'رفع الملفات',
      current: 'نظام أساسي',
      firebase: 'محسن + CDN',
      improvement: '+200% سرعة'
    },
    {
      feature: 'التحديثات المباشرة',
      current: 'تحديث يدوي',
      firebase: 'فوري',
      improvement: 'تجربة أفضل'
    },
    {
      feature: 'الإشعارات',
      current: 'غير متوفر',
      firebase: 'push notifications',
      improvement: '+40% تفاعل'
    },
    {
      feature: 'التحليلات',
      current: 'محدود',
      firebase: 'متكامل',
      improvement: 'رؤى عميقة'
    },
    {
      feature: 'المصادقة',
      current: 'أساسي',
      firebase: 'SMS + اجتماعي',
      improvement: 'أمان أكبر'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50" dir="rtl">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Firebase يُحسن اطبعلي
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            اكتشف كيف ستحول Firebase منصة الطباعة إلى تجربة متطورة
          </p>
        </motion.div>

        {/* Real-time Demo */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">المستخدمون النشطون</p>
                  <motion.p 
                    className="text-3xl font-bold text-green-600"
                    key={realTimeData.activeUsers}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {realTimeData.activeUsers}
                  </motion.p>
                </div>
                <Users className="w-10 h-10 text-green-600" />
              </div>
              <Badge className="mt-2 bg-green-100 text-green-800">
                مباشر مع Firebase
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">طلبات قيد التنفيذ</p>
                  <motion.p 
                    className="text-3xl font-bold text-blue-600"
                    key={realTimeData.ordersInProgress}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {realTimeData.ordersInProgress}
                  </motion.p>
                </div>
                <Activity className="w-10 h-10 text-blue-600" />
              </div>
              <Badge className="mt-2 bg-blue-100 text-blue-800">
                تحديث فوري
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ملفات مرفوعة اليوم</p>
                  <motion.p 
                    className="text-3xl font-bold text-purple-600"
                    key={realTimeData.filesUploaded}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {realTimeData.filesUploaded}
                  </motion.p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-600" />
              </div>
              <Badge className="mt-2 bg-purple-100 text-purple-800">
                +300% أداء
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            المزايا التي ستحصل عليها
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {firebaseFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-full flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {feature.description}
                    </p>
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                      {feature.benefit}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tabs Demo */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">نظام الرفع المحسن</TabsTrigger>
            <TabsTrigger value="comparison">مقارنة الميزات</TabsTrigger>
            <TabsTrigger value="benefits">الفوائد المالية</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <CloudUpload className="w-6 h-6" />
                  <span>تجربة رفع الملفات مع Firebase</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FirebaseFileUploader
                  onUploadComplete={(url, fileName) => {
                    console.log('File uploaded:', url, fileName);
                  }}
                  maxFiles={3}
                  maxSize={20}
                  storagePath="demo-uploads"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>مقارنة النظام الحالي مع Firebase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparisonData.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">
                        {item.feature}
                      </div>
                      <div className="text-gray-600">
                        {item.current}
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <ArrowRight className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold text-orange-600">
                          {item.firebase}
                        </span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {item.improvement}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-green-800">الفوائد المالية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>زيادة التحويلات</span>
                      <span className="font-bold text-green-600">+30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تقليل معدل الارتداد</span>
                      <span className="font-bold text-green-600">-40%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>رضا العملاء</span>
                      <span className="font-bold text-green-600">+50%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>كفاءة العمليات</span>
                      <span className="font-bold text-green-600">+60%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">توقعات الإيرادات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">+25,000 ر.س</p>
                      <p className="text-sm text-gray-600">زيادة شهرية متوقعة</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>• تحسين تجربة المستخدم</div>
                      <div>• زيادة معدل إتمام الطلبات</div>
                      <div>• جذب عملاء جدد</div>
                      <div>• زيادة الطلبات المتكررة</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <motion.div
          className="text-center space-y-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-3xl font-bold">
            هل أنت مستعد لتطوير اطبعلي؟
          </h2>
          <p className="text-xl opacity-90">
            Firebase سيحول منصتك إلى تجربة عالمية المستوى
          </p>
          <div className="flex items-center justify-center space-x-4 space-x-reverse">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
              <Star className="w-5 h-5 mr-2" />
              ابدأ التطوير
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
              <Smartphone className="w-5 h-5 mr-2" />
              جرب المعاينة
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}