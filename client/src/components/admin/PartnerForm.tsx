import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { X, Plus, Package } from 'lucide-react';
import type { Partner } from '@shared/schema';
import { PartnerProductsSection } from './PartnerProductsSection';

const partnerFormSchema = z.object({
  name: z.string().min(1, 'اسم الشريك مطلوب'),
  description: z.string().min(1, 'وصف الشريك مطلوب'),
  shortDescription: z.string().optional(),
  logoUrl: z.string().url('يجب أن يكون رابط صحيح').optional().or(z.literal('')),
  coverImageUrl: z.string().url('يجب أن يكون رابط صحيح').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('يجب أن يكون بريد إلكتروني صحيح').optional().or(z.literal('')),
  address: z.string().min(1, 'العنوان مطلوب'),
  city: z.string().min(1, 'المدينة مطلوبة'),
  governorate: z.string().min(1, 'المحافظة مطلوبة'),
  businessType: z.enum(['print_shop', 'bookstore', 'library', 'stationery']),
  establishedYear: z.number().min(1900).max(new Date().getFullYear()),
  services: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  galleryImages: z.array(z.string()).optional(),
  rating: z.string().optional(),
  reviewCount: z.number().min(0).optional(),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  isFeatured: z.boolean(),
  displayOrder: z.number().min(1),
  hasDelivery: z.boolean(),
  deliveryFee: z.string().optional(),
  minOrderForDelivery: z.string().optional(),
  acceptsOnlinePayment: z.boolean(),
});

type PartnerFormData = z.infer<typeof partnerFormSchema>;

interface PartnerFormProps {
  partner?: Partner | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const availableServices = [
  { value: 'printing', label: 'طباعة' },
  { value: 'binding', label: 'تجليد' },
  { value: 'scanning', label: 'مسح ضوئي' },
  { value: 'design', label: 'تصميم' },
  { value: 'photocopying', label: 'تصوير مستندات' },
  { value: 'books', label: 'كتب' },
  { value: 'stationery', label: 'أدوات مكتبية' },
  { value: 'art_supplies', label: 'مستلزمات فنية' },
  { value: 'bags', label: 'حقائب' },
  { value: 'calculators', label: 'آلات حاسبة' },
];

const availableSpecialties = [
  { value: 'textbooks', label: 'الكتب المدرسية' },
  { value: 'university_notes', label: 'مذكرات جامعية' },
  { value: 'exam_materials', label: 'مواد امتحانات' },
  { value: 'research_papers', label: 'أبحاث علمية' },
  { value: 'thesis_printing', label: 'طباعة رسائل علمية' },
  { value: 'business_cards', label: 'كروت شخصية' },
  { value: 'posters', label: 'ملصقات' },
  { value: 'presentations', label: 'عروض تقديمية' },
  { value: 'reference_books', label: 'كتب مراجع' },
  { value: 'school_supplies', label: 'أدوات مدرسية' },
  { value: 'art_supplies', label: 'أدوات فنية' },
];

const governorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
  'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
  'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
  'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر',
  'قنا', 'شمال سيناء', 'سوهاج'
];

