import React, { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Eye, Copy, Calendar, Percent, Tag, Users, Target, Bell, GraduationCap, MapPin, BarChart3, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AdminCoupon } from "@shared/schema";
import { CouponForm } from "@/components/admin/CouponForm";
import { apiRequest } from "@/lib/queryClient";

export default function AdminCoupons() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["/api/admin/coupons"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({
        title: "تم حذف القسيمة",
        description: "تم حذف القسيمة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف القسيمة",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/coupons/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة القسيمة بنجاح",
      });
    },
  });

  const sendNotificationsMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const response = await apiRequest("POST", `/api/admin/coupons/${couponId}/send-notifications`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({
        title: "تم إرسال الإشعارات",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "فشل في إرسال الإشعارات",
        variant: "destructive",
      });
    },
  });

  const { data: analyticsData, refetch: refetchAnalytics } = useQuery({
    queryKey: ["/api/admin/coupons/analytics"],
    enabled: false, // Only fetch when explicitly requested
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "تم النسخ",
      description: `تم نسخ كود القسيمة: ${code}`,
    });
  };

  const getDiscountText = (coupon: AdminCoupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }
    return `${coupon.discountValue} جنيه`;
  };

  const getStatusColor = (coupon: AdminCoupon) => {
    if (!coupon.isActive) return "destructive";
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) return "secondary";
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return "outline";
    return "default";
  };

  const getStatusText = (coupon: AdminCoupon) => {
    if (!coupon.isActive) return "معطل";
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) return "منتهي الصلاحية";
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return "استُنفدت الاستخدامات";
    return "نشط";
  };

  const getTargetText = (targetType: string) => {
    switch (targetType) {
      case "new": return "عملاء جدد";
      case "existing": return "عملاء حاليين";
      case "grade": return "حسب الصف";
      case "specific": return "عملاء محددين";
      default: return "جميع العملاء";
    }
  };

  const handleEdit = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCoupon(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">إدارة القسائم</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-back-admin">
              <ArrowLeft className="w-4 h-4" />
              العودة للوحة التحكم
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🎫 إدارة القسائم</h1>
            <p className="text-gray-600 mt-2">إدارة قسائم الخصم والأكواد الترويجية</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="button-add-coupon"
        >
          <Plus className="ml-2 h-4 w-4" />
          إضافة قسيمة جديدة
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي القسائم</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
              <Tag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">القسائم النشطة</p>
                <p className="text-2xl font-bold text-green-600">
                  {coupons.filter((c: AdminCoupon) => c.isActive).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">القسائم المستخدمة</p>
                <p className="text-2xl font-bold text-orange-600">
                  {coupons.reduce((sum: number, c: AdminCoupon) => sum + (c.usageCount || 0), 0)}
                </p>
              </div>
              <Percent className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">القسائم المنتهية</p>
                <p className="text-2xl font-bold text-red-600">
                  {coupons.filter((c: AdminCoupon) => 
                    c.validUntil && new Date(c.validUntil) < new Date()
                  ).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Grid */}
      <div className="grid gap-4">
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد قسائم</h3>
              <p className="text-gray-500 mb-4">قم بإنشاء أول قسيمة خصم لعملائك</p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة قسيمة جديدة
              </Button>
            </CardContent>
          </Card>
        ) : (
          coupons.map((coupon: AdminCoupon) => (
            <Card key={coupon.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{coupon.name}</h3>
                      <Badge variant={getStatusColor(coupon)}>
                        {getStatusText(coupon)}
                      </Badge>
                      <Badge variant="outline" className="font-mono">
                        {coupon.code}
                      </Badge>
                    </div>
                    
                    {coupon.description && (
                      <p className="text-gray-600 mb-3">{coupon.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">الخصم:</span>
                        <p className="font-semibold text-green-600">
                          {getDiscountText(coupon)}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">الحد الأدنى:</span>
                        <p className="font-semibold">
                          {parseFloat(coupon.minimumOrderValue || "0")} جنيه
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">الاستخدامات:</span>
                        <p className="font-semibold">
                          {coupon.usageCount || 0}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">انتهاء الصلاحية:</span>
                        <p className="font-semibold">
                          {coupon.validUntil 
                            ? new Date(coupon.validUntil).toLocaleDateString('ar-EG')
                            : "بدون انتهاء"
                          }
                        </p>
                      </div>
                    </div>

                    {/* Targeting and Usage Info */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {coupon.maxUsagePerUser && coupon.maxUsagePerUser > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 ml-1" />
                          {coupon.maxUsagePerUser} استخدامات لكل عميل
                        </Badge>
                      )}
                      
                      {coupon.targetUserType && coupon.targetUserType !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          <Target className="w-3 h-3 ml-1" />
                          {getTargetText(coupon.targetUserType)}
                        </Badge>
                      )}
                      
                      {coupon.targetGradeLevel && (
                        <Badge variant="secondary" className="text-xs">
                          <GraduationCap className="w-3 h-3 ml-1" />
                          {coupon.targetGradeLevel}
                        </Badge>
                      )}
                      
                      {coupon.targetLocation && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="w-3 h-3 ml-1" />
                          {coupon.targetLocation}
                        </Badge>
                      )}
                      
                      {coupon.sendNotification && (
                        <Badge variant={coupon.notificationSent ? "default" : "outline"} className="text-xs">
                          <Bell className="w-3 h-3 ml-1" />
                          {coupon.notificationSent ? "تم الإرسال" : "سيتم الإرسال"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Targeting and Notification Actions */}
                    {coupon.sendNotification && !coupon.notificationSent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendNotificationsMutation.mutate(coupon.id)}
                        disabled={sendNotificationsMutation.isPending}
                        data-testid={`button-send-notifications-${coupon.code}`}
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <Send className="h-4 w-4 ml-1" />
                        إرسال إشعارات
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/admin/coupons/${coupon.id}/analytics`, '_blank')}
                      data-testid={`button-analytics-${coupon.code}`}
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <BarChart3 className="h-4 w-4 ml-1" />
                      تحليلات
                    </Button>
                    
                    {/* Standard Actions */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(coupon.code)}
                      data-testid={`button-copy-${coupon.code}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                      data-testid={`button-edit-${coupon.code}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant={coupon.isActive ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({
                        id: coupon.id,
                        isActive: !coupon.isActive
                      })}
                      data-testid={`button-toggle-${coupon.code}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه القسيمة؟')) {
                          deleteMutation.mutate(coupon.id);
                        }
                      }}
                      data-testid={`button-delete-${coupon.code}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Coupon Form Dialog */}
      {isFormOpen && (
        <CouponForm
          coupon={editingCoupon}
          onClose={handleFormClose}
          onSuccess={() => {
            handleFormClose();
            queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
          }}
        />
      )}
    </div>
  );
}