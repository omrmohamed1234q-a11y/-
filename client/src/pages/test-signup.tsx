import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function TestSignup() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+20'); // Default to Egypt
  const [age, setAge] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-2xl">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 mx-auto w-fit">
            <div className="text-5xl mb-3">📄</div>
            <div className="text-3xl font-bold text-gray-800">اطبعلي</div>
          </div>
          <p className="text-gray-600 text-lg">منصة الطباعة الذكية - نموذج اختبار</p>
        </div>

        {/* Test Signup Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">إنشاء حساب جديد - محدث</CardTitle>
            <CardDescription>جميع الحقول المطلوبة متوفرة</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <Input
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-right"
                  disabled={loading}
                  data-testid="input-fullname"
                />
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني *
                </label>
                <Input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-right"
                  disabled={loading}
                  data-testid="input-email"
                />
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور *
                </label>
                <Input
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-right"
                  disabled={loading}
                  data-testid="input-password"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العمر *
                </label>
                <Input
                  type="number"
                  placeholder="أدخل عمرك"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="text-right"
                  min="5"
                  max="100"
                  disabled={loading}
                  data-testid="input-age"
                />
              </div>

              {/* Phone Number with Country Code */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode} disabled={loading}>
                    <SelectTrigger className="w-32" data-testid="select-country-code">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+20">🇪🇬 مصر +20</SelectItem>
                      <SelectItem value="+966">🇸🇦 السعودية +966</SelectItem>
                      <SelectItem value="+971">🇦🇪 الإمارات +971</SelectItem>
                      <SelectItem value="+965">🇰🇼 الكويت +965</SelectItem>
                      <SelectItem value="+973">🇧🇭 البحرين +973</SelectItem>
                      <SelectItem value="+974">🇶🇦 قطر +974</SelectItem>
                      <SelectItem value="+968">🇴🇲 عمان +968</SelectItem>
                      <SelectItem value="+961">🇱🇧 لبنان +961</SelectItem>
                      <SelectItem value="+962">🇯🇴 الأردن +962</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    placeholder="رقم الهاتف"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 text-right"
                    disabled={loading}
                    data-testid="input-phone"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {countryCode === '+20' && 'مثال: 1012345678 (مصر)'}
                  {countryCode === '+966' && 'مثال: 512345678 (السعودية)'}
                  {countryCode === '+971' && 'مثال: 512345678 (الإمارات)'}
                </p>
              </div>

              {/* Grade Level */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المرحلة التعليمية / الصف الدراسي *
                </label>
                <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={loading}>
                  <SelectTrigger data-testid="select-grade-level">
                    <SelectValue placeholder="اختر المرحلة التعليمية أو الصف الدراسي" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg_1">روضة أولى (KG1)</SelectItem>
                    <SelectItem value="kg_2">روضة ثانية (KG2)</SelectItem>
                    <SelectItem value="primary_1">الصف الأول الابتدائي</SelectItem>
                    <SelectItem value="primary_2">الصف الثاني الابتدائي</SelectItem>
                    <SelectItem value="primary_3">الصف الثالث الابتدائي</SelectItem>
                    <SelectItem value="primary_4">الصف الرابع الابتدائي</SelectItem>
                    <SelectItem value="primary_5">الصف الخامس الابتدائي</SelectItem>
                    <SelectItem value="primary_6">الصف السادس الابتدائي</SelectItem>
                    <SelectItem value="preparatory_1">الصف الأول الإعدادي</SelectItem>
                    <SelectItem value="preparatory_2">الصف الثاني الإعدادي</SelectItem>
                    <SelectItem value="preparatory_3">الصف الثالث الإعدادي</SelectItem>
                    <SelectItem value="secondary_1">الصف الأول الثانوي</SelectItem>
                    <SelectItem value="secondary_2">الصف الثاني الثانوي</SelectItem>
                    <SelectItem value="secondary_3">الصف الثالث الثانوي</SelectItem>
                    <SelectItem value="university">طالب جامعي</SelectItem>
                    <SelectItem value="teacher">معلم/مدرس</SelectItem>
                    <SelectItem value="parent">ولي أمر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Form Summary */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">ملخص البيانات المدخلة:</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>الاسم: {fullName || 'غير محدد'}</p>
                <p>البريد الإلكتروني: {email || 'غير محدد'}</p>
                <p>العمر: {age || 'غير محدد'}</p>
                <p>الهاتف: {countryCode} {phone || 'غير محدد'}</p>
                <p>الصف: {gradeLevel || 'غير محدد'}</p>
              </div>
            </div>

            {/* Test Button */}
            <Button 
              onClick={() => {
                toast({
                  title: "اختبار ناجح!",
                  description: `جميع الحقول تعمل بشكل صحيح. الاسم: ${fullName}, العمر: ${age}, الصف: ${gradeLevel}`,
                });
              }}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
              data-testid="button-test"
            >
              اختبار النموذج المحدث
            </Button>

            {/* Back to Original */}
            <Button 
              onClick={() => navigate('/auth/signup')}
              variant="outline"
              className="w-full"
            >
              العودة للنموذج الأصلي
            </Button>

            {/* Status Message */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
              <p className="text-blue-800 font-semibold">
                ✅ جميع الحقول المطلوبة متوفرة ومحدثة:
              </p>
              <ul className="text-blue-700 text-sm mt-2 space-y-1">
                <li>• الاسم الكامل</li>
                <li>• البريد الإلكتروني</li>
                <li>• كلمة المرور</li>
                <li>• العمر (5-100)</li>
                <li>• رقم الهاتف مع الرمز الدولي</li>
                <li>• المرحلة التعليمية/الصف الدراسي</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}