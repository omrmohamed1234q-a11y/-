import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { 
  Plus, Edit, Trash2, Eye, EyeOff, ExternalLink,
  MoveUp, MoveDown, Image
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  description?: string;
  buttonText: string;
  buttonAction?: string;
  buttonUrl?: string;
  imageUrl: string;
  position: number;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function AnnouncementsAdmin() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/announcements'],
    staleTime: 30 * 1000, // 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/announcements', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements/homepage'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الإعلان بنجاح",
      });
    },
    onError: (error) => {
      console.error('Error creating announcement:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الإعلان",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PUT', `/api/admin/announcements/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements/homepage'] });
      setEditingAnnouncement(null);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الإعلان بنجاح",
      });
    },
    onError: (error) => {
      console.error('Error updating announcement:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعلان",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements/homepage'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الإعلان بنجاح",
      });
    },
    onError: (error) => {
      console.error('Error deleting announcement:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الإعلان",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: any) => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data });
    }
  };

  const handleDelete = (announcement: Announcement) => {
    if (confirm(`هل أنت متأكد من حذف الإعلان "${announcement.title}"؟`)) {
      deleteMutation.mutate(announcement.id);
    }
  };

  const handleToggleActive = (announcement: Announcement) => {
    updateMutation.mutate({
      id: announcement.id,
      data: { ...announcement, isActive: !announcement.isActive }
    });
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      service: { label: "خدمة", color: "bg-blue-100 text-blue-800" },
      promotion: { label: "عرض", color: "bg-green-100 text-green-800" },
      announcement: { label: "إعلان", color: "bg-purple-100 text-purple-800" },
    };
    
    const categoryInfo = categoryMap[category as keyof typeof categoryMap] || 
                        { label: category, color: "bg-gray-100 text-gray-800" };
    
    return <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>;
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => a.position - b.position);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-600">خطأ في تحميل الإعلانات</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] })}
            className="mt-4"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الإعلانات</h1>
          <p className="text-gray-600 mt-2">
            إدارة الإعلانات والخدمات المعروضة في الصفحة الرئيسية
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-announcement"
        >
          <Plus className="w-4 h-4 ml-2" />
          إعلان جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{announcements.length}</div>
            <p className="text-gray-600">إجمالي الإعلانات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {announcements.filter((a: Announcement) => a.isActive).length}
            </div>
            <p className="text-gray-600">إعلانات نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {announcements.filter((a: Announcement) => a.category === 'service').length}
            </div>
            <p className="text-gray-600">خدمات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {announcements.filter((a: Announcement) => a.category === 'promotion').length}
            </div>
            <p className="text-gray-600">عروض</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإعلانات</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAnnouncements.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد إعلانات حالياً</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4"
                data-testid="button-create-first-announcement"
              >
                إنشاء أول إعلان
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAnnouncements.map((announcement: Announcement) => (
                <div
                  key={announcement.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  data-testid={`announcement-item-${announcement.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Image Preview */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {announcement.imageUrl ? (
                        <img
                          src={announcement.imageUrl}
                          alt={announcement.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 truncate">
                            {announcement.title}
                          </h3>
                          {announcement.description && (
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {announcement.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 mr-4">
                          {getCategoryBadge(announcement.category)}
                          <Badge variant={announcement.isActive ? "default" : "secondary"}>
                            {announcement.isActive ? (
                              <>
                                <Eye className="w-3 h-3 ml-1" />
                                نشط
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 ml-1" />
                                غير نشط
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>الترتيب: {announcement.position}</span>
                          <span>الزر: {announcement.buttonText}</span>
                          {announcement.buttonUrl && (
                            <a
                              href={announcement.buttonUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-3 h-3 ml-1" />
                              الرابط
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(announcement)}
                            data-testid={`button-toggle-${announcement.id}`}
                          >
                            {announcement.isActive ? (
                              <>
                                <EyeOff className="w-4 h-4 ml-1" />
                                إخفاء
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 ml-1" />
                                إظهار
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAnnouncement(announcement)}
                            data-testid={`button-edit-${announcement.id}`}
                          >
                            <Edit className="w-4 h-4 ml-1" />
                            تعديل
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(announcement)}
                            className="text-red-600 hover:text-red-800"
                            data-testid={`button-delete-${announcement.id}`}
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء إعلان جديد</DialogTitle>
          </DialogHeader>
          <AnnouncementForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الإعلان</DialogTitle>
          </DialogHeader>
          {editingAnnouncement && (
            <AnnouncementForm
              announcement={editingAnnouncement}
              onSubmit={handleUpdate}
              onCancel={() => setEditingAnnouncement(null)}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}