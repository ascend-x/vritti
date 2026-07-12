import { Bell, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import { useQuery } from '@tanstack/react-query';
import { getExpiringLicenses } from '../../api';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/':            'Dashboard',
  '/vehicles':    'Fleet Registry',
  '/drivers':     'Driver Management',
  '/trips':       'Trip Management',
  '/maintenance': 'Maintenance',
  '/fuel':        'Fuel & Expenses',
  '/analytics':   'Analytics',
  '/settings':    'Settings',
};

export default function TopBar() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'VRITTI';

  const { data: expiring = [] } = useQuery({
    queryKey: ['expiring-licenses'],
    queryFn: getExpiringLicenses,
    refetchInterval: 60000,
  });

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center px-6 gap-4 flex-shrink-0 transition-colors">
      <h1 className="font-semibold text-slate-900 dark:text-white text-base flex-1">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* License expiry bell */}
        <div className="relative">
          <button className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          {expiring.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {expiring.length}
            </span>
          )}
        </div>

        {/* Role badge */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user?.role]}`}>
          {ROLE_LABELS[user?.role]}
        </span>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
