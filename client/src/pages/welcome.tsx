import React from 'react'
import { Link } from 'wouter'
import { LogoPresets } from '@/components/AnimatedLogo'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { 
  PrinterIcon, 
  FileTextIcon, 
  ScanLineIcon as ScanIcon,
  ShoppingCartIcon,
  SparklesIcon,
  RocketIcon,
  GraduationCapIcon,
  TrophyIcon
} from 'lucide-react'

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          x: [0, -120, 0],
          y: [0, 80, 0],
          rotate: [360, 180, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl"
      />
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -60, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-2xl blur-lg"
      />
    </div>
  )
}

const FeatureCard = ({ icon: Icon, title, description, color }: {
  icon: any;
  title: string;
  description: string;
  color: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="h-full border-2 hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
)

export default function Welcome() {
  const features = [
    {
      icon: PrinterIcon,
      title: "خدمات الطباعة",
      description: "طباعة عالية الجودة لجميع مستنداتك التعليمية والمكتبية بأسعار منافسة",
      color: "bg-gradient-to-br from-red-500 to-red-600"
    },
    {
      icon: ScanIcon,
      title: "المسح الذكي",
      description: "تقنية OCR المتطورة لتحويل الصور والمستندات إلى نصوص قابلة للتعديل",
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      icon: FileTextIcon,
      title: "معالجة PDF",
      description: "أدوات شاملة لتحرير وتنسيق ودمج ملفات PDF بسهولة تامة",
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      icon: ShoppingCartIcon,
      title: "متجر المواد",
      description: "مجموعة واسعة من المواد التعليمية والقرطاسية عالية الجودة",
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      icon: GraduationCapIcon,
      title: "ركن المعلمين",
      description: "مواد تعليمية متخصصة وحلول مبتكرة للمعلمين والطلاب",
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      icon: TrophyIcon,
      title: "نظام المكافآت",
      description: "اكسب نقاط واستمتع بمكافآت حصرية مع كل عملية شراء",
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <LogoPresets.Navigation />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex gap-4"
          >
            <Link href="/login">
              <Button 
                variant="outline" 
                className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold"
                data-testid="button-login"
              >
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                data-testid="button-register"
              >
                إنشاء حساب جديد
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
              مرحباً بك في{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-600">
                اطبعلي
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              منصتك الشاملة للطباعة والخدمات التعليمية. نوفر حلولاً مبتكرة ومتطورة لجميع احتياجاتك الدراسية والمهنية
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/register">
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg font-semibold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                data-testid="button-register-hero"
              >
                <SparklesIcon className="w-5 h-5 ml-2" />
                ابدأ رحلتك معنا
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-lg font-semibold py-4 px-8 rounded-xl transition-all duration-300"
                data-testid="button-login-hero"
              >
                <RocketIcon className="w-5 h-5 ml-2" />
                لديك حساب بالفعل؟
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-4">خدماتنا المتميزة</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              اكتشف مجموعة شاملة من الخدمات المصممة خصيصاً لتلبية احتياجاتك التعليمية والمهنية
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl p-12 text-white shadow-2xl"
          >
            <h3 className="text-3xl font-bold mb-4">جاهز للبدء؟</h3>
            <p className="text-xl mb-8 opacity-90">
              انضم إلى آلاف الطلاب والمعلمين الذين يثقون في خدماتنا
            </p>
            <Link href="/register">
              <Button 
                size="lg"
                variant="secondary"
                className="bg-white text-red-600 hover:bg-gray-50 text-lg font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                data-testid="button-register-cta"
              >
                <SparklesIcon className="w-5 h-5 ml-2" />
                إنشاء حساب مجاني
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            منصة اطبعلي - حلولك الشاملة للطباعة والخدمات التعليمية
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <Link href="/terms-and-conditions" className="hover:text-red-600 transition-colors">
              الشروط والأحكام
            </Link>
            <Link href="/privacy-policy" className="hover:text-red-600 transition-colors">
              سياسة الخصوصية
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}