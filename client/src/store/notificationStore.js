import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) => set((state) => ({
    notifications: [
      { id: Date.now(), timestamp: new Date().toISOString(), read: false, ...notification },
      ...state.notifications,
    ].slice(0, 50), // Keep max 50
    unreadCount: state.unreadCount + 1,
  })),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
