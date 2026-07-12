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
    amber:   { bg: 'bg-brand-50 dark:bg-brand-900/30',   icon: 'text-brand-600 dark:text-brand-400',   border: 'border-brand-100 dark:border-brand-800' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-900/30',    icon: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-100 dark:border-blue-800' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800' },
    red:     { bg: 'bg-red-50 dark:bg-red-900/30',     icon: 'text-red-600 dark:text-red-400',     border: 'border-red-100 dark:border-red-800' },
    slate:   { bg: 'bg-slate-100 dark:bg-slate-800',  icon: 'text-slate-500 dark:text-slate-400',   border: 'border-slate-200 dark:border-slate-700' },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-900/30',  icon: 'text-purple-600 dark:text-purple-400',  border: 'border-purple-100 dark:border-purple-800' },
  };
  const c = colorMap[color] || colorMap.amber;

  if (loading) {
    return (
      <div className="kpi-card bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-kpi border border-slate-100 dark:border-slate-800 animate-pulse transition-colors">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="mt-3 h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="mt-1 h-4 w-24 bg-slate-100 dark:bg-slate-800/50 rounded" />
      </div>
    );
  }

  return (
    <div className="kpi-card bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-kpi border border-slate-100 dark:border-slate-800 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
        {delta !== undefined && (
          <span className={`text-xs font-medium ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold font-display text-slate-900 dark:text-white tabular-nums">{displayed}</p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}
