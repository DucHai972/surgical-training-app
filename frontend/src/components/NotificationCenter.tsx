import { useState } from 'react';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Calendar, 
  MessageCircle, 
  Info, 
  AlertTriangle,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

interface Notification {
  name: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: number;
  created_at: string;
  read_at?: string;
  action_url?: string;
  icon?: string;
  priority: string;
  related_doctype?: string;
  related_doc?: string;
}

interface NotificationData {
  notifications: Notification[];
  unread_count: number;
  total_count: number;
}

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // API calls
  const { data: notificationData, error: notificationError, mutate: refreshNotifications } = useFrappeGetCall<NotificationData>(
    'surgical_training.api.notification.get_user_notifications',
    {
      limit: 50,
      offset: 0,
      only_unread: showOnlyUnread
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { call: markAsRead } = useFrappePostCall('surgical_training.api.notification.mark_notification_read');
  const { call: markAllAsRead } = useFrappePostCall('surgical_training.api.notification.mark_all_notifications_read');
  const { call: deleteNotification } = useFrappePostCall('surgical_training.api.notification.delete_notification');

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unread_count || 0;

  // Get appropriate icon for notification type
  const getNotificationIcon = (notification: Notification) => {
    const iconSize = 16;
    
    if (notification.icon) {
      switch (notification.icon) {
        case 'calendar': return <Calendar size={iconSize} />;
        case 'message-circle': return <MessageCircle size={iconSize} />;
        case 'bell': return <Bell size={iconSize} />;
        case 'info': return <Info size={iconSize} />;
        default: return <Info size={iconSize} />;
      }
    }

    switch (notification.notification_type) {
      case 'session': return <Calendar size={iconSize} />;
      case 'comment': return <MessageCircle size={iconSize} />;
      case 'warning': return <AlertTriangle size={iconSize} />;
      case 'error': return <AlertTriangle size={iconSize} />;
      default: return <Info size={iconSize} />;
    }
  };

  // Get notification type styling
  const getNotificationStyle = (notification: Notification) => {
    const baseClasses = "p-4 border-l-4 transition-colors hover:bg-gray-50";
    
    switch (notification.notification_type) {
      case 'error':
        return `${baseClasses} border-red-500 ${notification.is_read ? 'bg-red-50/50' : 'bg-red-50'}`;
      case 'warning':
        return `${baseClasses} border-yellow-500 ${notification.is_read ? 'bg-yellow-50/50' : 'bg-yellow-50'}`;
      case 'success':
        return `${baseClasses} border-green-500 ${notification.is_read ? 'bg-green-50/50' : 'bg-green-50'}`;
      case 'session':
        return `${baseClasses} border-blue-500 ${notification.is_read ? 'bg-blue-50/50' : 'bg-blue-50'}`;
      case 'comment':
        return `${baseClasses} border-purple-500 ${notification.is_read ? 'bg-purple-50/50' : 'bg-purple-50'}`;
      default:
        return `${baseClasses} border-gray-500 ${notification.is_read ? 'bg-gray-50/50' : 'bg-gray-50'}`;
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notification_id: notificationId });
      await refreshNotifications();
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
      await refreshNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification({ notification_id: notificationId });
      await refreshNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Handle notification action
  const handleNotificationAction = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await handleMarkAsRead(notification.name);
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Filter and Actions */}
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showOnlyUnread}
                  onChange={(e) => setShowOnlyUnread(e.target.checked)}
                  className="mr-2"
                />
                Unread only
              </label>
              
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck size={14} className="mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notificationError && (
              <div className="p-4 text-center text-red-600">
                Failed to load notifications
              </div>
            )}

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {showOnlyUnread ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.name}
                    className={getNotificationStyle(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>

                          {/* Read indicator */}
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2">
                          {notification.action_url && (
                            <button
                              onClick={() => handleNotificationAction(notification)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <ExternalLink size={12} />
                              View
                            </button>
                          )}
                          
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.name)}
                              className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                            >
                              <Check size={12} />
                              Mark read
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteNotification(notification.name)}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <p className="text-xs text-gray-500">
                Showing {notifications.length} of {notificationData?.total_count || 0} notifications
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;