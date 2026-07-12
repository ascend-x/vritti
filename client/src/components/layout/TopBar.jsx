import { Bell, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import { useQuery } from '@tanstack/react-query';
import { getExpiringLicenses } from '../../api';
import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

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
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const { data: expiring = [] } = useQuery({
    queryKey: ['expiring-licenses'],
    queryFn: getExpiringLicenses,
    refetchInterval: 60000,
  });

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-20 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center px-8 gap-4 flex-shrink-0 transition-colors duration-300">
      <h1 className="font-bold font-display text-zinc-900 dark:text-white text-2xl flex-1 tracking-tight">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all active:scale-95 shadow-sm">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* License expiry bell */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all active:scale-95 shadow-sm">
            <Bell className="w-4 h-4" />
          </button>
          {expiring.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm animate-pulse-soft">
              {expiring.length}
            </span>
          )}

          {/* Popover */}
          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-900 rounded-3xl shadow-modal border border-zinc-200 dark:border-zinc-800 animate-slide-up overflow-hidden z-50 p-2">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Notifications</h3>
              </div>
              <div className="max-h-60 overflow-y-auto p-2">
                {expiring.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 p-4 text-center">You're all caught up!</p>
                ) : (
                  expiring.map(d => (
                    <div key={d.license_number} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl mb-2 last:mb-0">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400">License Expiring Soon</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1"><span className="font-medium text-zinc-800 dark:text-zinc-200">{d.name}</span>'s license ({d.license_number}) expires on {d.license_expiry}.</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{user?.name}</p>
            <p className={`text-[11px] font-semibold mt-0.5 ${ROLE_COLORS[user?.role]}`}>{ROLE_LABELS[user?.role]}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-500 shadow-brand flex items-center justify-center text-zinc-900 text-sm font-bold border-2 border-white dark:border-zinc-800">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
