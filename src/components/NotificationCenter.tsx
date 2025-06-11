/**
 * Notification Component
 * Displays real-time notifications for calls, translations, and system events
 */
'use client';

import { useEffect, useState } from 'react';
import { 
  BellIcon, 
  XIcon, 
  PhoneIcon, 
  LanguagesIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon,
  AlertTriangleIcon as ExclamationTriangleIcon,
  VolumeXIcon,
} from 'lucide-react';
import { useNotificationStore, Notification } from '@/stores/notificationStore';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction: (action: () => void) => void;
}

function NotificationToast({ notification, onDismiss, onAction }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleAction = (action: () => void) => {
    onAction(action);
    if (!notification.persistent) {
      handleDismiss();
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'call':
        return <PhoneIcon className="w-6 h-6" />;
      case 'translation':
        return <LanguagesIcon className="w-6 h-6" />;
      case 'success':
        return <CheckCircleIcon className="w-6 h-6" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6" />;
      case 'error':
        return <AlertTriangleIcon className="w-6 h-6" />;
      default:
        return <InfoIcon className="w-6 h-6" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'call':
        return 'bg-blue-500 text-white';
      case 'translation':
        return 'bg-purple-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  const getBorderClass = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[400px] max-w-[500px]
        border border-gray-200 dark:border-gray-700 ${getBorderClass()}
      `}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 p-2 rounded-full ${getColorClasses()}`}>
            {getIcon()}
          </div>
          
          <div className="ml-3 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.title}
                </h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {notification.message}
                </p>
              </div>
              
              {!notification.persistent && (
                <button
                  onClick={handleDismiss}
                  className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(action.action)}
                    className={`
                      px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200
                      ${action.style === 'primary' 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : action.style === 'danger'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            
            {/* Timestamp */}
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    isDoNotDisturb,
    setDoNotDisturb,
  } = useNotificationStore();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-full transition-colors duration-200
          ${isOpen ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}
        `}
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {isDoNotDisturb && (
          <VolumeXIcon className="absolute -bottom-1 -right-1 w-3 h-3 text-yellow-500" />
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDoNotDisturb(!isDoNotDisturb)}
                  className={`
                    p-1 rounded transition-colors duration-200
                    ${isDoNotDisturb ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}
                  `}
                  title={isDoNotDisturb ? 'Disable Do Not Disturb' : 'Enable Do Not Disturb'}
                >
                  <VolumeXIcon className="w-4 h-4" />
                </button>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <BellIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="p-2">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-3 rounded-lg mb-2 cursor-pointer transition-colors duration-200
                      ${notification.isRead 
                        ? 'bg-gray-50 dark:bg-gray-700' 
                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      }
                      hover:bg-gray-100 dark:hover:bg-gray-600
                    `}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {notifications.length > 5 && (
                  <div className="text-center p-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      and {notifications.length - 5} more...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  clearAll();
                  setIsOpen(false);
                }}
                className="w-full text-sm text-red-500 hover:text-red-600 transition-colors duration-200"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NotificationToasts() {
  const { notifications, removeNotification } = useNotificationStore();
  
  // Only show persistent notifications and recent non-persistent ones as toasts
  const toastNotifications = notifications
    .filter(n => n.persistent || (Date.now() - n.timestamp < 30000))
    .slice(0, 3); // Limit to 3 toasts

  const handleAction = (action: () => void) => {
    try {
      action();
    } catch (error) {
      console.error('Notification action failed:', error);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toastNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={removeNotification}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}