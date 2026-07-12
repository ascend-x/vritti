import { useEffect, useRef, useState } from 'react';

export default function KPICard({ icon: Icon, label, value, delta, color = 'amber', loading = false }) {
  const [displayed, setDisplayed] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    if (loading || value === undefined) return;
    const target = Number(value) || 0;
    const duration = 600;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(target * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, loading]);

  const colorMap = {
    amber:   { bg: 'bg-brand-50 dark:bg-brand-900/20',   icon: 'text-brand-600 dark:text-brand-400',   border: 'border-brand-100 dark:border-brand-800' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',    icon: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-100 dark:border-blue-800' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800' },
    red:     { bg: 'bg-red-50 dark:bg-red-900/20',     icon: 'text-red-600 dark:text-red-400',     border: 'border-red-100 dark:border-red-800' },
    slate:   { bg: 'bg-zinc-100 dark:bg-zinc-800/50',  icon: 'text-zinc-500 dark:text-zinc-400',   border: 'border-zinc-200 dark:border-zinc-700' },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20',  icon: 'text-purple-600 dark:text-purple-400',  border: 'border-purple-100 dark:border-purple-800' },
  };
  const c = colorMap[color] || colorMap.amber;

  if (loading) {
    return (
      <div className="kpi-card bg-white dark:bg-zinc-900/90 rounded-3xl p-6 shadow-soft dark:shadow-none border border-zinc-100/50 dark:border-white/5 animate-pulse transition-colors">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        </div>
        <div className="mt-4 h-10 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="mt-2 h-4 w-28 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="kpi-card bg-white dark:bg-zinc-900/90 rounded-3xl p-6 shadow-soft dark:shadow-none border border-zinc-100/50 dark:border-white/5 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center shadow-sm`}>
          {Icon && <Icon className={`w-6 h-6 ${c.icon}`} />}
        </div>
        {delta !== undefined && (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${delta >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-5">
        <p className="text-[34px] font-bold font-display text-zinc-900 dark:text-white tabular-nums tracking-tight leading-none">{displayed}</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>
      </div>
    </div>
  );
}
