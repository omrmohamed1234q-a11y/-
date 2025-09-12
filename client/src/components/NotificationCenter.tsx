import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useWebSocket } from '@/hooks/use-websocket';

// Types
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  iconType?: string;
  actionUrl?: string;
  sourceId?: string;
  sourceType?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  clicked: boolean;
  actionData?: any;
  createdAt: string;
  readAt?: string;
  clickedAt?: string;
}

// Icon mapping
const getNotificationIcon = (iconType?: string, category?: string) => {
  const iconMap = {
    'package-plus': '📦',
    'truck': '🚛',
    'check-circle': '✅',
    'alert-circle': '⚠️',
    'gift': '🎁',
    'star': '⭐',
    'bell': '🔔',
    'user': '👤',
    'settings': '⚙️',
    'mail': '📧'
  };
  
  if (iconType && iconMap[iconType as keyof typeof iconMap]) {
    return iconMap[iconType as keyof typeof iconMap];
  }
  
  // Fallback based on category
  switch (category) {
    case 'order_created': return '📦';
    case 'order_updated': return '🔄';
    case 'delivery_update': return '🚛';
    case 'print_job_completed': return '🖨️';
    case 'system_alert': return '⚠️';
    case 'promotional': return '🎁';
    case 'welcome': return '👋';
    default: return '🔔';
  }
};

// Priority colors
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'text-red-600 bg-red-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'normal': return 'text-blue-600 bg-blue-50';
    case 'low': return 'text-gray-600 bg-gray-50';
    default: return 'text-blue-600 bg-blue-50';
  }
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Initialize WebSocket for real-time notifications
  const { state: wsState } = useWebSocket();

  // Fetch notifications (only if authenticated)
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['/api/notifications', filter],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/notifications?limit=50&offset=0`);
      return response;
    },
    enabled: !!user, // Only fetch if user is authenticated
    refetchInterval: isOpen ? 10000 : 30000, // Faster refresh when popover is open
  });

  // Fetch unread count (only if authenticated)
  const { data: unreadData } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications/unread-count');
      return response;
    },
    enabled: !!user, // Only fetch if user is authenticated
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  // Mark as clicked mutation
  const markAsClickedMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/click`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('DELETE', `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  const notifications: Notification[] = notificationsData?.notifications || [];
  const unreadCount = unreadData?.unreadCount || 0;
  
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    // Mark as clicked
    await markAsClickedMutation.mutateAsync(notification.id);

    // Close popover
    setIsOpen(false);

    // Navigate to action URL if exists using wouter
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, notification: Notification) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNotificationClick(notification);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markAsReadMutation.mutateAsync(notificationId);
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotificationMutation.mutateAsync(notificationId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          data-testid="button-notifications"
          aria-label={`الإشعارات ${unreadCount > 0 ? `(${unreadCount} غير مقروءة)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              data-testid="badge-unread-count"
              aria-label={`${unreadCount} إشعارات غير مقروءة`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        data-testid="popover-notifications"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg" data-testid="text-notifications-title">
              الإشعارات
            </h3>
            <div className="flex items-center gap-2">
              {/* Filter Toggle */}
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                data-testid="button-filter-unread"
                aria-label={filter === 'unread' ? 'عرض جميع الإشعارات' : 'عرض الإشعارات غير المقروءة'}
              >
                <Filter className="h-3 w-3 mr-1" />
                {filter === 'unread' ? 'الكل' : 'غير مقروءة'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-notifications"
                aria-label="إغلاق الإشعارات"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notifications List */}
          <ScrollArea className="h-96 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-notifications">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-notifications">
                {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      !notification.read ? 'bg-blue-50/50 border-blue-200' : 'bg-background border-gray-200'
                    } ${notification.priority === 'urgent' ? 'border-red-300' : notification.priority === 'high' ? 'border-orange-300' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => handleKeyDown(e, notification)}
                    data-testid={`notification-item-${notification.id}`}
                    aria-label={`إشعار: ${notification.title} - ${notification.message}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-xl flex-shrink-0">
                        {getNotificationIcon(notification.iconType, notification.category)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight" data-testid={`text-notification-title-${notification.id}`}>
                            {notification.title}
                          </h4>
                          
                          {/* Priority badge */}
                          {notification.priority !== 'normal' && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              data-testid={`badge-priority-${notification.priority}`}
                            >
                              {notification.priority === 'urgent' ? 'عاجل' :
                               notification.priority === 'high' ? 'مهم' : 'منخفض'}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2" data-testid={`text-notification-message-${notification.id}`}>
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground" data-testid={`text-notification-time-${notification.id}`}>
                            {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                          </span>

                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="h-6 w-6 p-0"
                                data-testid={`button-mark-read-${notification.id}`}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              data-testid={`button-delete-${notification.id}`}
                              aria-label="حذف الإشعار"
                              disabled={deleteNotificationMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-sm"
                  data-testid="button-view-all-notifications"
                >
                  عرض جميع الإشعارات
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}