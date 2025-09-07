import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { LogoPresets } from '@/components/AnimatedLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { 
  Printer, Store, Award, BookOpen, FileText, 
  Camera, Crown, Gift, Brain, ChevronRight,
  TrendingUp, Clock, Star, Search, GraduationCap,
  ShoppingBag, Coins, UserCircle, ArrowRight,
  Download, Upload, Sparkles, Layers, Target,
  Settings, Package, Users, Zap, Lock, FileX, Heart
} from 'lucide-react';
import { PartnersSection } from '@/components/PartnersSection';
import { AnnouncementGrid } from '@/components/AnnouncementGrid';

export default function Home() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [printerAnimation, setPrinterAnimation] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const printerTimer = setInterval(() => {
      setPrinterAnimation((prev) => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(printerTimer);
  }, []);

  useEffect(() => {
    const featureTimer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(featureTimer);
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  const quickActions = [
    {
      id: 'print',
      title: 'طباعة سريعة',
      description: 'ارفع ملفك واطبع فوراً',
      icon: Printer,
      link: '/print',
      gradient: 'from-red-500 to-red-700',
      color: 'red'
    },
    {
      id: 'store',
      title: 'المتجر الرقمي',
      description: 'كتب ومواد تعليمية',
      icon: ShoppingBag,
      link: '/store',
      gradient: 'from-blue-500 to-blue-700',
      color: 'blue'
    },
    {
      id: 'teachers',
      title: 'معلمي صفك',
      description: 'اكتشف معلمين متخصصين',
      icon: GraduationCap,
      link: '/student/teachers',
      gradient: 'from-green-500 to-green-700',
      color: 'green'
    },
    {
      id: 'rewards',
      title: 'المكافآت',
      description: 'استبدل نقاطك بجوائز',
      icon: Gift,
      link: '/rewards',
      gradient: 'from-yellow-500 to-orange-600',
      color: 'yellow'
    },
    {
      id: 'donations',
      title: 'صندوق التبرعات 🇵🇸',
      description: 'ساهم في دعم فلسطين والتعليم',
      icon: Heart,
      link: '/donations',
      gradient: 'from-red-600 to-green-600',
      color: 'palestine'
    }
  ];

  const features = [
    {
      title: 'طباعة فورية عالية الجودة',
      description: 'طباعة 300 DPI لجميع أنواع الملفات',
      icon: Printer,
      color: 'red'
    },
    {
      title: 'مسح ذكي مع OCR',
      description: 'تحويل الصور إلى نصوص قابلة للتحرير',
      icon: Camera,
      color: 'green'
    },
    {
      title: 'أدوات PDF متقدمة',
      description: 'دمج وتقسيم وضغط ملفات PDF',
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'ذكاء اصطناعي للتصميم',
      description: 'إنشاء تصاميم احترافية تلقائياً',
      icon: Brain,
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50" dir="rtl">
      {/* Palestinian Flag Colors Strip */}
      <div className="w-full h-2 bg-gradient-to-r from-red-600 via-white via-black to-green-600" />
      <Header />
      
      {/* Hero Section with Advanced Printing Animation */}
      <section className="relative pt-20 pb-20 px-6 overflow-hidden">
        {/* Background Elements - Palestinian Colors */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-10 w-40 h-40 bg-red-100 rounded-full opacity-20 animate-pulse" style={{background: 'radial-gradient(circle, #CE1126, #CE112650)'}}></div>
          <div className="absolute top-1/3 right-16 w-32 h-32 bg-green-100 rounded-full opacity-20 animate-bounce" style={{background: 'radial-gradient(circle, #007A3D, #007A3D50)'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-black rounded-full opacity-15"></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-red-100 rounded-full opacity-15 animate-pulse" style={{animationDelay: '1s', background: 'radial-gradient(circle, #CE1126, #CE112640)'}}></div>
          <div className="absolute bottom-1/3 right-10 w-36 h-36 bg-green-100 rounded-full opacity-15" style={{background: 'radial-gradient(circle, #007A3D, #007A3D40)'}}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Main Title with Gradient Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col items-center mb-8">
              <motion.img 
                src="/atbaali-logo.png" 
                alt="اطبعلي" 
                className="w-32 h-32 object-contain mb-6"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.h1 
                className="text-3xl md:text-4xl font-bold text-gray-800"
                style={{ 
                  background: 'linear-gradient(45deg, #CE1126, #007A3D)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}
              >
                مرحبا {user?.fullName || 'عزيزي المستخدم'}
              </motion.h1>
            </div>
            
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-500 mb-16 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              منصتك الشاملة للطباعة والتعليم الرقمي
            </motion.p>
          </motion.div>

          {/* Advanced Printer Animation */}
          <motion.div 
            className="relative mx-auto mb-20 max-w-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            <div className="relative">
              {/* Main Printer Body */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 shadow-2xl border border-gray-200">
                {/* Printer Screen */}
                <div className="bg-gray-900 rounded-xl p-4 mb-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <motion.div 
                      className="w-3 h-3 bg-green-400 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-green-400 text-xs font-mono">READY</span>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-3 h-20 flex items-center justify-center relative">
                    <motion.div
                      animate={{ 
                        rotateY: printerAnimation * 90,
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 0.6 }}
                      className="text-white"
                    >
                      <Printer className="w-8 h-8" />
                    </motion.div>
                    
                    {/* Print Progress Bar */}
                    <motion.div
                      className="absolute bottom-1 left-1 right-1 h-1 bg-gray-700 rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-400 to-green-400"
                        animate={{ width: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.div>
                  </div>
                </div>
                
                {/* Paper Output Tray */}
                <motion.div
                  className="bg-white rounded-xl p-4 shadow-inner relative"
                  animate={{ 
                    boxShadow: [
                      '0 0 0 rgba(59, 130, 246, 0)',
                      '0 0 20px rgba(59, 130, 246, 0.3)',
                      '0 0 0 rgba(59, 130, 246, 0)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {/* Animated Papers */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={printerAnimation}
                      className="space-y-2"
                      initial={{ y: -30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 30, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded"
                          initial={{ width: 0 }}
                          animate={{ width: `${100 - i * 20}%` }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Printing Scanner Line */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent"
                    animate={{ y: [0, 60, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>

                {/* Status LEDs */}
                <div className="flex justify-center space-x-3 space-x-reverse mt-4">
                  {['green', 'blue', 'yellow', 'red'].map((color, i) => (
                    <motion.div
                      key={color}
                      className={`w-3 h-3 rounded-full bg-${color}-400`}
                      animate={{ 
                        opacity: [0.3, 1, 0.3],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: i * 0.3 
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Action Icons */}
              <motion.div
                className="text-white p-3 rounded-full shadow-xl absolute -top-6 -right-6"
                style={{ backgroundColor: '#CE1126' }}
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 15, -15, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Upload className="w-5 h-5" />
              </motion.div>
              
              <motion.div
                className="text-white p-3 rounded-full shadow-xl absolute -bottom-6 -left-6"
                style={{ backgroundColor: '#007A3D' }}
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -15, 15, 0]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Download className="w-5 h-5" />
              </motion.div>

              <motion.div
                className="text-white p-2 rounded-full shadow-lg absolute top-1/2 -left-8"
                style={{ backgroundColor: '#000000' }}
                animate={{ 
                  x: [0, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <FileText className="w-4 h-4" />
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <Link href="/print">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="text-white px-10 py-5 rounded-full shadow-2xl text-lg font-semibold"
                  style={{ background: 'linear-gradient(135deg, #CE1126, #007A3D)' }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Printer className="w-6 h-6 mr-3" />
                  </motion.div>
                  ابدأ الطباعة الآن
                  <Sparkles className="w-6 h-6 ml-3" />
                </Button>
              </motion.div>
            </Link>
            
            <Link href="/store">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 px-10 py-5 rounded-full shadow-xl text-lg font-semibold"
                  style={{ borderColor: '#007A3D', color: '#007A3D' }}
                >
                  <ShoppingBag className="w-6 h-6 mr-3" />
                  تصفح المتجر
                  <ChevronRight className="w-6 h-6 ml-3" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-6 max-w-6xl mx-auto mb-24">
        <motion.h2 
          className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          إجراءات سريعة
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
              whileHover={{ scale: action.id === 'teachers' ? 1 : 1.03, y: action.id === 'teachers' ? 0 : -5 }}
              whileTap={{ scale: action.id === 'teachers' ? 1 : 0.98 }}
            >
              {action.id === 'teachers' ? (
                <Card className="h-48 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-not-allowed overflow-hidden group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 opacity-5" />
                  
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }} />
                  
                  <CardContent className="relative h-full p-8 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-600 mb-2 flex items-center">
                          {action.title}
                          <Lock className="w-4 h-4 mr-2 text-amber-600" />
                        </h3>
                        <p className="text-sm text-gray-500">
                          {action.description}
                        </p>
                      </div>
                      <motion.div
                        className="p-3 rounded-full bg-amber-50 border-2 border-amber-200"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <FileX className="w-6 h-6 text-amber-600" />
                      </motion.div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <motion.div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg"
                        animate={{
                          boxShadow: [
                            '0 4px 15px rgba(245, 158, 11, 0.3)',
                            '0 6px 25px rgba(245, 158, 11, 0.5)',
                            '0 4px 15px rgba(245, 158, 11, 0.3)'
                          ]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <span className="text-sm font-bold flex items-center">
                          قريباً جداً
                        </span>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Link href={action.link}>
                  <Card className="h-48 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    
                    <CardContent className="relative h-full p-8 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {action.description}
                          </p>
                        </div>
                        <motion.div
                          className={action.id === 'donations' ? 'p-3 rounded-full' : `p-3 rounded-full bg-${action.color}-100`}
                          style={action.id === 'donations' ? {
                            background: 'linear-gradient(135deg, #CE112640, #007A3D40)',
                            border: '2px solid #CE112620'
                          } : {}}
                          whileHover={{ rotate: 15 }}
                        >
                          {(() => {
                            const IconComponent = action.icon;
                            return <IconComponent 
                              className={action.id === 'donations' ? 'w-6 h-6' : `w-6 h-6 text-${action.color}-600`}
                              style={action.id === 'donations' ? { color: '#CE1126' } : {}}
                            />;
                          })()}
                        </motion.div>
                      </div>
                      
                      <div className={`flex items-center text-sm font-medium ${
                        action.id === 'donations' ? '' : 'text-blue-600'
                      }`} style={action.id === 'donations' ? { color: '#007A3D' } : {}}>
                        <span>ابدأ الآن</span>
                        <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Partners Section */}
      <PartnersSection />

      {/* Announcements Section */}
      <section className="px-6 max-w-7xl mx-auto mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.0 }}
        >
          <AnnouncementGrid />
        </motion.div>
      </section>


      <BottomNav />
    </div>
  );
}