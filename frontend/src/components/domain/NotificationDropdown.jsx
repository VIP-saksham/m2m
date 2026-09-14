import React, { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notificationApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const fetchNotifications = async () => notificationApi.list();

export default function NotificationDropdown({ onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 30000,
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
        return notificationApi.markRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
         return notificationApi.markAllRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (id) => {
    markAsReadMutation.mutate(id);
    onClose();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <Check className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div ref={dropdownRef} className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-md">
        <h3 className="text-sm font-medium text-gray-900">{t('notifications.title')}</h3>
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllReadMutation.mutate()}
            className="text-xs text-forest hover:text-leaf font-medium"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">{t('common.loading')}</div>
        ) : isError ? (
          <div className="p-4 text-center text-sm text-red-600">Notifications could not be loaded.</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">{t('notifications.noNotifications')}</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.slice(0, 6).map((notification) => (
              <li 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.is_read ? 'border-l-4 border-l-leaf bg-leaf/5' : ''}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : t('common.success')}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 rounded-b-md">
        <button
          onClick={() => {
            navigate(user?.role === 'admin' ? '/admin/notifications' : user?.role === 'processor' || user?.role === 'buyer' ? '/processor/notifications' : '/farmer/notifications');
            onClose();
          }}
          className="w-full text-center text-sm text-forest font-medium hover:text-leaf"
        >
          {t('common.viewAll')} {t('notifications.title')}
        </button>
      </div>
    </div>
  );
}
