import { NavLink, useNavigate } from 'react-router-dom';
import { Truck, LayoutDashboard, Users, MapPin, Wrench, Fuel, BarChart3, Settings, LogOut, Zap, Compass, Trophy, Leaf, Activity, Kanban } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getNavItems } from '../../utils/rbac';
import { ROLE_LABELS } from '../../utils/constants';
import { logout } from '../../api';
import toast from 'react-hot-toast';

const ICON_MAP = { LayoutDashboard, Truck, Users, MapPin, Wrench, Fuel, BarChart3, Settings, Compass, Trophy, Leaf, Activity, Kanban };

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
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] flex flex-col z-30 bg-sidebar border-r border-white/5">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-brand">
          <Zap className="w-5 h-5 text-sidebar" fill="currentColor" />
        </div>
        <div>
          <p className="font-bold font-display text-white text-lg leading-tight tracking-wide">VRITTI</p>
          <p className="text-[11px] text-zinc-500 font-medium leading-tight">Flow State Ops</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        <div className="text-xs font-bold text-zinc-600 tracking-wider mb-4 px-2 uppercase">Dashboard</div>
        {navItems.map(item => {
          const Icon = ICON_MAP[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group
                ${isActive
                  ? 'text-brand-400 bg-sidebar-active'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-sidebar-hover'
                }`
              }
            >
              {Icon && <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />}
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-sidebar-hover">
          <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 text-sm font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-200 truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate font-medium">{ROLE_LABELS[user?.role]}</p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
