import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertProductSchema } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { motion } from 'framer-motion';
import { Save, X, Upload, Tag } from 'lucide-react';
import { z } from 'zod';

const formSchema = insertProductSchema.extend({
  tags: z.string().optional()
});

interface ProductFormProps {
  product?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [newTag, setNewTag] = useState('');

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || '',
      nameEn: product?.nameEn || '',
      description: product?.description || '',
      descriptionEn: product?.descriptionEn || '',
      category: product?.category || '',
      price: product?.price || '',
      originalPrice: product?.originalPrice || '',
      imageUrl: product?.imageUrl || '',
      isDigital: product?.isDigital || false,
      downloadUrl: product?.downloadUrl || '',
      grade: product?.grade || '',
      subject: product?.subject || '',
      publisher: product?.publisher || '',
      curriculum: product?.curriculum || '',
      stock: product?.stock || 0,
      featured: product?.featured || false,
      tags: product?.tags?.join(', ') || ''
    }
  });

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (data: any) => {
    const formattedData = {
      ...data,
      tags: tags,
      price: parseFloat(data.price) || 0,
      originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
      stock: parseInt(data.stock) || 0
    };
    onSubmit(formattedData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      dir="rtl"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Save className="w-5 h-5 text-blue-500" />
            <span>{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المنتج (عربي)</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم المنتج بالعربية" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المنتج (إنجليزي)</FormLabel>
                      <FormControl>
                        <Input placeholder="Product name in English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف (عربي)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="وصف المنتج بالعربية"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف (إنجليزي)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Product description in English"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category and Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="books">كتب</SelectItem>
                          <SelectItem value="stationery">قرطاسية</SelectItem>
                          <SelectItem value="digital">منتجات رقمية</SelectItem>
                          <SelectItem value="templates">قوالب</SelectItem>
                          <SelectItem value="exam_papers">أوراق امتحانات</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر (جنيه مصري)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر الأصلي (اختياري)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Educational Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الصف الدراسي</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الصف" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg1">روضة أولى</SelectItem>
                          <SelectItem value="kg2">روضة ثانية</SelectItem>
                          <SelectItem value="grade1">الصف الأول</SelectItem>
                          <SelectItem value="grade2">الصف الثاني</SelectItem>
                          <SelectItem value="grade3">الصف الثالث</SelectItem>
                          <SelectItem value="grade4">الصف الرابع</SelectItem>
                          <SelectItem value="grade5">الصف الخامس</SelectItem>
                          <SelectItem value="grade6">الصف السادس</SelectItem>
                          <SelectItem value="secondary">ثانوي</SelectItem>
                          <SelectItem value="university">جامعي</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المادة</FormLabel>
                      <FormControl>
                        <Input placeholder="مثل: الرياضيات، العلوم..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="curriculum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المنهج</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المنهج" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="egyptian">المنهج المصري</SelectItem>
                          <SelectItem value="american">المنهج الأمريكي</SelectItem>
                          <SelectItem value="british">المنهج البريطاني</SelectItem>
                          <SelectItem value="international">المنهج الدولي</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label>العلامات</Label>
                <div className="flex space-x-2 space-x-reverse">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="أضف علامة جديدة"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1 space-x-reverse">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Image and Digital Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط الصورة</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية المتاحة</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Toggles */}
              <div className="flex space-x-6 space-x-reverse">
                <FormField
                  control={form.control}
                  name="isDigital"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>منتج رقمي</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>منتج مميز</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Download URL for digital products */}
              {form.watch('isDigital') && (
                <FormField
                  control={form.control}
                  name="downloadUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط التحميل</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/download.pdf" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 space-x-reverse">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>جاري الحفظ...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Save className="w-4 h-4" />
                      <span>حفظ المنتج</span>
                    </div>
                  )}
                </Button>
                
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="w-4 h-4 mr-2" />
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ProductForm;