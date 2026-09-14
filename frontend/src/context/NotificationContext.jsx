import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { notificationApi } from '../services/api';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token, isAuthenticated } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchNotifications = async () => {
        try {
          const res = await notificationApi.list();
          setNotifications(res.notifications || []);
          const countRes = await notificationApi.count();
          setUnreadCount(countRes.count || 0);
        } catch (err) {
          console.error('Failed to fetch notifications', err);
        }
      };

      fetchNotifications();

      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token }
      });

      socket.on('notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        socket.disconnect();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, token]);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

