import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CURRICULUM_TYPES, 
  SUBJECTS, 
  GRADE_LEVELS, 
  PRODUCT_TYPES, 
  COVER_TYPES, 
  DOWNLOAD_LIMITS,
} from '@/lib/constants/education';
import { Upload, X } from 'lucide-react';

const productFormSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  nameEn: z.string().optional(),
  description: z.string().min(10, 'وصف المنتج يجب أن يكون 10 أحرف على الأقل'),
  descriptionEn: z.string().optional(),
  category: z.string().min(1, 'الفئة مطلوبة'),
  price: z.string().min(1, 'السعر مطلوب'),
  originalPrice: z.string().optional(),
  
  // Educational fields
  curriculumType: z.string().optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  authorPublisher: z.string().optional(),
  
  // Product types (multi-select)
  productTypes: z.array(z.string()).optional(),
  
  // Digital options
  isDigital: z.boolean().default(false),
  downloadUrl: z.string().optional(),
  downloadLimits: z.string().optional(),
  
  // Print options
  coverType: z.string().optional(),
  availableCopies: z.number().min(0).optional(),
  canPrintDirectly: z.boolean().default(false),
  
  // Other options
  featured: z.boolean().default(false),
  teacherOnly: z.boolean().default(false),
  vip: z.boolean().default(false),
  
  // Image
  imageUrl: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
}

