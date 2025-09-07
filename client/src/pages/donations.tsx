import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, Users, GraduationCap, Star, Gift } from 'lucide-react';
import { useLocation } from 'wouter';

interface DonationFormData {
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donationType: 'students' | 'palestine';
  amount: number;
  customAmount: string;
  isAnonymous: boolean;
}

export default function DonationsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'students' | 'palestine'>('students');
  const [formData, setFormData] = useState<DonationFormData>({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    donationType: 'students',
    amount: 0,
    customAmount: '',
    isAnonymous: false
  });

  const predefinedAmounts = {
    students: [10, 25, 50, 100, 200, 500],
    palestine: [15, 30, 75, 150, 300, 750]
  };

  const handleInputChange = (field: keyof DonationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'donationType' && { amount: 0, customAmount: '' })
    }));
  };

  const handleAmountSelection = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      amount,
      customAmount: ''
    }));
  };

  const handleCustomAmount = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      customAmount: value,
      amount: numValue
    }));
  };

  const handleSubmit = async () => {
    if (!formData.donorName || !formData.donorEmail || !formData.donorPhone || !formData.amount) {
      toast({
        title: 'بيانات مفقودة',
        description: 'برجاء إكمال جميع البيانات المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call for donation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'شكراً لك! 🤲',
        description: `تم استقبال تبرعك بقيمة ${formData.amount} جنيه بنجاح. سيتم التواصل معك قريباً.`,
      });
      
      // Reset form
      setFormData({
        donorName: '',
        donorEmail: '',
        donorPhone: '',
        donationType: selectedTab,
        amount: 0,
        customAmount: '',
        isAnonymous: false
      });
      
    } catch (error) {
      toast({
        title: 'خطأ في الإرسال',
        description: 'حدث خطأ أثناء إرسال التبرع. برجاء المحاولة مرة أخرى.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50" dir="rtl">
      {/* Palestinian Flag Strip */}
      <div className="w-full h-3 bg-gradient-to-r from-red-600 via-white via-black to-green-600" />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, #CE1126, #007A3D)' }}
              >
                🤲
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">صندوق التبرعات</h1>
                <p className="text-gray-600">ساهم في دعم التعليم والإنسانية</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex mb-8 bg-white rounded-full p-2 shadow-lg">
          <button
            onClick={() => {
              setSelectedTab('students');
              handleInputChange('donationType', 'students');
            }}
            className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-full transition-all ${
              selectedTab === 'students' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            data-testid="students-tab"
          >
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">دعم الطلاب الفقراء</span>
          </button>
          <button
            onClick={() => {
              setSelectedTab('palestine');
              handleInputChange('donationType', 'palestine');
            }}
            className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-full transition-all ${
              selectedTab === 'palestine' 
                ? 'text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={{ 
              backgroundColor: selectedTab === 'palestine' ? '#CE1126' : undefined 
            }}
            data-testid="palestine-tab"
          >
            <span className="text-lg">🇵🇸</span>
            <span className="font-semibold">دعم أطفال فلسطين</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donation Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {selectedTab === 'students' ? (
                  <>
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                    <span>دعم الطلاب الفقراء</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">🇵🇸</span>
                    <span>دعم أطفال فلسطين</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Donor Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">بيانات المتبرع</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="donorName">الاسم *</Label>
                    <Input
                      id="donorName"
                      value={formData.donorName}
                      onChange={(e) => handleInputChange('donorName', e.target.value)}
                      placeholder="الاسم الكامل"
                      disabled={formData.isAnonymous}
                      data-testid="donor-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="donorPhone">رقم الهاتف *</Label>
                    <Input
                      id="donorPhone"
                      value={formData.donorPhone}
                      onChange={(e) => handleInputChange('donorPhone', e.target.value)}
                      placeholder="01xxxxxxxxx"
                      data-testid="donor-phone-input"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="donorEmail">البريد الإلكتروني *</Label>
                  <Input
                    id="donorEmail"
                    type="email"
                    value={formData.donorEmail}
                    onChange={(e) => handleInputChange('donorEmail', e.target.value)}
                    placeholder="example@domain.com"
                    data-testid="donor-email-input"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.isAnonymous}
                    onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                    data-testid="anonymous-checkbox"
                  />
                  <Label htmlFor="anonymous" className="text-sm text-gray-600">
                    تبرع مجهول
                  </Label>
                </div>
              </div>

              <Separator />

              {/* Amount Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">اختر مبلغ التبرع</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {predefinedAmounts[selectedTab].map((amount) => (
                    <Button
                      key={amount}
                      variant={formData.amount === amount ? "default" : "outline"}
                      onClick={() => handleAmountSelection(amount)}
                      className={`py-8 text-lg font-bold ${
                        formData.amount === amount 
                          ? (selectedTab === 'students' 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : 'hover:bg-red-700'
                            ) 
                          : ''
                      }`}
                      style={{ 
                        backgroundColor: formData.amount === amount && selectedTab === 'palestine' ? '#CE1126' : undefined 
                      }}
                      data-testid={`amount-${amount}`}
                    >
                      {amount} جنيه
                    </Button>
                  ))}
                </div>

                <div>
                  <Label htmlFor="customAmount">مبلغ آخر</Label>
                  <Input
                    id="customAmount"
                    type="number"
                    value={formData.customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    placeholder="أدخل المبلغ بالجنيه"
                    data-testid="custom-amount-input"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.amount}
                className={`w-full py-4 text-lg font-bold ${
                  selectedTab === 'students' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'hover:bg-red-700'
                }`}
                style={{ 
                  backgroundColor: selectedTab === 'palestine' ? '#CE1126' : undefined 
                }}
                data-testid="submit-donation-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent ml-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Heart className="h-5 w-5 ml-2" />
                    تبرع بـ {formData.amount} جنيه
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Information Panel */}
          <div className="space-y-6">
            {selectedTab === 'students' ? (
              <Card className="shadow-lg border-l-4 border-l-blue-600">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    دعم الطلاب الفقراء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      ساهم في توفير المواد التعليمية والدعم الأكاديمي للطلاب الذين يواجهون صعوبات مالية.
                    </p>
                    

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">كيف تساعد؟</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>10 جنيه = كتاب واحد</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>25 جنيه = أدوات مكتبية</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>50 جنيه = مجموعة مواد تعليمية</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-l-4" style={{ borderLeftColor: '#CE1126' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: '#CE1126' }}>
                    <span className="text-lg">🇵🇸</span>
                    دعم أطفال فلسطين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      قدم يد العون للأطفال الفلسطينيين وساهم في توفير احتياجاتهم الأساسية والتعليمية.
                    </p>
                    

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">كيف تساعد؟</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4" style={{ color: '#CE1126' }} />
                          <span>15 جنيه = وجبة غذائية</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4" style={{ color: '#CE1126' }} />
                          <span>30 جنيه = مستلزمات طبية</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4" style={{ color: '#CE1126' }} />
                          <span>75 جنيه = حقيبة إغاثة كاملة</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🤲</span>
            <span className="text-lg font-semibold text-gray-800">معاً نبني مستقبلاً أفضل</span>
            <span className="text-2xl">❤️</span>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            كل تبرع، مهما كان صغيراً، يصنع فرقاً كبيراً في حياة من يحتاجون المساعدة. شكراً لك على كونك جزءاً من رحلة العطاء.
          </p>
        </div>
      </div>
    </div>
  );
}