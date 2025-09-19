import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Eye, Filter, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Simple state management
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  console.log('🔔 NotificationCenter loaded, user:', user?.email);

  // Load notifications with simple fetch
  useEffect(() => {
    if (!user?.id) return;
    
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📡 Loading notifications...');
        const response = await fetch('/api/notifications?limit=10', {
          method: 'GET',
          headers: {
            'X-Admin-Token': 'dev-test-token',
            'X-User-ID': '3e3882cc-81fa-48c9-bc69-c290128f4ff2'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setNotifications(data.notifications || []);
        console.log('✅ Loaded notifications:', data.notifications?.length || 0);
      } catch (err) {
        console.error('❌ Error loading notifications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotifications();
  }, [user?.id]);

  // Initialize WebSocket for real-time notifications
  const { state: wsState } = useWebSocket();

  // Handle mark as read
  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'X-Admin-Token': 'dev-test-token',
          'X-User-ID': '3e3882cc-81fa-48c9-bc69-c290128f4ff2'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Handle delete notification
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': 'dev-test-token',
          'X-User-ID': '3e3882cc-81fa-48c9-bc69-c290128f4ff2'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
    }
  };

  // Computed values
  const notificationCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  // Define notification priority colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
      default:
        return 'text-blue-600';
    }
  };

  // Format notification time
  const formatNotificationTime = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ar });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative p-1.5"
          data-testid="button-notification-center"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -left-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0 arabic-nums"
              data-testid="badge-notification-count"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-80 p-0 ml-2" 
        align="end"
        data-testid="popover-notification-content"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base" data-testid="title-notifications">
              الإشعارات {notificationCount > 0 && <span className="text-sm text-muted-foreground">({notificationCount})</span>}
            </h3>
            
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-auto h-8 text-sm" data-testid="select-notification-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="unread">غير مقروءة</SelectItem>
                  <SelectItem value="read">مقروءة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-destructive">خطأ في تحميل الإشعارات: {error}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 
                   filter === 'read' ? 'لا توجد إشعارات مقروءة' : 
                   'لا توجد إشعارات'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-blue-600' : 'bg-gray-300'}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority === 'high' ? 'عالية' : notification.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </span>
                          {notification.category && (
                            <Badge variant="outline" className="text-xs h-5">
                              {notification.category}
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-sm mb-1 line-clamp-2" data-testid={`text-notification-title-${notification.id}`}>
                          {notification.title}
                        </h4>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2" data-testid={`text-notification-body-${notification.id}`}>
                          {notification.body}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground" data-testid={`text-notification-time-${notification.id}`}>
                            {formatNotificationTime(notification.createdAt)}
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