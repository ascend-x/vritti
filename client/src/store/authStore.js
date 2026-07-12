import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      setAuth: (user, token) => set({ user, accessToken: token }),
      clearAuth: () => set({ user: null, accessToken: null }),

      getToken: () => get().accessToken,
      getUser: () => get().user,
      getRole: () => get().user?.role,

      // Role helpers
      isFleetManager: () => get().user?.role === 'fleet_manager',
      isDispatcher: () => get().user?.role === 'dispatcher',
      isSafetyOfficer: () => get().user?.role === 'safety_officer',
      isFinancialAnalyst: () => get().user?.role === 'financial_analyst',

      hasRole: (...roles) => roles.includes(get().user?.role),
    }),
    {
      name: 'vritti-auth-storage', // Key in localStorage
    }
  )
);
