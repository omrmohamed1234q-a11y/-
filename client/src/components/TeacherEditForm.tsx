import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface TeacherEditFormProps {
  teacher: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function TeacherEditForm({ teacher, isOpen, onClose, onSave }: TeacherEditFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+20',
    specialization: '',
    school: '',
    educationLevel: 'bachelor',
    university: '',
    graduationYear: new Date().getFullYear(),
    yearsOfExperience: 0,
    gradesTaught: [] as string[],
    subjectsSpecialty: [] as string[],
    bio: '',
    isVerified: false,
    status: 'active'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (teacher) {
      setFormData({
        fullName: teacher.fullName || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        countryCode: teacher.countryCode || '+20',
        specialization: teacher.specialization || '',
        school: teacher.school || '',
        educationLevel: teacher.educationLevel || 'bachelor',
        university: teacher.university || '',
        graduationYear: teacher.graduationYear || new Date().getFullYear(),
        yearsOfExperience: teacher.yearsOfExperience || 0,
        gradesTaught: teacher.gradesTaught || [],
        subjectsSpecialty: teacher.subjectsSpecialty || [],
        bio: teacher.bio || '',
        isVerified: teacher.isVerified || false,
        status: teacher.status || 'active'
      });
    }
  }, [teacher]);

  const validatePhone = (phone: string, countryCode: string) => {
    const digits = phone.replace(/\D/g, '');
    
    if (countryCode === '+20') {
      return digits.length === 10 && digits.startsWith('1');
    }
    if (countryCode === '+966') {
      return digits.length === 9 && digits.startsWith('5');
    }
    if (countryCode === '+971') {
      return digits.length === 9 && digits.startsWith('5');
    }
    
    return digits.length >= 8;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhone(formData.phone, formData.countryCode)) {
      toast({
        title: "خطأ في رقم الهاتف",
        description: "يرجى إدخال رقم هاتف صحيح",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
  };

  const addGrade = (grade: string) => {
    if (!formData.gradesTaught.includes(grade)) {
      setFormData(prev => ({
        ...prev,
        gradesTaught: [...prev.gradesTaught, grade]
      }));
    }
  };

  const removeGrade = (grade: string) => {
    setFormData(prev => ({
      ...prev,
      gradesTaught: prev.gradesTaught.filter(g => g !== grade)
    }));
  };

  const addSubject = (subject: string) => {
    if (!formData.subjectsSpecialty.includes(subject)) {
      setFormData(prev => ({
        ...prev,
        subjectsSpecialty: [...prev.subjectsSpecialty, subject]
      }));
    }
  };

  const removeSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjectsSpecialty: prev.subjectsSpecialty.filter(s => s !== subject)
    }));
  };

  const gradeOptions = [
    { value: 'kg_1', label: 'الروضة الأولى' },
    { value: 'kg_2', label: 'الروضة الثانية' },
    { value: 'primary_1', label: 'الأول الابتدائي' },
    { value: 'primary_2', label: 'الثاني الابتدائي' },
    { value: 'primary_3', label: 'الثالث الابتدائي' },
    { value: 'primary_4', label: 'الرابع الابتدائي' },
    { value: 'primary_5', label: 'الخامس الابتدائي' },
    { value: 'primary_6', label: 'السادس الابتدائي' },
    { value: 'preparatory_1', label: 'الأول الإعدادي' },
    { value: 'preparatory_2', label: 'الثاني الإعدادي' },
    { value: 'preparatory_3', label: 'الثالث الإعدادي' },
    { value: 'secondary_1', label: 'الأول الثانوي' },
    { value: 'secondary_2', label: 'الثاني الثانوي' },
    { value: 'secondary_3', label: 'الثالث الثانوي' },
  ];

  const subjectOptions = [
    { value: 'arabic', label: 'اللغة العربية' },
    { value: 'english', label: 'اللغة الإنجليزية' },
    { value: 'french', label: 'اللغة الفرنسية' },
    { value: 'math', label: 'الرياضيات' },
    { value: 'science', label: 'العلوم' },
    { value: 'physics', label: 'الفيزياء' },
    { value: 'chemistry', label: 'الكيمياء' },
    { value: 'biology', label: 'الأحياء' },
    { value: 'history', label: 'التاريخ' },
    { value: 'geography', label: 'الجغرافيا' },
    { value: 'islamic', label: 'التربية الإسلامية' },
    { value: 'philosophy', label: 'الفلسفة والمنطق' },
    { value: 'psychology', label: 'علم النفس والاجتماع' },
    { value: 'computer', label: 'الحاسب الآلي' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {teacher?.id ? 'تحرير بيانات المعلم' : 'إضافة معلم جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">الاسم الكامل *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="الاسم الكامل"
                className="text-right"
                data-testid="input-teacher-fullname"
              />
            </div>

            <div>
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="البريد الإلكتروني"
                className="text-right"
                data-testid="input-teacher-email"
              />
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.countryCode} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
                >
                  <SelectTrigger className="w-24" data-testid="select-teacher-country-code">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+20">🇪🇬 +20</SelectItem>
                    <SelectItem value="+966">🇸🇦 +966</SelectItem>
                    <SelectItem value="+971">🇦🇪 +971</SelectItem>
                    <SelectItem value="+965">🇰🇼 +965</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="رقم الهاتف"
                  className="flex-1 text-right"
                  data-testid="input-teacher-phone"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialization">التخصص الرئيسي</Label>
              <Select 
                value={formData.specialization} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
              >
                <SelectTrigger data-testid="select-teacher-specialization">
                  <SelectValue placeholder="اختر التخصص" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map(subject => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Education Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="school">المدرسة/المؤسسة</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                placeholder="اسم المدرسة أو المؤسسة"
                className="text-right"
                data-testid="input-teacher-school"
              />
            </div>

            <div>
              <Label htmlFor="educationLevel">المؤهل التعليمي</Label>
              <Select 
                value={formData.educationLevel} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, educationLevel: value }))}
              >
                <SelectTrigger data-testid="select-teacher-education">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diploma">دبلوم</SelectItem>
                  <SelectItem value="bachelor">بكالوريوس</SelectItem>
                  <SelectItem value="master">ماجستير</SelectItem>
                  <SelectItem value="phd">دكتوراه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="university">الجامعة</Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                placeholder="اسم الجامعة"
                className="text-right"
                data-testid="input-teacher-university"
              />
            </div>

            <div>
              <Label htmlFor="graduationYear">سنة التخرج</Label>
              <Input
                id="graduationYear"
                type="number"
                value={formData.graduationYear}
                onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: parseInt(e.target.value) }))}
                min="1970"
                max={new Date().getFullYear()}
                data-testid="input-teacher-graduation-year"
              />
            </div>

            <div>
              <Label htmlFor="yearsOfExperience">سنوات الخبرة</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) }))}
                min="0"
                max="50"
                data-testid="input-teacher-experience"
              />
            </div>
          </div>

          {/* Grades Taught */}
          <div>
            <Label>الصفوف التي يدرسها</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.gradesTaught.map(grade => (
                <Badge key={grade} variant="secondary" className="cursor-pointer" onClick={() => removeGrade(grade)}>
                  {gradeOptions.find(g => g.value === grade)?.label} ✕
                </Badge>
              ))}
            </div>
            <Select onValueChange={addGrade}>
              <SelectTrigger data-testid="select-teacher-grades">
                <SelectValue placeholder="إضافة صف دراسي" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.filter(grade => !formData.gradesTaught.includes(grade.value)).map(grade => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subjects Specialty */}
          <div>
            <Label>المواد التخصصية</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.subjectsSpecialty.map(subject => (
                <Badge key={subject} variant="secondary" className="cursor-pointer" onClick={() => removeSubject(subject)}>
                  {subjectOptions.find(s => s.value === subject)?.label} ✕
                </Badge>
              ))}
            </div>
            <Select onValueChange={addSubject}>
              <SelectTrigger data-testid="select-teacher-subjects">
                <SelectValue placeholder="إضافة مادة تخصصية" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.filter(subject => !formData.subjectsSpecialty.includes(subject.value)).map(subject => (
                  <SelectItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">السيرة الذاتية</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="نبذة مختصرة عن المعلم وخبرته..."
              className="text-right"
              rows={3}
              data-testid="textarea-teacher-bio"
            />
          </div>

          {/* Status and Verification */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                checked={formData.isVerified}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVerified: checked }))}
                data-testid="switch-teacher-verified"
              />
              <Label>معلم معتمد</Label>
            </div>

            <div>
              <Label htmlFor="status">الحالة</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32" data-testid="select-teacher-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-teacher">
              إلغاء
            </Button>
            <Button type="submit" data-testid="button-save-teacher">
              {teacher?.id ? 'حفظ التغييرات' : 'إضافة المعلم'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}