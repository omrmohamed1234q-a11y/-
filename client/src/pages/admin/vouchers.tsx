import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Voucher, InsertVoucher } from '@shared/schema';
import {
  Plus,
  Edit,
  Trash2,
  Ticket,
  DollarSign,
  Users,
  Calendar,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AdminVouchers() {
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vouchers, isLoading } = useQuery<Voucher[]>({
    queryKey: ['/api/admin/vouchers']
  });

  const createVoucherMutation = useMutation({
    mutationFn: async (voucher: InsertVoucher) => {
      await apiRequest('POST', '/api/admin/vouchers', voucher);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vouchers'] });
      setDialogOpen(false);
      setEditingVoucher(null);
      toast({
        title: 'تم إنشاء الكوبون',
        description: 'تم إنشاء الكوبون بنجاح'
      });
    }
  });

  const updateVoucherMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Voucher> }) => {
      await apiRequest('PATCH', `/api/admin/vouchers/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vouchers'] });
      setDialogOpen(false);
      setEditingVoucher(null);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الكوبون بنجاح'
      });
    }
  });

  const deleteVoucherMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/vouchers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vouchers'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الكوبون بنجاح'
      });
    }
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const voucherData: InsertVoucher = {
      code: formData.get('code') as string,
      type: formData.get('type') as 'percentage' | 'fixed',
      value: formData.get('value') as string,
      minSubtotal: formData.get('minSubtotal') as string || '0',
      maxDiscount: formData.get('maxDiscount') as string || null,
      usageLimit: parseInt(formData.get('usageLimit') as string) || 1,
      validFrom: new Date(formData.get('validFrom') as string),
      validUntil: formData.get('validUntil') ? new Date(formData.get('validUntil') as string) : null,
      isActive: formData.get('isActive') === 'on',
    };

    if (editingVoucher) {
      updateVoucherMutation.mutate({ id: editingVoucher.id, updates: voucherData });
    } else {
      createVoucherMutation.mutate(voucherData);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ الكود إلى الحافظة'
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">إدارة الكوبونات</h1>
        <div className="flex space-x-3 space-x-reverse">
          <Badge variant="outline">{vouchers?.length || 0} كوبون</Badge>
          <Button onClick={() => {
            setEditingVoucher(null);
            setDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 ml-2" />
            إنشاء كوبون جديد
          </Button>
        </div>
      </div>

      {/* Vouchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vouchers?.map((voucher) => {
          const isExpired = voucher.validUntil && new Date(voucher.validUntil) < new Date();
          const usagePercentage = voucher.usageLimit > 0 ? (voucher.usageCount / voucher.usageLimit) * 100 : 0;
          
          return (
            <Card key={voucher.id} className={`relative ${!voucher.isActive || isExpired ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
                      <Ticket className="w-5 h-5" />
                      <span className="font-mono">{voucher.code}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(voucher.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </CardTitle>
                    <div className="flex space-x-2 space-x-reverse mt-2">
                      <Badge variant={voucher.isActive ? 'default' : 'secondary'}>
                        {voucher.isActive ? 'نشط' : 'معطل'}
                      </Badge>
                      {isExpired && <Badge variant="destructive">منتهي الصلاحية</Badge>}
                    </div>
                  </div>
                  <div className="flex space-x-1 space-x-reverse">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingVoucher(voucher);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
                          deleteVoucherMutation.mutate(voucher.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Discount Info */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {voucher.type === 'percentage' ? (
                      <span className="arabic-nums">{voucher.value}%</span>
                    ) : (
                      <span className="arabic-nums">{voucher.value} جنيه</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {voucher.type === 'percentage' ? 'خصم نسبي' : 'خصم ثابت'}
                  </p>
                </div>

                {/* Conditions */}
                <div className="space-y-2 text-sm">
                  {voucher.minSubtotal && parseFloat(voucher.minSubtotal) > 0 && (
                    <div className="flex justify-between">
                      <span>الحد الأدنى:</span>
                      <span className="arabic-nums">{voucher.minSubtotal} جنيه</span>
                    </div>
                  )}
                  {voucher.maxDiscount && (
                    <div className="flex justify-between">
                      <span>أقصى خصم:</span>
                      <span className="arabic-nums">{voucher.maxDiscount} جنيه</span>
                    </div>
                  )}
                </div>

                {/* Usage Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>الاستخدام:</span>
                    <span className="arabic-nums">{voucher.usageCount} / {voucher.usageLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Validity Period */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Calendar className="w-3 h-3" />
                    <span>من: {new Date(voucher.validFrom).toLocaleDateString('ar-EG')}</span>
                  </div>
                  {voucher.validUntil && (
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Calendar className="w-3 h-3" />
                      <span>إلى: {new Date(voucher.validUntil).toLocaleDateString('ar-EG')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Voucher Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingVoucher ? 'تعديل الكوبون' : 'إنشاء كوبون جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code */}
            <div>
              <Label htmlFor="code">كود الكوبون *</Label>
              <div className="flex space-x-2 space-x-reverse">
                <Input
                  id="code"
                  name="code"
                  defaultValue={editingVoucher?.code || ''}
                  className="font-mono uppercase"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector('input');
                    if (input) input.value = generateCode();
                  }}
                >
                  توليد تلقائي
                </Button>
              </div>
            </div>

            {/* Type and Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">نوع الخصم *</Label>
                <Select name="type" defaultValue={editingVoucher?.type || 'percentage'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (جنيه)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">قيمة الخصم *</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  step="0.01"
                  defaultValue={editingVoucher?.value || ''}
                  required
                />
              </div>
            </div>

            {/* Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minSubtotal">الحد الأدنى للطلب</Label>
                <Input
                  id="minSubtotal"
                  name="minSubtotal"
                  type="number"
                  step="0.01"
                  defaultValue={editingVoucher?.minSubtotal || '0'}
                />
              </div>
              <div>
                <Label htmlFor="maxDiscount">أقصى مبلغ خصم</Label>
                <Input
                  id="maxDiscount"
                  name="maxDiscount"
                  type="number"
                  step="0.01"
                  defaultValue={editingVoucher?.maxDiscount || ''}
                />
              </div>
            </div>

            {/* Usage Limit */}
            <div>
              <Label htmlFor="usageLimit">عدد مرات الاستخدام المسموحة</Label>
              <Input
                id="usageLimit"
                name="usageLimit"
                type="number"
                defaultValue={editingVoucher?.usageLimit || '1'}
              />
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validFrom">بداية الصلاحية *</Label>
                <Input
                  id="validFrom"
                  name="validFrom"
                  type="datetime-local"
                  defaultValue={
                    editingVoucher?.validFrom 
                      ? new Date(editingVoucher.validFrom).toISOString().slice(0, 16)
                      : new Date().toISOString().slice(0, 16)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="validUntil">انتهاء الصلاحية</Label>
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="datetime-local"
                  defaultValue={
                    editingVoucher?.validUntil 
                      ? new Date(editingVoucher.validUntil).toISOString().slice(0, 16)
                      : ''
                  }
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={editingVoucher?.isActive ?? true}
              />
              <Label htmlFor="isActive">الكوبون نشط</Label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 space-x-reverse">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={createVoucherMutation.isPending || updateVoucherMutation.isPending}
              >
                {(createVoucherMutation.isPending || updateVoucherMutation.isPending) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4 ml-2" />
                    {editingVoucher ? 'تحديث الكوبون' : 'إنشاء الكوبون'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}