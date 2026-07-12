import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map, Truck, Users, LayoutDashboard, Wrench, Fuel, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PAGES = [
  { id: 'dashboard', name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { id: 'vehicles', name: 'Vehicles Registry', path: '/vehicles', icon: Truck },
  { id: 'drivers', name: 'Driver Management', path: '/drivers', icon: Users },
  { id: 'trips', name: 'Trip Tracking', path: '/trips', icon: Map },
  { id: 'maintenance', name: 'Maintenance Logs', path: '/maintenance', icon: Wrench },
  { id: 'fuel', name: 'Fuel & Expenses', path: '/fuel', icon: Fuel },
  { id: 'analytics', name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
  { id: 'settings', name: 'System Settings', path: '/settings', icon: SettingsIcon },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-cmd-k', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-cmd-k', handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredPages = PAGES.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen || filteredPages.length === 0) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredPages.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredPages.length) % filteredPages.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(filteredPages[selectedIndex].path);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, filteredPages, selectedIndex]);

  const handleSelect = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden z-[101] border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <Search className="w-5 h-5 text-zinc-400 mr-3" />
              <input
                autoFocus
                type="text"
                placeholder="Search pages, actions, and data..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 text-lg placeholder-zinc-400"
              />
              <div className="text-xs font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">ESC</div>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {filteredPages.length > 0 ? (
                <div>
                  <div className="px-3 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">Navigation</div>
                  {filteredPages.map((page, i) => {
                    const Icon = page.icon;
                    return (
                      <button
                        key={page.id}
                        onMouseEnter={() => setSelectedIndex(i)}
                        onClick={() => handleSelect(page.path)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${selectedIndex === i ? 'bg-zinc-100 dark:bg-zinc-800/80' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-500 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">{page.name}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  No results found for "{query}".
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
