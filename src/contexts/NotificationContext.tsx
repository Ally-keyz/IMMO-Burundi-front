import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { NotificationItem } from '../lib/api';
import { notificationsApi } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/** Safety net for when the socket is down or the tab was closed. */
const POLL_MS = 20_000;

export function NotificationProvider({ children }: { children: ReactNode }): JSX.Element {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [serverUnread, setServerUnread] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const sortedRef = useRef<NotificationItem[]>([]);

  const unreadCount = useMemo(
    () => (serverUnread === null ? notifications.filter((n) => !n.read).length : serverUnread),
    [notifications, serverUnread],
  );

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setServerUnread(null);
      return;
    }
    setIsLoading(true);
    try {
      const [data, unread] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.unreadCount().catch(() => null),
      ]);
      const items = [...data.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setNotifications(items);
      /* The server total wins — the list is capped at one page. */
      setServerUnread(unread?.unread ?? items.filter((n) => !n.read).length);
      sortedRef.current = items;
    } catch {
      /* keep existing list on failure */
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  /* Poll, and refetch whenever the tab regains focus. */
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();

    const onNew = (payload: NotificationItem | { notification?: NotificationItem } | unknown) => {
      const notif = (payload as { notification?: NotificationItem })?.notification ?? (payload as NotificationItem);
      if (!notif || !(notif as NotificationItem)._id) return;
      setNotifications((prev) => {
        const next = [notif as NotificationItem, ...prev.filter((n) => n._id !== (notif as NotificationItem)._id)];
        sortedRef.current = next;
        return next;
      });
      /* Keep the badge honest without waiting for the next poll. */
      setServerUnread((prev) => (prev === null ? null : prev + 1));
    };

    socket.on('notification:new', onNew);
    return () => {
      socket.off('notification:new', onNew);
    };
  }, [isAuthenticated]);

  const markRead = useCallback(async (id: string): Promise<void> => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setServerUnread((prev) => (prev === null || prev <= 0 ? prev : prev - 1));
    try {
      await notificationsApi.markRead(id);
    } catch {
      /* optimistic update; the next poll reconciles */
    }
  }, []);

  const markAllRead = useCallback(async (): Promise<void> => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setServerUnread(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      /* non-critical */
    }
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, unreadCount, isLoading, markAllRead, markRead }),
    [notifications, unreadCount, isLoading, markAllRead, markRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}