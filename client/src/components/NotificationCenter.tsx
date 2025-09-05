import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Check, 
  X, 
  Package, 
  Gift, 
  Megaphone, 
  Trophy, 
  Settings, 
  Truck,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Pin
} from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

function getNotificationIcon(type: Notification['type'], iconType: Notification['iconType']) {
  const iconProps = { className: "w-4 h-4" };
  
  // Type-based icons
  const typeIcons = {
    order: Package,
    delivery: Truck,
    coupon: Gift,
    announcement: Megaphone,
    reward: Trophy,
    system: Settings,
  };

  // Status-based colors
  const statusColors = {
    success: "text-green-500",
    warning: "text-yellow-500", 
    error: "text-red-500",
    info: "text-blue-500",
  };

  const IconComponent = typeIcons[type] || AlertCircle;
  const colorClass = statusColors[iconType] || "text-gray-500";
  
  return <IconComponent {...iconProps} className={`w-4 h-4 ${colorClass}`} />;
}

function NotificationItem({ notification, onMarkAsRead }: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
}) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const timeAgo = notification.sentAt 
    ? formatDistanceToNow(new Date(notification.sentAt), {
        addSuffix: true,
        locale: ar
      })
    : 'الآن';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        notification.isRead 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-white border-blue-200 shadow-sm'
      }`}
      onClick={handleClick}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type, notification.iconType)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-sm font-medium truncate ${
              notification.isRead ? 'text-gray-600' : 'text-gray-900'
            }`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {notification.isPinned && (
                <Pin className="w-3 h-3 text-yellow-500" />
              )}
              {notification.priority === 'urgent' && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  عاجل
                </Badge>
              )}
              {notification.priority === 'high' && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  مهم
                </Badge>
              )}
            </div>
          </div>
          
          <p className={`text-sm mb-2 ${
            notification.isRead ? 'text-gray-500' : 'text-gray-700'
          }`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{timeAgo}</span>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const { 
    notifications, 
    unreadNotifications, 
    pinnedNotifications,
    unreadCount, 
    isLoading, 
    markAsRead 
  } = useNotifications();

  if (!isOpen) return null;

  const filteredNotifications = 
    filter === 'unread' ? unreadNotifications :
    filter === 'pinned' ? pinnedNotifications :
    notifications;

  const markAllAsRead = () => {
    unreadNotifications.forEach(notification => {
      markAsRead(notification.id);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-16"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              الإشعارات
              {(unreadCount as number) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount as number}
                </Badge>
              )}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Filter tabs */}
          <div className="flex gap-2 mt-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs"
            >
              الكل ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
              className="text-xs"
            >
              غير مقروءة ({unreadCount as number})
            </Button>
            <Button
              variant={filter === 'pinned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pinned')}
              className="text-xs"
            >
              مثبتة ({pinnedNotifications.length})
            </Button>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-0 flex-1 overflow-hidden">
          {(unreadCount as number) > 0 && filter === 'all' && (
            <>
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="w-full text-xs"
                >
                  <Check className="w-3 h-3 mr-2" />
                  تحديد الكل كمقروء
                </Button>
              </div>
              <Separator />
            </>
          )}

          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="p-3 space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded mb-1"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length > 0 ? (
                <AnimatePresence>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' :
                     filter === 'pinned' ? 'لا توجد إشعارات مثبتة' :
                     'لا توجد إشعارات'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </motion.div>
    </motion.div>
  );
}