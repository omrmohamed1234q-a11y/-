import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  DeliverySlot,
  ShippingFee,
  PaymentMethod,
  AdminSetting,
  insertDeliverySlotSchema,
  insertShippingFeeSchema,
  insertPaymentMethodSchema,
  insertAdminSettingSchema
} from '@shared/schema';
import {
  Settings,
  Clock,
  Truck,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Save,
  DollarSign,
  Timer,
  MapPin,
  Users,
  GraduationCap
} from 'lucide-react';

const deliverySlotFormSchema = insertDeliverySlotSchema.extend({
  days: z.array(z.string()).min(1, 'يجب اختيار يوم واحد على الأقل')
});

const shippingFeeFormSchema = insertShippingFeeSchema;
const paymentMethodFormSchema = insertPaymentMethodSchema;

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('delivery');
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null);
  const [selectedFee, setSelectedFee] = useState<ShippingFee | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data (with fallback for missing APIs)
  const { data: deliverySlots } = useQuery<DeliverySlot[]>({
    queryKey: ['/api/admin/delivery-slots'],
    initialData: []
  });

  const { data: shippingFees } = useQuery<ShippingFee[]>({
    queryKey: ['/api/admin/shipping-fees'],
    initialData: []
  });

  const { data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/admin/payment-methods'],
    initialData: []
  });

  const { data: settings } = useQuery<AdminSetting[]>({
    queryKey: ['/api/admin/rewards/settings'],
  });

  // Forms
  const deliverySlotForm = useForm<z.infer<typeof deliverySlotFormSchema>>({
    resolver: zodResolver(deliverySlotFormSchema),
    defaultValues: {
      name: '',
      startTime: '',
      endTime: '',
      days: [],
      isActive: true,
      maxOrders: 50
    }
  });

  const shippingFeeForm = useForm<z.infer<typeof shippingFeeFormSchema>>({
    resolver: zodResolver(shippingFeeFormSchema),
    defaultValues: {
      zone: '',
      weightMin: '0.00',
      weightMax: '1.00',
      fee: '0.00',
      estimatedDays: 1,
      isActive: true
    }
  });

  const paymentMethodForm = useForm<z.infer<typeof paymentMethodFormSchema>>({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues: {
      name: '',
      nameEn: '',
      type: '',
      isActive: true,
      processingFee: '0.00',
      minAmount: '0.00',
      config: {}
    }
  });

  // Mutations
  const createDeliverySlotMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deliverySlotFormSchema>) => {
      await apiRequest('POST', '/api/admin/delivery-slots', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery-slots'] });
      setDialogOpen(false);
      deliverySlotForm.reset();
      toast({ title: 'تم إنشاء فترة التسليم', description: 'تم إنشاء فترة التسليم بنجاح' });
    }
  });

  const updateDeliverySlotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeliverySlot> }) => {
      await apiRequest('PATCH', `/api/admin/delivery-slots/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery-slots'] });
      toast({ title: 'تم التحديث', description: 'تم تحديث فترة التسليم بنجاح' });
    }
  });

  const createShippingFeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shippingFeeFormSchema>) => {
      await apiRequest('POST', '/api/admin/shipping-fees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shipping-fees'] });
      setDialogOpen(false);
      shippingFeeForm.reset();
      toast({ title: 'تم إنشاء رسوم الشحن', description: 'تم إنشاء رسوم الشحن بنجاح' });
    }
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentMethod> }) => {
      await apiRequest('PATCH', `/api/admin/payment-methods/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-methods'] });
      toast({ title: 'تم التحديث', description: 'تم تحديث طريقة الدفع بنجاح' });
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      await apiRequest('PATCH', '/api/admin/settings', { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({ title: 'تم التحديث', description: 'تم تحديث الإعدادات بنجاح' });
    }
  });

  const weekDays = [
    { value: 'monday', label: 'الاثنين' },
    { value: 'tuesday', label: 'الثلاثاء' },
    { value: 'wednesday', label: 'الأربعاء' },
    { value: 'thursday', label: 'الخميس' },
    { value: 'friday', label: 'الجمعة' },
    { value: 'saturday', label: 'السبت' },
    { value: 'sunday', label: 'الأحد' }
  ];

  const egyptianZones = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'الدقهلية',
    'الشرقية',
    'القليوبية',
    'كفر الشيخ',
    'الغربية',
    'المنوفية',
    'البحيرة',
    'الإسماعيلية',
    'بورسعيد',
    'السويس',
    'شمال سيناء',
    'جنوب سيناء',
    'الفيوم',
    'بني سويف',
    'المنيا',
    'أسيوط',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
    'البحر الأحمر',
    'الوادي الجديد',
    'مطروح'
  ];

  const getSetting = (key: string) => {
    return settings?.find(s => s.key === key)?.value;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">إعدادات النظام</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            فترات التسليم
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            رسوم الشحن
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            طرق الدفع
          </TabsTrigger>
          <TabsTrigger value="teacher" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            اشتراكات المعلمين
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            إعدادات عامة
          </TabsTrigger>
        </TabsList>

        {/* Delivery Slots Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                فترات التسليم
              </CardTitle>
              <Dialog open={dialogOpen && activeTab === 'delivery'} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedSlot(null)} data-testid="button-add-delivery-slot">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة فترة تسليم
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedSlot ? 'تعديل فترة التسليم' : 'إضافة فترة تسليم جديدة'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...deliverySlotForm}>
                    <form
                      onSubmit={deliverySlotForm.handleSubmit((data) => {
                        if (selectedSlot) {
                          updateDeliverySlotMutation.mutate({ id: selectedSlot.id, data });
                        } else {
                          createDeliverySlotMutation.mutate(data);
                        }
                      })}
                      className="space-y-4"
                    >
                      <FormField
                        control={deliverySlotForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم الفترة</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="مثل: فترة صباحية" data-testid="input-slot-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={deliverySlotForm.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>وقت البداية</FormLabel>
                              <FormControl>
                                <Input {...field} type="time" data-testid="input-start-time" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={deliverySlotForm.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>وقت النهاية</FormLabel>
                              <FormControl>
                                <Input {...field} type="time" data-testid="input-end-time" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={deliverySlotForm.control}
                        name="maxOrders"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الحد الأقصى للطلبات</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                value={field.value || ''} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-max-orders" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2">
                        <Label>أيام الأسبوع</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {weekDays.map((day) => (
                            <div key={day.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={day.value}
                                checked={deliverySlotForm.watch('days')?.includes(day.value)}
                                onChange={(e) => {
                                  const days = deliverySlotForm.getValues('days') || [];
                                  if (e.target.checked) {
                                    deliverySlotForm.setValue('days', [...days, day.value]);
                                  } else {
                                    deliverySlotForm.setValue('days', days.filter(d => d !== day.value));
                                  }
                                }}
                                data-testid={`checkbox-day-${day.value}`}
                              />
                              <Label htmlFor={day.value}>{day.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit" data-testid="button-save-slot">
                          <Save className="h-4 w-4 ml-2" />
                          حفظ
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {deliverySlots?.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium" data-testid={`text-slot-name-${slot.id}`}>{slot.name}</h3>
                        <Badge variant={slot.isActive ? 'default' : 'secondary'}>
                          {slot.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        أقصى {slot.maxOrders} طلب | {slot.days?.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={slot.isActive || false}
                        onCheckedChange={(checked) =>
                          updateDeliverySlotMutation.mutate({
                            id: slot.id,
                            data: { isActive: checked }
                          })
                        }
                        data-testid={`switch-slot-active-${slot.id}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSlot(slot);
                          deliverySlotForm.reset({
                            name: slot.name,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            days: slot.days || [],
                            maxOrders: slot.maxOrders || 50,
                            isActive: slot.isActive
                          });
                          setDialogOpen(true);
                        }}
                        data-testid={`button-edit-slot-${slot.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Fees Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                رسوم الشحن
              </CardTitle>
              <Dialog open={dialogOpen && activeTab === 'shipping'} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedFee(null)} data-testid="button-add-shipping-fee">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة رسوم شحن
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة رسوم شحن جديدة</DialogTitle>
                  </DialogHeader>
                  <Form {...shippingFeeForm}>
                    <form
                      onSubmit={shippingFeeForm.handleSubmit((data) => {
                        createShippingFeeMutation.mutate(data);
                      })}
                      className="space-y-4"
                    >
                      <FormField
                        control={shippingFeeForm.control}
                        name="zone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المنطقة</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-shipping-zone">
                                  <SelectValue placeholder="اختر المنطقة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {egyptianZones.map((zone) => (
                                  <SelectItem key={zone} value={zone}>
                                    {zone}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={shippingFeeForm.control}
                          name="weightMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الوزن الأدنى (كجم)</FormLabel>
                              <FormControl>
                                <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                value={field.value || ''} 
                                data-testid="input-weight-min" 
                              />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={shippingFeeForm.control}
                          name="weightMax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الوزن الأقصى (كجم)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" data-testid="input-weight-max" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={shippingFeeForm.control}
                        name="fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رسوم الشحن (جنيه)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" data-testid="input-shipping-fee" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={shippingFeeForm.control}
                        name="freeShippingThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>حد الشحن المجاني (جنيه)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="اختياري" 
                                value={field.value || ''} 
                                data-testid="input-free-shipping" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={shippingFeeForm.control}
                        name="estimatedDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مدة التسليم المتوقعة (أيام)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                value={field.value || ''} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                data-testid="input-estimated-days" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit" data-testid="button-save-shipping">
                          <Save className="h-4 w-4 ml-2" />
                          حفظ
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {shippingFees?.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium" data-testid={`text-zone-${fee.id}`}>{fee.zone}</h3>
                        <Badge variant={fee.isActive ? 'default' : 'secondary'}>
                          {fee.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fee.weightMin} - {fee.weightMax} كجم | {fee.fee} جنيه
                      </p>
                      {fee.freeShippingThreshold && (
                        <p className="text-sm text-green-600">
                          شحن مجاني عند {fee.freeShippingThreshold} جنيه
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        التسليم خلال {fee.estimatedDays} يوم
                      </p>
                    </div>
                    <Switch
                      checked={fee.isActive || false}
                      onCheckedChange={(checked) =>
                        // Note: Need to implement update shipping fee mutation
                        console.log('Update shipping fee:', fee.id, checked)
                      }
                      data-testid={`switch-fee-active-${fee.id}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                طرق الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {paymentMethods?.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium" data-testid={`text-payment-name-${method.id}`}>{method.name}</h3>
                        <Badge variant={method.isActive ? 'default' : 'secondary'}>
                          {method.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.type} | رسوم: {method.processingFee}%
                      </p>
                      {(method.minAmount || method.maxAmount) && (
                        <p className="text-sm text-muted-foreground">
                          {method.minAmount && `حد أدنى: ${method.minAmount} جنيه`}
                          {method.minAmount && method.maxAmount && ' | '}
                          {method.maxAmount && `حد أقصى: ${method.maxAmount} جنيه`}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={method.isActive || false}
                      onCheckedChange={(checked) =>
                        updatePaymentMethodMutation.mutate({
                          id: method.id,
                          data: { isActive: checked }
                        })
                      }
                      data-testid={`switch-payment-active-${method.id}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teacher Subscription Tab */}
        <TabsContent value="teacher" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                إعدادات اشتراكات المعلمين
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="monthly-price">سعر الاشتراك الشهري (جنيه)</Label>
                  <Input
                    id="monthly-price"
                    type="number"
                    value={getSetting('teacher_subscription_monthly_price')?.toString() || '99'}
                    onChange={(e) =>
                      updateSettingMutation.mutate({
                        key: 'teacher_subscription_monthly_price',
                        value: parseFloat(e.target.value)
                      })
                    }
                    data-testid="input-monthly-price"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="yearly-price">سعر الاشتراك السنوي (جنيه)</Label>
                  <Input
                    id="yearly-price"
                    type="number"
                    value={getSetting('teacher_subscription_yearly_price')?.toString() || '999'}
                    onChange={(e) =>
                      updateSettingMutation.mutate({
                        key: 'teacher_subscription_yearly_price',
                        value: parseFloat(e.target.value)
                      })
                    }
                    data-testid="input-yearly-price"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="max-students">الحد الأقصى للطلاب</Label>
                  <Input
                    id="max-students"
                    type="number"
                    value={getSetting('teacher_max_students')?.toString() || '30'}
                    onChange={(e) =>
                      updateSettingMutation.mutate({
                        key: 'teacher_max_students',
                        value: parseInt(e.target.value)
                      })
                    }
                    data-testid="input-max-students"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="max-materials">الحد الأقصى للمواد</Label>
                  <Input
                    id="max-materials"
                    type="number"
                    value={getSetting('teacher_max_materials')?.toString() || '100'}
                    onChange={(e) =>
                      updateSettingMutation.mutate({
                        key: 'teacher_max_materials',
                        value: parseInt(e.target.value)
                      })
                    }
                    data-testid="input-max-materials"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات عامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="cancellation-window">نافذة إلغاء الطلب (دقيقة)</Label>
                  <Input
                    id="cancellation-window"
                    type="number"
                    value={getSetting('order_cancellation_window')?.toString() || '30'}
                    onChange={(e) =>
                      updateSettingMutation.mutate({
                        key: 'order_cancellation_window',
                        value: parseInt(e.target.value)
                      })
                    }
                    data-testid="input-cancellation-window"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="default-eta">المدة الافتراضية للتسليم (ساعة)</Label>
                  <Input
                    id="default-eta"
                    type="number"
                    value={getSetting('default_delivery_eta')?.toString() || '24'}
                    onChange={(e) =>
                      updateSettingMutation.mutate({
                        key: 'default_delivery_eta',
                        value: parseInt(e.target.value)
                      })
                    }
                    data-testid="input-default-eta"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label htmlFor="app-maintenance">وضع الصيانة</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Boolean(getSetting('app_maintenance_mode')) || false}
                    onCheckedChange={(checked) =>
                      updateSettingMutation.mutate({
                        key: 'app_maintenance_mode',
                        value: checked
                      })
                    }
                    data-testid="switch-maintenance-mode"
                  />
                  <span className="text-sm text-muted-foreground">
                    تفعيل وضع الصيانة سيمنع المستخدمين من الوصول للتطبيق
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}