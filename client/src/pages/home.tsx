import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { 
  Printer, Store, Award, User, BookOpen, FileText, 
  Zap, Camera, FolderOpen, Crown, Gift, Ticket,
  Brain, MessageCircle, Globe, ChevronRight,
  TrendingUp, Clock, Star, Search, GraduationCap,
  Lock, Play, ShoppingBag, Coins, UserCircle,
  Package, Truck, CheckCircle, ArrowRight,
  Users, PenTool, Monitor, Settings, Download,
  Upload, Sparkles, Layers, Target
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [printerAnimation, setPrinterAnimation] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const featureTimer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearTimeout(featureTimer);
  }, []);

  useEffect(() => {
    const printerTimer = setInterval(() => {
      setPrinterAnimation((prev) => (prev + 1) % 4);
    }, 1000);
    return () => clearInterval(printerTimer);
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  // Enhanced Quick Actions with animations
  const quickActions = [
    {
      id: 'print',
      title: 'طباعة سريعة',
      description: 'ارفع ملفك واطبع فوراً',
      previewText: 'PDF, Word, PowerPoint - جميع أنواع الملفات',
      icon: Printer,
      link: '/print',
      gradient: 'from-red-500 via-red-600 to-rose-700',
      bgColor: 'bg-red-50',
      animation: 'pulse'
    },
    {
      id: 'store',
      title: 'المتجر الرقمي',
      description: 'تسوق المنتجات التعليمية',
      previewText: 'كتب، قرطاسية، إلكترونيات تعليمية',
      icon: ShoppingBag,
      link: '/store',
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      bgColor: 'bg-blue-50',
      animation: 'slideIn'
    },
    {
      id: 'teachers',
      title: 'معلمي صفك',
      description: 'اكتشف المعلمين والمواد المناسبة لصفك',
      previewText: `معلمين متخصصين لصفك الدراسي`,
      icon: GraduationCap,
      link: '/student/teachers',
      gradient: 'from-green-500 via-emerald-600 to-teal-700',
      bgColor: 'bg-green-50',
      animation: 'slideIn'
    },
    {
      id: 'rewards',
      title: 'المكافآت',
      description: 'استبدل نقاطك بجوائز',
      previewText: `نقاطك الحالية: ${user?.bountyPoints || 0}`,
      icon: Coins,
      link: '/rewards',
      gradient: 'from-yellow-500 via-amber-600 to-orange-700',
      bgColor: 'bg-yellow-50',
      animation: 'spin'
    },
    {
      id: 'profile',
      title: 'الملف الشخصي',
      description: 'إدارة حسابك ونقاطك',
      previewText: `المستوى ${user?.level || 1} - ${user?.fullName || 'مستخدم عزيز'}`,
      icon: UserCircle,
      link: '/profile',
      gradient: 'from-purple-500 via-violet-600 to-indigo-700',
      bgColor: 'bg-purple-50',
      animation: 'bounce'
    }
  ];

  // Feature Cards for carousel
  const features = [
    {
      title: 'محرك الطباعة الشامل',
      description: 'طباعة عالية الجودة لجميع أنواع الملفات',
      icon: Printer,
      gradient: 'from-red-500 to-red-700',
      cta: 'ابدأ الطباعة'
    },
    {
      title: 'المسح الذكي + OCR',
      description: 'تحويل الصور إلى نصوص قابلة للتحرير',
      icon: Camera,
      gradient: 'from-green-500 to-green-700',
      cta: 'جرب المسح'
    },
    {
      title: 'صندوق أدوات PDF',
      description: 'تحرير ودمج وضغط ملفات PDF',
      icon: FolderOpen,
      gradient: 'from-blue-500 to-blue-700',
      cta: 'استخدم الأدوات'
    },
    {
      title: 'صالة VIP',
      description: 'خدمة طباعة فورية للأعضاء المميزين',
      icon: Crown,
      gradient: 'from-yellow-500 to-amber-700',
      cta: 'اشترك الآن'
    },
    {
      title: 'مركز الكوبونات',
      description: 'خصومات وعروض حصرية',
      icon: Ticket,
      gradient: 'from-pink-500 to-rose-700',
      cta: 'استعرض العروض'
    },
    {
      title: 'استوديو القوالب بالذكاء الاصطناعي',
      description: 'إنشاء تصاميم تلقائية باستخدام AI',
      icon: Brain,
      gradient: 'from-indigo-500 to-purple-700',
      cta: 'جرب الآن'
    }
  ];

  const getAnimationClass = (animation: string) => {
    switch (animation) {
      case 'pulse': return 'animate-pulse';
      case 'spin': return 'animate-spin';
      case 'bounce': return 'animate-bounce';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20 space-y-8">
        {/* Welcome Section */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">
            {greeting()}، {user?.fullName || 'مستخدم عزيز'}
          </h1>
          <p className="text-gray-600 text-lg">
            {currentTime.toLocaleDateString('ar-SA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </motion.div>

        {/* Quick Actions - Large Interactive Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            إجراءات سريعة
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.id}
                className="group relative overflow-hidden rounded-2xl"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onHoverStart={() => setHoveredCard(action.id)}
                onHoverEnd={() => setHoveredCard(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={action.link} className="block">
                  <Card className="h-48 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer">
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    
                    <CardContent className="relative h-full p-6 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-white transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-gray-600 group-hover:text-gray-200 transition-colors">
                            {action.description}
                          </p>
                        </div>
                        
                        <motion.div
                          className={`text-white bg-gradient-to-br ${action.gradient} p-3 rounded-xl ${
                            action.animation === 'pulse' ? 'shadow-lg shadow-red-500/30' :
                            action.animation === 'spin' ? 'shadow-lg shadow-yellow-500/30' :
                            action.animation === 'bounce' ? 'shadow-lg shadow-purple-500/30' :
                            'shadow-lg shadow-blue-500/30'
                          }`}
                          animate={
                            action.animation === 'pulse' ? { scale: [1, 1.1, 1] } :
                            action.animation === 'spin' && hoveredCard === action.id ? { rotate: 360 } :
                            action.animation === 'bounce' ? { y: [0, -5, 0] } :
                            {}
                          }
                          transition={
                            action.animation === 'pulse' ? { duration: 2, repeat: Infinity } :
                            action.animation === 'spin' ? { duration: 0.6 } :
                            action.animation === 'bounce' ? { duration: 1, repeat: Infinity } :
                            {}
                          }
                        >
                          <action.icon className="w-8 h-8" />
                        </motion.div>
                      </div>
                      
                      <AnimatePresence>
                        {hoveredCard === action.id && (
                          <motion.div
                            className="bg-white/90 backdrop-blur-sm rounded-lg p-3 mt-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <p className="text-sm text-gray-700 font-medium">
                              {action.previewText}
                            </p>
                            <ArrowRight className="w-4 h-4 text-gray-500 mt-1" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Teacher's Section */}
        <motion.section 
          className="space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            {/* Academic background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4">
                <BookOpen className="w-32 h-32 text-green-600" />
              </div>
              <div className="absolute bottom-4 left-4">
                <PenTool className="w-24 h-24 text-blue-600" />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Monitor className="w-40 h-40 text-gray-600" />
              </div>
            </div>
            
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <GraduationCap className="w-8 h-8" />
                  <CardTitle className="text-2xl">ركن المعلم</CardTitle>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Lock className="w-5 h-5" />
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    اشتراك شهري
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 relative">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="البحث حسب المنهج، الصف، المنطقة..."
                    className="flex-1"
                    data-testid="input-teacher-search"
                  />
                </div>
                
                <Tabs defaultValue="guides" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="guides">أدلة المعلم</TabsTrigger>
                    <TabsTrigger value="answers">نماذج الإجابة</TabsTrigger>
                    <TabsTrigger value="materials">مواد قابلة للطباعة</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="guides" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: 'دليل الرياضيات - الصف الثالث', subject: 'رياضيات', grade: '3' },
                        { title: 'دليل العلوم - الصف الخامس', subject: 'علوم', grade: '5' },
                      ].map((item, index) => (
                        <Card key={index} className="border border-green-200 hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <div className="flex items-center space-x-2 space-x-reverse mt-2">
                              <Badge variant="outline">{item.subject}</Badge>
                              <Badge variant="outline">الصف {item.grade}</Badge>
                            </div>
                            <Button size="sm" className="mt-3 w-full">
                              <Play className="w-4 h-4 mr-2" />
                              عرض المحتوى
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="answers" className="space-y-4">
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">نماذج الإجابة متاحة للمشتركين</p>
                      <Button className="mt-4 bg-gradient-to-r from-green-600 to-blue-600">
                        اشترك الآن للوصول
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="materials" className="space-y-4">
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">مواد تعليمية قابلة للطباعة</p>
                      <Button className="mt-4 bg-gradient-to-r from-green-600 to-blue-600">
                        استعرض المواد
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Feature Cards Carousel */}
        <motion.section 
          className="space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            مميزات منصة اطبعلي
          </h2>
          
          <div className="relative h-64 overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature}
                className="absolute inset-0"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="h-full border-0 shadow-xl overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${features[currentFeature].gradient} opacity-90`} />
                  <CardContent className="relative h-full p-8 text-white flex flex-col justify-between">
                    <div className="space-y-4">
                      {(() => {
                        const IconComponent = features[currentFeature].icon;
                        return <IconComponent className="w-16 h-16" />;
                      })()}
                      <div>
                        <h3 className="text-3xl font-bold mb-2">
                          {features[currentFeature].title}
                        </h3>
                        <p className="text-lg opacity-90">
                          {features[currentFeature].description}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="self-start bg-white text-gray-900 hover:bg-gray-100"
                      data-testid={`button-feature-${currentFeature}`}
                    >
                      {features[currentFeature].cta}
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
            
            {/* Feature indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 space-x-reverse">
              {features.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentFeature ? 'bg-white' : 'bg-white/40'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                  data-testid={`button-feature-indicator-${index}`}
                />
              ))}
            </div>
          </div>
        </motion.section>

        {/* User Stats */}
        <motion.section 
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {[
            { label: 'نقاط البونص', value: user?.bountyPoints || 0, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'المستوى', value: user?.level || 1, icon: Award, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'مجموع الطباعة', value: user?.totalPrints || 0, icon: Printer, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'إجمالي المشتريات', value: user?.totalPurchases || 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="text-center p-4 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-2">
                  <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mx-auto`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
}