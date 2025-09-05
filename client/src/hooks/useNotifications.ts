import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'coupon' | 'announcement' | 'reward' | 'system' | 'delivery';
  relatedId?: string;
  actionUrl?: string;
  iconType: 'success' | 'warning' | 'error' | 'info';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  isClicked: boolean;
  isPinned: boolean;
  expiresAt?: string;
  sentAt: string;
  readAt?: string;
  clickedAt?: string;
  metadata?: any;
}

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get unread count
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/count'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  const unreadCount = unreadCountData?.count || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both notifications and count queries
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الإشعار",
        variant: "destructive",
      });
    },
  });

  // Create notification
  const createNotificationMutation = useMutation({
    mutationFn: async (notification: Partial<Notification>) => {
      const response = await apiRequest('POST', '/api/notifications', notification);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const createNotification = (notification: Partial<Notification>) => {
    createNotificationMutation.mutate(notification);
  };

  // Filter notifications by type
  const getNotificationsByType = (type: Notification['type']) => {
    return notifications.filter(notification => notification.type === type);
  };

  // Get unread notifications
  const unreadNotifications = notifications.filter(notification => !notification.isRead);

  // Get pinned notifications
  const pinnedNotifications = notifications.filter(notification => notification.isPinned);

  return {
    notifications,
    unreadNotifications,
    pinnedNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    createNotification,
    getNotificationsByType,
    isMarkingAsRead: markAsReadMutation.isPending,
    isCreatingNotification: createNotificationMutation.isPending,
  };
}