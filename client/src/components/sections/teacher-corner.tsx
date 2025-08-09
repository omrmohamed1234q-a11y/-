import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const teacherMaterials = [
  {
    id: '1',
    title: 'أوراق عمل الرياضيات',
    subtitle: 'الصف الأول الثانوي • جديد',
    icon: 'fas fa-file-alt',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    badge: { text: 'مجاني', variant: 'success' as const },
  },
  {
    id: '2',
    title: 'بنك أسئلة العلوم',
    subtitle: '١٠٠٠+ سؤال مع الإجابات',
    icon: 'fas fa-question-circle',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    badge: { text: 'مميز', variant: 'destructive' as const },
  },
  {
    id: '3',
    title: 'خطط دروس أسبوعية',
    subtitle: 'جاهزة للطباعة والتخصيص',
    icon: 'fas fa-calendar-alt',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    badge: { text: 'جديد', variant: 'secondary' as const },
  },
];

const curricula = [
  {
    id: 'egyptian',
    name: 'المنهج المصري',
    subtitle: 'وزارة التربية والتعليم',
    active: true,
  },
  {
    id: 'cambridge',
    name: 'منهج كامبريدج',
    subtitle: 'Cambridge International',
    active: false,
  },
  {
    id: 'american',
    name: 'المنهج الأمريكي',
    subtitle: 'Common Core Standards',
    active: false,
  },
];

const subscriptionFeatures = [
  'طباعة مجانية شهرية (١٠٠ صفحة)',
  'مكتبة تفاعلية للمناهج',
  'أوراق عمل قابلة للتخصيص',
  'دعم فني أولوية',
];

export default function TeacherCorner() {
  const handleSubscribe = () => {
    // TODO: Navigate to subscription page
    console.log('Subscribe to teacher plan');
  };

  const handleMaterialClick = (materialId: string) => {
    // TODO: Open material details or download
    console.log('Material clicked:', materialId);
  };

  const handleCurriculumSelect = (curriculumId: string) => {
    // TODO: Filter content by curriculum
    console.log('Curriculum selected:', curriculumId);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center ml-3">
                <i className="fas fa-chalkboard-teacher text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-900">ركن المعلمين</h2>
                <p className="text-sm text-blue-700">محتوى تعليمي متخصص ومواد منهجية</p>
              </div>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubscribe}
            >
              انضم الآن
              <i className="fas fa-arrow-left mr-2 rtl-flip"></i>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Teacher Subscription Plan */}
            <Card className="border-2 border-blue-200 bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-crown text-blue-600 text-2xl"></i>
                </div>
                <h3 className="font-bold text-lg mb-2">اشتراك المعلم المميز</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  وصول حصري لجميع المواد التعليمية
                </p>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-blue-600 arabic-nums">٩٩</span>
                  <span className="text-sm text-muted-foreground mr-1">جنيه/شهرياً</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6 text-right">
                  {subscriptionFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <i className="fas fa-check text-success ml-2 flex-shrink-0"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSubscribe}
                >
                  ابدأ التجربة المجانية
                </Button>
              </CardContent>
            </Card>
            
            {/* Quick Access Materials */}
            <div className="space-y-4">
              <h3 className="font-bold text-blue-900 mb-4">مواد سريعة الوصول</h3>
              
              <div className="space-y-3">
                {teacherMaterials.map((material) => (
                  <Card
                    key={material.id}
                    className="bg-white hover-lift cursor-pointer"
                    onClick={() => handleMaterialClick(material.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 ${material.iconBg} rounded-lg flex items-center justify-center ml-3`}>
                          <i className={`${material.icon} ${material.iconColor}`}></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{material.title}</h4>
                          <p className="text-xs text-muted-foreground">{material.subtitle}</p>
                        </div>
                        <Badge variant={material.badge.variant}>
                          {material.badge.text}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Curriculum Filters */}
            <div>
              <h3 className="font-bold text-blue-900 mb-4">تصفية حسب المنهج</h3>
              <div className="space-y-3">
                {curricula.map((curriculum) => (
                  <Card
                    key={curriculum.id}
                    className={`cursor-pointer hover-lift ${
                      curriculum.active 
                        ? 'border-2 border-blue-200 bg-white' 
                        : 'bg-white hover:border-blue-100'
                    }`}
                    onClick={() => handleCurriculumSelect(curriculum.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          <span className="font-medium">{curriculum.name}</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {curriculum.subtitle}
                          </p>
                        </div>
                        <i className={`fas fa-chevron-left ${
                          curriculum.active ? 'text-blue-600' : 'text-muted-foreground'
                        } rtl-flip`}></i>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
