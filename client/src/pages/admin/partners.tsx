import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, Eye, Star, MapPin, Phone, Building2, Shield, ArrowLeft } from 'lucide-react';
import type { Partner } from '@shared/schema';
import { PartnerForm } from '@/components/admin/PartnerForm';
import { PartnerDetailsView } from '@/components/admin/PartnerDetailsView';

export default function AdminPartners() {
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredPartners = (partners as Partner[] || []).filter((partner: Partner) =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.businessType.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusColor = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    if (isVerified) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'غير نشط';
    if (isVerified) return 'معتمد';
    return 'في انتظار التحقق';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin')}
            data-testid="button-back-to-admin"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة لوحة التحكم
          </Button>
          <div>
            <h1 className="text-3xl font-bold">إدارة الشركاء</h1>
            <p className="text-gray-600">إدارة المطابع والمكتبات الشريكة</p>
          </div>
        </div>
        <Button onClick={handleAdd} data-testid="button-add-partner">
          <Plus className="w-4 h-4 ml-2" />
          إضافة شريك جديد
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="البحث في الشركاء..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-partners"
          />
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>المجموع: {partners?.length || 0}</span>
          <span>نشط: {(partners as Partner[] || []).filter(p => p.isActive).length}</span>
          <span>معتمد: {(partners as Partner[] || []).filter(p => p.isVerified).length}</span>
        </div>
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الشركاء</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشريك</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {partner.logoUrl ? (
                        <img 
                          src={partner.logoUrl} 
                          alt={partner.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{partner.name}</div>
                        <div className="text-sm text-gray-500">
                          {partner.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {partner.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getBusinessTypeLabel(partner.businessType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{partner.city}, {partner.governorate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {partner.rating && Number(partner.rating) > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{Number(partner.rating).toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({partner.reviewCount})</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">لا يوجد تقييم</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(partner.isActive, partner.isVerified)}>
                        {getStatusText(partner.isActive, partner.isVerified)}
                      </Badge>
                      {partner.isVerified && (
                        <Shield className="w-4 h-4 text-green-500" />
                      )}
                      {partner.isFeatured && (
                        <Star className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(partner)}
                        data-testid={`button-view-partner-${partner.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(partner)}
                        data-testid={`button-edit-partner-${partner.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(partner)}
                        className="text-red-600 hover:text-red-800"
                        data-testid={`button-delete-partner-${partner.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPartners.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'لا توجد شركاء مطابقة للبحث' : 'لا توجد شركاء مسجلين'}
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Partner View - Talabat Style */}
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