export function PartnerForm({ partner, onSuccess, onCancel }: PartnerFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const { toast } = useToast();

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      name: '',
      description: '',
      shortDescription: '',
      logoUrl: '',
      coverImageUrl: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      governorate: '',
      businessType: 'print_shop',
      establishedYear: new Date().getFullYear(),
      services: [],
      specialties: [],
      galleryImages: [],
      rating: '0.00',
      reviewCount: 0,
      isActive: true,
      isVerified: false,
      isFeatured: false,
      displayOrder: 1,
      hasDelivery: false,
      deliveryFee: '0.00',
      minOrderForDelivery: '0.00',
      acceptsOnlinePayment: false,
    },
  });

  useEffect(() => {
    if (partner) {
      form.reset({
        name: partner.name,
        description: partner.description,
        shortDescription: partner.shortDescription || '',
        logoUrl: partner.logoUrl || '',
        coverImageUrl: partner.coverImageUrl || '',
        phone: partner.phone || '',
        email: partner.email || '',
        address: partner.address,
        city: partner.city,
        governorate: partner.governorate,
        businessType: partner.businessType as any,
        establishedYear: partner.establishedYear ?? 2020,
        services: partner.services || [],
        specialties: partner.specialties || [],
        galleryImages: partner.galleryImages || [],
        rating: partner.rating || '0.00',
        reviewCount: partner.reviewCount ?? 0,
        isActive: partner.isActive ?? true,
        isVerified: partner.isVerified ?? false,
        isFeatured: partner.isFeatured ?? false,
        displayOrder: partner.displayOrder ?? 1,
        hasDelivery: partner.hasDelivery ?? false,
        deliveryFee: partner.deliveryFee || '0.00',
        minOrderForDelivery: partner.minOrderForDelivery || '0.00',
        acceptsOnlinePayment: partner.acceptsOnlinePayment ?? false,
      });
      setSelectedServices(partner.services || []);
      setSelectedSpecialties(partner.specialties || []);
      setGalleryUrls(partner.galleryImages || []);
    }
  }, [partner, form]);

  const createMutation = useMutation({
    mutationFn: (data: PartnerFormData) => apiRequest('POST', '/api/admin/partners', data),
    onSuccess: () => {
      toast({
        title: 'تم إنشاء الشريك',
        description: 'تم إضافة الشريك بنجاح',
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: 'خطأ في الإنشاء',
        description: 'حدث خطأ أثناء إضافة الشريك',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PartnerFormData) => 
      apiRequest('PUT', `/api/admin/partners/${partner?.id}`, data),
    onSuccess: () => {
      toast({
        title: 'تم تحديث الشريك',
        description: 'تم تحديث بيانات الشريك بنجاح',
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: 'خطأ في التحديث',
        description: 'حدث خطأ أثناء تحديث الشريك',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: PartnerFormData) => {
    const formData = {
      ...data,
      services: selectedServices,
      specialties: selectedSpecialties,
      galleryImages: galleryUrls,
      coordinates: { lat: 30.0444, lng: 31.2357 }, // Default to Cairo
      workingHours: {
        open: '09:00',
        close: '18:00',
        days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
      }
    };

    if (partner) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addService = (service: string) => {
    if (!selectedServices.includes(service)) {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const removeService = (service: string) => {
    setSelectedServices(selectedServices.filter(s => s !== service));
  };

  const addSpecialty = (specialty: string) => {
    if (!selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
  };

  const addGalleryUrl = () => {
    if (newGalleryUrl.trim() && !galleryUrls.includes(newGalleryUrl.trim())) {
      setGalleryUrls([...galleryUrls, newGalleryUrl.trim()]);
      setNewGalleryUrl('');
    }
  };

  const removeGalleryUrl = (url: string) => {
    setGalleryUrls(galleryUrls.filter(u => u !== url));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            تفاصيل الشريك
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            className="flex items-center gap-2"
            disabled={!partner}
          >
            <Package className="h-4 w-4" />
            المنتجات ({partner ? '...' : '0'})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>المعلومات الأساسية</CardTitle>
                </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الشريك *</FormLabel>
                    <FormControl>
                      <Input placeholder="مطبعة الألوان الحديثة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع العمل *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع العمل" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="print_shop">مطبعة</SelectItem>
                        <SelectItem value="bookstore">مكتبة</SelectItem>
                        <SelectItem value="library">مكتبة عامة</SelectItem>
                        <SelectItem value="stationery">أدوات مكتبية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف الشريك *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="وصف مفصل عن الشريك وخدماته..." 
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
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف مختصر</FormLabel>
                  <FormControl>
                    <Input placeholder="وصف مختصر يظهر في البطاقة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الاتصال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input placeholder="02-25551234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input placeholder="info@partner.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان *</FormLabel>
                  <FormControl>
                    <Input placeholder="شارع التحرير، وسط البلد" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة *</FormLabel>
                    <FormControl>
                      <Input placeholder="القاهرة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="governorate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المحافظة *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المحافظة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {governorates.map((gov) => (
                          <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle>الصور والوسائط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط الشعار</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط صورة الغلاف</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/cover.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Gallery Images */}
            <div>
              <FormLabel>معرض الصور</FormLabel>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="رابط صورة جديدة"
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                />
                <Button type="button" onClick={addGalleryUrl}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {galleryUrls.map((url, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    صورة {idx + 1}
                    <button type="button" onClick={() => removeGalleryUrl(url)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services & Specialties */}
        <Card>
          <CardHeader>
            <CardTitle>الخدمات والتخصصات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Services */}
            <div>
              <FormLabel>الخدمات المقدمة</FormLabel>
              <Select onValueChange={addService}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="اختر خدمة لإضافتها" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedServices.map((service) => (
                  <Badge key={service} variant="outline" className="flex items-center gap-1">
                    {availableServices.find(s => s.value === service)?.label || service}
                    <button type="button" onClick={() => removeService(service)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <FormLabel>التخصصات</FormLabel>
              <Select onValueChange={addSpecialty}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="اختر تخصص لإضافته" />
                </SelectTrigger>
                <SelectContent>
                  {availableSpecialties.map((specialty) => (
                    <SelectItem key={specialty.value} value={specialty.value}>
                      {specialty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSpecialties.map((specialty) => (
                  <Badge key={specialty} variant="outline" className="flex items-center gap-1">
                    {availableSpecialties.find(s => s.value === specialty)?.label || specialty}
                    <button type="button" onClick={() => removeSpecialty(specialty)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل العمل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="establishedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سنة التأسيس</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ترتيب العرض</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد التقييمات</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Delivery Settings */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasDelivery"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>يوفر خدمة التوصيل</FormLabel>
                  </FormItem>
                )}
              />

              {form.watch('hasDelivery') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رسوم التوصيل (جنيه)</FormLabel>
                        <FormControl>
                          <Input placeholder="15.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minOrderForDelivery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحد الأدنى للتوصيل (جنيه)</FormLabel>
                        <FormControl>
                          <Input placeholder="50.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Settings */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الحالة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>نشط</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isVerified"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>معتمد</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>مميز</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptsOnlinePayment"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>يقبل الدفع الإلكتروني</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'جاري الحفظ...' : (partner ? 'تحديث' : 'إضافة')}
          </Button>
        </div>
      </form>
    </Form>
        </TabsContent>

        <TabsContent value="products">
          {partner ? (
            <PartnerProductsSection 
              partnerId={partner.id} 
              partnerName={partner.name}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>يجب حفظ الشريك أولاً لإدارة المنتجات</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}