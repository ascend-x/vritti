import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useThemeStore } from '../../store/themeStore';

export default function AppShell() {
  const initTheme = useThemeStore(s => s.initTheme);
  
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="flex h-screen overflow-hidden text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px] min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-[1600px] mx-auto page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