export default function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(
    initialData?.productTypes || []
  );
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.imageUrl || '');

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      nameEn: initialData?.nameEn || '',
      description: initialData?.description || '',
      descriptionEn: initialData?.descriptionEn || '',
      category: initialData?.category || '',
      price: initialData?.price || '',
      originalPrice: initialData?.originalPrice || '',
      curriculumType: initialData?.curriculumType || '',
      subject: initialData?.subject || '',
      gradeLevel: initialData?.gradeLevel || '',
      authorPublisher: initialData?.authorPublisher || '',
      productTypes: initialData?.productTypes || [],
      isDigital: initialData?.isDigital || false,
      downloadUrl: initialData?.downloadUrl || '',
      downloadLimits: initialData?.downloadLimits || 'unlimited',
      coverType: initialData?.coverType || 'color',
      availableCopies: initialData?.availableCopies || 0,
      canPrintDirectly: initialData?.canPrintDirectly || false,
      featured: initialData?.featured || false,
      teacherOnly: initialData?.teacherOnly || false,
      vip: initialData?.vip || false,
      imageUrl: initialData?.imageUrl || '',
    },
  });

  const handleProductTypeChange = (productType: string, checked: boolean) => {
    const newTypes = checked 
      ? [...selectedProductTypes, productType]
      : selectedProductTypes.filter(type => type !== productType);
    
    setSelectedProductTypes(newTypes);
    form.setValue('productTypes', newTypes);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real app, upload to Cloudinary here
    // For now, create a temporary URL
    const tempUrl = URL.createObjectURL(file);
    setCoverImageUrl(tempUrl);
    form.setValue('imageUrl', tempUrl);
  };

  const submitForm = (data: ProductFormData) => {
    onSubmit({
      ...data,
      productTypes: selectedProductTypes,
      imageUrl: coverImageUrl,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(submitForm)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>المعلومات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">اسم المنتج *</Label>
              <Input 
                id="name" 
                {...form.register('name')}
                placeholder="مثال: كتاب الرياضيات للصف الثاني الثانوي"
                data-testid="input-product-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="nameEn">اسم المنتج (English)</Label>
              <Input 
                id="nameEn" 
                {...form.register('nameEn')}
                placeholder="Mathematics Book Grade 11"
                data-testid="input-product-name-en"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">وصف المنتج *</Label>
            <Textarea 
              id="description" 
              {...form.register('description')}
              placeholder="وصف مفصل للمنتج..."
              rows={3}
              data-testid="textarea-product-description"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">السعر (جنيه) *</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01" 
                {...form.register('price')}
                placeholder="50.00"
                data-testid="input-product-price"
              />
            </div>
            
            <div>
              <Label htmlFor="originalPrice">السعر الأصلي (للخصم)</Label>
              <Input 
                id="originalPrice" 
                type="number" 
                step="0.01" 
                {...form.register('originalPrice')}
                placeholder="75.00"
                data-testid="input-product-original-price"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Educational Information */}
      <Card>
        <CardHeader>
          <CardTitle>المعلومات التعليمية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="curriculumType">نوع المنهج</Label>
              <Select 
                value={form.watch('curriculumType')} 
                onValueChange={(value) => form.setValue('curriculumType', value)}
              >
                <SelectTrigger data-testid="select-curriculum-type">
                  <SelectValue placeholder="اختر نوع المنهج" />
                </SelectTrigger>
                <SelectContent>
                  {CURRICULUM_TYPES.map((curriculum) => (
                    <SelectItem key={curriculum.value} value={curriculum.value}>
                      {curriculum.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">المادة الدراسية</Label>
              <Select 
                value={form.watch('subject')} 
                onValueChange={(value) => form.setValue('subject', value)}
              >
                <SelectTrigger data-testid="select-subject">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gradeLevel">المرحلة الدراسية</Label>
              <Select 
                value={form.watch('gradeLevel')} 
                onValueChange={(value) => form.setValue('gradeLevel', value)}
              >
                <SelectTrigger data-testid="select-grade-level">
                  <SelectValue placeholder="اختر المرحلة الدراسية" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="authorPublisher">اسم المعلم / المؤلف / الناشر</Label>
              <Input 
                id="authorPublisher" 
                {...form.register('authorPublisher')}
                placeholder="مثال: مستر أحمد محمد"
                data-testid="input-author-publisher"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Types */}
      <Card>
        <CardHeader>
          <CardTitle>نوع المنتج</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRODUCT_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={type.value}
                  checked={selectedProductTypes.includes(type.value)}
                  onCheckedChange={(checked) => handleProductTypeChange(type.value, checked as boolean)}
                  data-testid={`checkbox-product-type-${type.value}`}
                />
                <Label htmlFor={type.value} className="text-sm">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
          
          {selectedProductTypes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedProductTypes.map((type) => (
                <Badge key={type} variant="secondary">
                  {PRODUCT_TYPES.find(t => t.value === type)?.label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital Options */}
      <Card>
        <CardHeader>
          <CardTitle>خيارات رقمية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="isDigital"
              checked={form.watch('isDigital')}
              onCheckedChange={(checked) => form.setValue('isDigital', checked)}
              data-testid="switch-is-digital"
            />
            <Label htmlFor="isDigital">منتج رقمي (PDF)</Label>
          </div>

          {form.watch('isDigital') && (
            <div className="space-y-4 border-r-2 border-blue-200 pr-4">
              <div>
                <Label htmlFor="downloadUrl">رابط التحميل</Label>
                <Input 
                  id="downloadUrl" 
                  {...form.register('downloadUrl')}
                  placeholder="https://example.com/file.pdf"
                  data-testid="input-download-url"
                />
              </div>

              <div>
                <Label htmlFor="downloadLimits">صلاحية التحميل</Label>
                <Select 
                  value={form.watch('downloadLimits')} 
                  onValueChange={(value) => form.setValue('downloadLimits', value)}
                >
                  <SelectTrigger data-testid="select-download-limits">
                    <SelectValue placeholder="اختر صلاحية التحميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOWNLOAD_LIMITS.map((limit) => (
                      <SelectItem key={limit.value} value={limit.value}>
                        {limit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Options */}
      <Card>
        <CardHeader>
          <CardTitle>خيارات الطباعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coverType">نوع الغلاف</Label>
              <Select 
                value={form.watch('coverType')} 
                onValueChange={(value) => form.setValue('coverType', value)}
              >
                <SelectTrigger data-testid="select-cover-type">
                  <SelectValue placeholder="اختر نوع الغلاف" />
                </SelectTrigger>
                <SelectContent>
                  {COVER_TYPES.map((cover) => (
                    <SelectItem key={cover.value} value={cover.value}>
                      {cover.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="availableCopies">عدد النسخ المتاحة</Label>
              <Input 
                id="availableCopies" 
                type="number" 
                min="0"
                {...form.register('availableCopies', { valueAsNumber: true })}
                placeholder="100"
                data-testid="input-available-copies"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="canPrintDirectly"
              checked={form.watch('canPrintDirectly')}
              onCheckedChange={(checked) => form.setValue('canPrintDirectly', checked)}
              data-testid="switch-can-print-directly"
            />
            <Label htmlFor="canPrintDirectly">إمكانية الطباعة مباشرة</Label>
          </div>
        </CardContent>
      </Card>

      {/* Cover Image */}
      <Card>
        <CardHeader>
          <CardTitle>صورة الغلاف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="coverImage">تحميل صورة الغلاف</Label>
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
                data-testid="input-cover-image"
              />
            </div>

            {coverImageUrl && (
              <div className="relative inline-block">
                <img 
                  src={coverImageUrl} 
                  alt="غلاف المنتج" 
                  className="w-32 h-40 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={() => {
                    setCoverImageUrl('');
                    form.setValue('imageUrl', '');
                  }}
                  data-testid="button-remove-cover-image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Options */}
      <Card>
        <CardHeader>
          <CardTitle>خيارات إضافية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="featured"
              checked={form.watch('featured')}
              onCheckedChange={(checked) => form.setValue('featured', checked)}
              data-testid="switch-featured"
            />
            <Label htmlFor="featured">منتج مميز</Label>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="teacherOnly"
              checked={form.watch('teacherOnly')}
              onCheckedChange={(checked) => form.setValue('teacherOnly', checked)}
              data-testid="switch-teacher-only"
            />
            <Label htmlFor="teacherOnly">للمعلمين فقط</Label>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="vip"
              checked={form.watch('vip')}
              onCheckedChange={(checked) => form.setValue('vip', checked)}
              data-testid="switch-vip"
            />
            <Label htmlFor="vip">VIP</Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2 space-x-reverse">
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-submit-product"
        >
          {isLoading ? 'جاري الحفظ...' : (initialData ? 'تحديث المنتج' : 'إضافة المنتج')}
        </Button>
      </div>
    </form>
  );
}