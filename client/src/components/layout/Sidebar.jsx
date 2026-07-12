import { NavLink, useNavigate } from 'react-router-dom';
import { Truck, LayoutDashboard, Users, MapPin, Wrench, Fuel, BarChart3, Settings, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getNavItems } from '../../utils/rbac';
import { ROLE_LABELS } from '../../utils/constants';
import { logout } from '../../api';
import toast from 'react-hot-toast';

const ICON_MAP = { LayoutDashboard, Truck, Users, MapPin, Wrench, Fuel, BarChart3, Settings };

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const navItems = getNavItems(user?.role || '');

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    clearAuth();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-30" style={{ background: '#0F172A' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold font-display text-white text-sm leading-tight">VRITTI</p>
            <p className="text-[10px] text-slate-500 leading-tight">Flow State Ops</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(item => {
          const Icon = ICON_MAP[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                ${isActive
                  ? 'nav-active-bar text-brand-400 bg-brand-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{ROLE_LABELS[user?.role]}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors" title="Logout">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
