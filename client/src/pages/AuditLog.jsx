import { useQuery } from '@tanstack/react-query';
import { getAuditLog } from '../api';
import { Card } from '../components/ui/index';
import { Activity, Truck, MapPin, Users, Wrench, Fuel, Settings, Clock } from 'lucide-react';

const ENTITY_ICONS = {
  trip: MapPin,
  vehicle: Truck,
  driver: Users,
  maintenance: Wrench,
  fuel: Fuel,
  setting: Settings,
};

const ENTITY_COLORS = {
  trip: 'bg-blue-500/10 text-blue-500',
  vehicle: 'bg-emerald-500/10 text-emerald-500',
  driver: 'bg-purple-500/10 text-purple-500',
  maintenance: 'bg-amber-500/10 text-amber-500',
  fuel: 'bg-rose-500/10 text-rose-500',
  setting: 'bg-zinc-500/10 text-zinc-500',
};

function timeAgo(dateStr) {
  const d = new Date(dateStr + 'Z');
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AuditLog() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => getAuditLog(100),
    refetchInterval: 5000,
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-white tracking-tight">Activity Feed</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Real-time audit log of all system actions
          </p>
        </div>
      </div>

      <Card className="rounded-[2rem] border-zinc-200/50 dark:border-white/5 p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500">Loading activity...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">No activity recorded yet.</p>
            <p className="text-xs text-zinc-400 mt-1">Actions will appear here as users interact with the system.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {logs.map((log) => {
              const Icon = ENTITY_ICONS[log.entity_type] || Activity;
              const colorClass = ENTITY_COLORS[log.entity_type] || 'bg-zinc-500/10 text-zinc-500';
              return (
                <div key={log.id} className="flex items-start gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 dark:text-white">
                      <span className="font-bold">{log.user_name || 'System'}</span>
                      <span className="text-zinc-500 dark:text-zinc-400"> {log.action}</span>
                      {log.entity_id && (
                        <span className="text-zinc-400 dark:text-zinc-500"> #{log.entity_id}</span>
                      )}
                    </p>
                    {log.details && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">{log.details}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-medium flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {timeAgo(log.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
