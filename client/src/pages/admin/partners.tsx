import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, Eye, Star, MapPin, Phone, Building2, Shield, ArrowLeft, Search } from 'lucide-react';
import type { Partner } from '@shared/schema';
import { PartnerForm } from '@/components/admin/PartnerForm';
import { PartnerDetailsView } from '@/components/admin/PartnerDetailsView';

export default function AdminPartners() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: partners, isLoading } = useQuery({
    queryKey: ['/api/admin/partners'],
    retry: false,
  });

  const deletePartnerMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] });
      toast({
        title: 'تم حذف الشريك',
        description: 'تم حذف الشريك بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في الحذف',
        description: 'حدث خطأ أثناء حذف الشريك',
        variant: 'destructive',
      });
    },
  });

  // Filter partners
  const filteredPartners = (partners as Partner[] || []).filter((partner: Partner) => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'verified' && partner.isVerified) ||
      (statusFilter === 'active' && partner.isActive) ||
      (statusFilter === 'featured' && partner.isFeatured);

    const matchesType = typeFilter === 'all' || partner.businessType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats
  const stats = {
    total: (partners as Partner[] || []).length,
    verified: (partners as Partner[] || []).filter(p => p.isVerified).length,
    active: (partners as Partner[] || []).filter(p => p.isActive).length,
    avgRating: (partners as Partner[] || []).reduce((acc, p) => acc + (Number(p.rating) || 0), 0) / ((partners as Partner[] || []).length || 1),
  };

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsFormOpen(true);
  };

  const handleView = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsViewOpen(true);
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    setSelectedPartner(null);
  };

  const handleDelete = (partner: Partner) => {
    if (confirm(`هل أنت متأكد من حذف الشريك "${partner.name}"؟`)) {
      deletePartnerMutation.mutate(partner.id);
    }
  };

  const handleAdd = () => {
    setSelectedPartner(null);
    setIsFormOpen(true);
  };

  const getBusinessTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      print_shop: 'مطبعة',
      bookstore: 'مكتبة',
      library: 'مكتبة عامة',
      stationery: 'أدوات مكتبية',
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 ml-1" />
              رجوع
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الشركاء</h1>
          </div>
          <p className="text-gray-600">إدارة المطابع والمكتبات الشريكة</p>
        </div>
        <Button onClick={handleAdd} size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-5 h-5 ml-2" />
          إضافة شريك جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">إجمالي الشركاء</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.verified}</div>
            <div className="text-sm text-gray-600">شريك معتمد</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.active}</div>
            <div className="text-sm text-gray-600">شريك نشط</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgRating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">متوسط التقييم</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ابحث عن شريك..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="verified">معتمد فقط</SelectItem>
                <SelectItem value="active">نشط فقط</SelectItem>
                <SelectItem value="featured">مميز فقط</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="print_shop">مطبعة</SelectItem>
                <SelectItem value="bookstore">مكتبة</SelectItem>
                <SelectItem value="library">مكتبة عامة</SelectItem>
                <SelectItem value="stationery">أدوات مكتبية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                {partner.logoUrl ? (
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{partner.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {getBusinessTypeLabel(partner.businessType)}
                    </Badge>
                    {partner.isVerified && (
                      <Shield className="w-4 h-4 text-green-500" />
                    )}
                    {partner.isFeatured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                {partner.rating && Number(partner.rating) > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{Number(partner.rating).toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({partner.reviewCount} تقييم)</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{partner.city}, {partner.governorate}</span>
                </div>

                {partner.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{partner.phone}</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="mb-4">
                {partner.isActive ? (
                  partner.isVerified ? (
                    <Badge className="bg-green-100 text-green-800">معتمد ونشط</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">نشط - في انتظار التحقق</Badge>
                  )
                ) : (
                  <Badge className="bg-red-100 text-red-800">غير نشط</Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(partner)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 ml-1" />
                  عرض
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(partner)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 ml-1" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(partner)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPartners.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'لا توجد شركاء مطابقة للبحث'
                : 'لا توجد شركاء مسجلين'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'جرب تغيير معايير البحث'
                : 'ابدأ بإضافة شريك جديد'}
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة شريك جديد
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Partner Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPartner ? 'تعديل بيانات الشريك' : 'إضافة شريك جديد'}
            </DialogTitle>
          </DialogHeader>
          <PartnerForm
            partner={selectedPartner}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedPartner(null);
              queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] });
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedPartner(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Partner View */}
      {isViewOpen && selectedPartner && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <PartnerDetailsView
            partner={selectedPartner}
            onClose={handleCloseView}
          />
        </div>
      )}
    </div>
  );
}