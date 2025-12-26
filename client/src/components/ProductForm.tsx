import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Plus } from "lucide-react";

interface ProductFormProps {
  editingProduct?: any;
  onSubmit: (productData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ editingProduct, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: editingProduct?.name || '',
    nameEn: editingProduct?.nameEn || '',
    description: editingProduct?.description || '',
    descriptionEn: editingProduct?.descriptionEn || '',
    category: editingProduct?.category || '',
    price: editingProduct?.price || '',
    originalPrice: editingProduct?.originalPrice || '',

    // Educational Fields
    curriculumType: editingProduct?.curriculumType || '',
    subject: editingProduct?.subject || '',
    gradeLevel: editingProduct?.gradeLevel || '',
    authorPublisher: editingProduct?.authorPublisher || '',

    // Product Types
    productTypes: editingProduct?.productTypes || [],
    isDigital: editingProduct?.isDigital || false,
    downloadUrl: editingProduct?.downloadUrl || '',
    downloadLimits: editingProduct?.downloadLimits || 'unlimited',

    // Print Options
    coverType: editingProduct?.coverType || 'color',
    availableCopies: editingProduct?.availableCopies || 0,
    canPrintDirectly: editingProduct?.canPrintDirectly || false,

    // Features
    featured: editingProduct?.featured || false,
    teacherOnly: editingProduct?.teacherOnly || false,
    vip: editingProduct?.vip || false,

    // Media
    imageUrl: editingProduct?.imageUrl || '',

    // Delivery Type
    deliveryType: editingProduct?.deliveryType || 'same_day', // 'same_day' or 'reservation'
    reservationDays: editingProduct?.reservationDays || 0
  });

  const curriculumOptions = [
    { value: 'egyptian_arabic', label: 'المنهج المصري - عربي' },
    { value: 'egyptian_languages', label: 'المنهج المصري - لغات' },
    { value: 'azhar', label: 'منهج الأزهر الشريف' },
    { value: 'igcse', label: 'IGCSE البريطاني' },
    { value: 'american', label: 'الدبلومة الأمريكية' },
    { value: 'ib', label: 'البكالوريا الدولية IB' },
    { value: 'stem', label: 'مدارس STEM' }
  ];

  const subjectOptions = [
    { value: 'arabic', label: 'اللغة العربية' },
    { value: 'english', label: 'اللغة الإنجليزية' },
    { value: 'french', label: 'اللغة الفرنسية' },
    { value: 'math', label: 'الرياضيات' },
    { value: 'science', label: 'العلوم' },
    { value: 'chemistry', label: 'الكيمياء' },
    { value: 'physics', label: 'الفيزياء' },
    { value: 'biology', label: 'الأحياء' },
    { value: 'geography', label: 'الجغرافيا' },
    { value: 'history', label: 'التاريخ' },
    { value: 'philosophy', label: 'الفلسفة' },
    { value: 'psychology', label: 'علم النفس' },
    { value: 'sociology', label: 'علم الاجتماع' },
    { value: 'islamic_studies', label: 'التربية الإسلامية' },
    { value: 'computer_science', label: 'الحاسب الآلي' }
  ];

  const gradeLevelOptions = [
    { value: 'kg_1', label: 'روضة أولى' },
    { value: 'kg_2', label: 'روضة ثانية' },
    { value: 'primary_1', label: 'الأول الابتدائي' },
    { value: 'primary_2', label: 'الثاني الابتدائي' },
    { value: 'primary_3', label: 'الثالث الابتدائي' },
    { value: 'primary_4', label: 'الرابع الابتدائي' },
    { value: 'primary_5', label: 'الخامس الابتدائي' },
    { value: 'primary_6', label: 'السادس الابتدائي' },
    { value: 'prep_1', label: 'الأول الإعدادي' },
    { value: 'prep_2', label: 'الثاني الإعدادي' },
    { value: 'prep_3', label: 'الثالث الإعدادي' },
    { value: 'secondary_1', label: 'الأول الثانوي' },
    { value: 'secondary_2', label: 'الثاني الثانوي' },
    { value: 'secondary_3', label: 'الثالث الثانوي' },
    { value: 'university', label: 'جامعي' }
  ];

  const productTypeOptions = [
    { value: 'book', label: 'كتاب مدرسي' },
    { value: 'workbook', label: 'كتاب تمارين' },
    { value: 'pdf', label: 'ملف PDF' },
    { value: 'worksheets', label: 'أوراق عمل' },
    { value: 'exams', label: 'امتحانات' },
    { value: 'solutions', label: 'إجابات نموذجية' },
    { value: 'notes', label: 'ملخصات' },
    { value: 'flashcards', label: 'بطاقات تعليمية' }
  ];

  const categoryOptions = [
    { value: 'books', label: 'الكتب المدرسية' },
    { value: 'workbooks', label: 'كتب التمارين' },
    { value: 'exams', label: 'نماذج الامتحانات' },
    { value: 'notes', label: 'الملخصات والمراجعات' },
    { value: 'stationery', label: 'الأدوات المكتبية' },
    { value: 'digital', label: 'المحتوى الرقمي' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      productTypes: prev.productTypes.includes(type)
        ? prev.productTypes.filter((t: string) => t !== type)
        : [...prev.productTypes, type]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadToCloudinary(file);
      if (imageUrl) {
        handleInputChange('imageUrl', imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            {editingProduct ? 'تحرير المنتج' : 'إضافة منتج جديد'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">المعلومات الأساسية</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم المنتج (بالعربية) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="أدخل اسم المنتج"
                  required
                />
              </div>

              <div>
                <Label htmlFor="nameEn">اسم المنتج (بالإنجليزية)</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  placeholder="Product name in English"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">الوصف (بالعربية) *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="وصف تفصيلي للمنتج"
                required
              />
            </div>

            <div>
              <Label htmlFor="descriptionEn">الوصف (بالإنجليزية)</Label>
              <Textarea
                id="descriptionEn"
                value={formData.descriptionEn}
                onChange={(e) => handleInputChange('descriptionEn', e.target.value)}
                placeholder="Product description in English"
              />
            </div>
          </div>

          {/* Educational Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">المعلومات التعليمية</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="curriculumType">نوع المنهج</Label>
                <Select value={formData.curriculumType} onValueChange={(value) => handleInputChange('curriculumType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المنهج" />
                  </SelectTrigger>
                  <SelectContent>
                    {curriculumOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">المادة الدراسية</Label>
                <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gradeLevel">المرحلة الدراسية</Label>
                <Select value={formData.gradeLevel} onValueChange={(value) => handleInputChange('gradeLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المرحلة الدراسية" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevelOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="authorPublisher">المؤلف/الناشر</Label>
                <Input
                  id="authorPublisher"
                  value={formData.authorPublisher}
                  onChange={(e) => handleInputChange('authorPublisher', e.target.value)}
                  placeholder="اسم المؤلف أو الناشر"
                />
              </div>
            </div>
          </div>

          {/* Product Categories and Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">فئة ونوع المنتج</h3>

            <div>
              <Label htmlFor="category">فئة المنتج</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة المنتج" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>أنواع المنتج</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {productTypeOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={option.value}
                      checked={formData.productTypes.includes(option.value)}
                      onCheckedChange={() => handleProductTypeToggle(option.value)}
                    />
                    <Label htmlFor={option.value} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.productTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.productTypes.map((type: string) => {
                    const option = productTypeOptions.find(opt => opt.value === type);
                    return (
                      <Badge key={type} variant="secondary">
                        {option?.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">السعر والتوفر</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">السعر (جنيه مصري) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="originalPrice">السعر الأصلي (قبل الخصم)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="availableCopies">عدد النسخ المتاحة</Label>
                <Input
                  id="availableCopies"
                  type="number"
                  value={formData.availableCopies}
                  onChange={(e) => handleInputChange('availableCopies', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Digital Content Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">خيارات المحتوى الرقمي</h3>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="isDigital"
                checked={formData.isDigital}
                onCheckedChange={(checked) => handleInputChange('isDigital', checked)}
              />
              <Label htmlFor="isDigital">منتج رقمي (قابل للتحميل)</Label>
            </div>

            {formData.isDigital && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="downloadUrl">رابط التحميل</Label>
                  <Input
                    id="downloadUrl"
                    value={formData.downloadUrl}
                    onChange={(e) => handleInputChange('downloadUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="downloadLimits">حدود التحميل</Label>
                  <Select value={formData.downloadLimits} onValueChange={(value) => handleInputChange('downloadLimits', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حد التحميل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">مرة واحدة فقط</SelectItem>
                      <SelectItem value="limited">محدود</SelectItem>
                      <SelectItem value="unlimited">غير محدود</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Print Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">خيارات الطباعة</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coverType">نوع الغلاف</Label>
                <Select value={formData.coverType} onValueChange={(value) => handleInputChange('coverType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الغلاف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">ملون</SelectItem>
                    <SelectItem value="black_white">أبيض وأسود</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="canPrintDirectly"
                  checked={formData.canPrintDirectly}
                  onCheckedChange={(checked) => handleInputChange('canPrintDirectly', checked)}
                />
                <Label htmlFor="canPrintDirectly">يمكن طباعته مباشرة</Label>
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">صورة المنتج</h3>

            <div>
              <Label htmlFor="imageUrl">رابط صورة المنتج</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">الصق رابط الصورة من Cloudinary أو أي مصدر آخر</p>

              {formData.imageUrl && (
                <div className="mt-4">
                  <img
                    src={formData.imageUrl}
                    alt="Product preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+URL';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Delivery Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">نوع التوصيل</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryType">طريقة التوصيل</Label>
                <Select value={formData.deliveryType} onValueChange={(value) => handleInputChange('deliveryType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة التوصيل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same_day">شحن في نفس اليوم</SelectItem>
                    <SelectItem value="reservation">بالحجز (الاستلام بعد مدة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.deliveryType === 'reservation' && (
                <div>
                  <Label htmlFor="reservationDays">عدد الأيام للاستلام</Label>
                  <Input
                    id="reservationDays"
                    type="number"
                    min="1"
                    value={formData.reservationDays}
                    onChange={(e) => handleInputChange('reservationDays', parseInt(e.target.value) || 0)}
                    placeholder="عدد الأيام"
                  />
                  <p className="text-xs text-gray-500 mt-1">مثال: 7 أيام للاستلام</p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">المميزات الخاصة</h3>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleInputChange('featured', checked)}
                />
                <Label htmlFor="featured">منتج مميز</Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="teacherOnly"
                  checked={formData.teacherOnly}
                  onCheckedChange={(checked) => handleInputChange('teacherOnly', checked)}
                />
                <Label htmlFor="teacherOnly">للمعلمين فقط</Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="vip"
                  checked={formData.vip}
                  onCheckedChange={(checked) => handleInputChange('vip', checked)}
                />
                <Label htmlFor="vip">VIP</Label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'جاري الحفظ...' : editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}