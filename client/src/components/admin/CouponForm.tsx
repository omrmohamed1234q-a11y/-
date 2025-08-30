import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X, Save, Percent, Hash, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AdminCoupon, insertAdminCouponSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertAdminCouponSchema.extend({
  validUntil: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CouponFormProps {
  coupon?: AdminCoupon | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CouponForm({ coupon, onClose, onSuccess }: CouponFormProps) {
  const { toast } = useToast();
  const isEditing = !!coupon;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: coupon?.code || "",
      name: coupon?.name || "",
      description: coupon?.description || "",
      discountType: coupon?.discountType || "percentage",
      discountValue: coupon?.discountValue || "10",
      minimumOrderValue: coupon?.minimumOrderValue || "0",
      maximumDiscount: coupon?.maximumDiscount || "",
      usageLimit: coupon?.usageLimit || undefined,
      isActive: coupon?.isActive ?? true,
      validUntil: coupon?.validUntil 
        ? new Date(coupon.validUntil).toISOString().split('T')[0] 
        : "",
      applicableProducts: coupon?.applicableProducts || null,
      createdBy: coupon?.createdBy || null,
    },
  });

  const discountType = watch("discountType");

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : null,
        discountValue: parseFloat(data.discountValue.toString()),
        minimumOrderValue: parseFloat(data.minimumOrderValue.toString()),
        maximumDiscount: data.maximumDiscount 
          ? parseFloat(data.maximumDiscount.toString()) 
          : null,
      };

      if (isEditing) {
        return await apiRequest("PUT", `/api/admin/coupons/${coupon.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/admin/coupons", payload);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "تم تحديث القسيمة" : "تم إنشاء القسيمة",
        description: isEditing 
          ? "تم تحديث القسيمة بنجاح" 
          : "تم إنشاء قسيمة جديدة بنجاح",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ القسيمة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const generateCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setValue('code', result);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditing ? "تعديل القسيمة" : "إضافة قسيمة جديدة"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">المعلومات الأساسية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم القسيمة *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="مثال: خصم العودة للمدارس"
                  data-testid="input-coupon-name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="code">كود القسيمة *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    {...register("code")}
                    placeholder="SCHOOL2024"
                    className="font-mono uppercase"
                    data-testid="input-coupon-code"
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    <Hash className="h-4 w-4" />
                  </Button>
                </div>
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="وصف مختصر للقسيمة وشروط الاستخدام"
                rows={3}
                data-testid="textarea-coupon-description"
              />
            </div>
          </div>

          {/* Discount Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Percent className="h-5 w-5" />
              إعدادات الخصم
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountType">نوع الخصم *</Label>
                <Select 
                  value={watch("discountType")} 
                  onValueChange={(value) => setValue("discountType", value as "percentage" | "fixed")}
                >
                  <SelectTrigger data-testid="select-discount-type">
                    <SelectValue placeholder="اختر نوع الخصم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (جنيه)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountValue">
                  قيمة الخصم * {discountType === "percentage" ? "(%)" : "(جنيه)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  {...register("discountValue")}
                  placeholder={discountType === "percentage" ? "10" : "50"}
                  data-testid="input-discount-value"
                />
                {errors.discountValue && (
                  <p className="text-red-500 text-sm mt-1">{errors.discountValue.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minimumOrderValue">الحد الأدنى للطلب (جنيه)</Label>
                <Input
                  id="minimumOrderValue"
                  type="number"
                  step="0.01"
                  {...register("minimumOrderValue")}
                  placeholder="0"
                  data-testid="input-minimum-order"
                />
              </div>

              <div>
                <Label htmlFor="maximumDiscount">الحد الأقصى للخصم (جنيه)</Label>
                <Input
                  id="maximumDiscount"
                  type="number"
                  step="0.01"
                  {...register("maximumDiscount")}
                  placeholder="اتركه فارغاً لبلا حدود"
                  data-testid="input-maximum-discount"
                />
              </div>
            </div>
          </div>

          {/* Usage and Validity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              الاستخدام والصلاحية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usageLimit">حد الاستخدام</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  {...register("usageLimit", { valueAsNumber: true })}
                  placeholder="اتركه فارغاً لاستخدام غير محدود"
                  data-testid="input-usage-limit"
                />
              </div>

              <div>
                <Label htmlFor="validUntil">تاريخ انتهاء الصلاحية</Label>
                <Input
                  id="validUntil"
                  type="date"
                  {...register("validUntil")}
                  data-testid="input-valid-until"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Switch
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                تفعيل القسيمة فوراً
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              data-testid="button-save-coupon"
            >
              {mutation.isPending ? (
                "جاري الحفظ..."
              ) : (
                <>
                  <Save className="ml-2 h-4 w-4" />
                  {isEditing ? "تحديث" : "إنشاء"} القسيمة
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}