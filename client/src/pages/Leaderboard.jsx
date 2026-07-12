import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../api';
import { Card } from '../components/ui/index';
import { Trophy, Medal, Shield, Fuel, MapPin, TrendingUp } from 'lucide-react';

const RANK_STYLES = {
  1: { bg: 'bg-gradient-to-r from-yellow-400/20 to-amber-400/10 border-yellow-300/50 dark:from-yellow-500/10 dark:to-amber-500/5 dark:border-yellow-500/20', badge: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-950', label: '🥇', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]' },
  2: { bg: 'bg-gradient-to-r from-zinc-200/40 to-zinc-300/20 border-zinc-300/50 dark:from-zinc-500/10 dark:to-zinc-600/5 dark:border-zinc-500/20', badge: 'bg-gradient-to-br from-zinc-300 to-zinc-400 text-zinc-800', label: '🥈', glow: '' },
  3: { bg: 'bg-gradient-to-r from-orange-200/30 to-orange-300/10 border-orange-200/50 dark:from-orange-500/10 dark:to-orange-600/5 dark:border-orange-500/20', badge: 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-950', label: '🥉', glow: '' },
};

export default function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
  });

  const drivers = data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-400">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-white tracking-tight">Driver Leaderboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Gamified rankings by composite performance score
          </p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {drivers.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[drivers[1], drivers[0], drivers[2]].map((driver, idx) => {
            const actualRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
            const style = RANK_STYLES[actualRank];
            return (
              <Card key={driver.id} className={`rounded-[2rem] border text-center ${style.bg} ${style.glow} ${actualRank === 1 ? 'transform -translate-y-2' : ''}`}>
                <div className="text-3xl mb-2">{style.label}</div>
                <div className={`w-14 h-14 rounded-full ${style.badge} flex items-center justify-center text-xl font-black mx-auto mb-3`}>
                  {driver.name?.[0]?.toUpperCase()}
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-lg">{driver.name}</h3>
                <p className="text-4xl font-black text-zinc-900 dark:text-white mt-2">{driver.composite_score}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mt-1">Points</p>
                <div className="mt-4 flex justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {driver.safety_score}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {driver.completed_trips}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Ranking Table */}
      <Card className="rounded-[2rem] border-zinc-200/50 dark:border-white/5 p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500">Loading leaderboard...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-4">Rank</th>
                <th className="text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-4">Driver</th>
                <th className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-4">Score</th>
                <th className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-4">Safety</th>
                <th className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-4">Trips</th>
                <th className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-4">On-Time</th>
                <th className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-4">Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {drivers.map((driver) => {
                const isTop3 = driver.rank <= 3;
                return (
                  <tr key={driver.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${isTop3 ? 'font-semibold' : ''}`}>
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        driver.rank === 1 ? 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400' :
                        driver.rank === 2 ? 'bg-zinc-200/50 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' :
                        driver.rank === 3 ? 'bg-orange-400/20 text-orange-600 dark:text-orange-400' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}>
                        {driver.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                          {driver.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm text-zinc-900 dark:text-white font-semibold">{driver.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-black text-zinc-900 dark:text-white">{driver.composite_score}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-bold ${driver.safety_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : driver.safety_score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {driver.safety_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">{driver.completed_trips}</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">{driver.on_time_pct}%</td>
                    <td className="px-6 py-4 text-center text-sm font-mono text-zinc-600 dark:text-zinc-400">{Number(driver.total_km).toLocaleString()} km</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
