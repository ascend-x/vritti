import { useQuery } from '@tanstack/react-query';
import { getCarbonFootprint } from '../api';
import { Card } from '../components/ui/index';
import { Leaf, TreePine, Droplets, Route, Truck, TrendingDown } from 'lucide-react';

export default function CarbonFootprint() {
  const { data, isLoading } = useQuery({
    queryKey: ['carbon-footprint'],
    queryFn: getCarbonFootprint,
  });

  const summary = data?.summary || {};
  const trips = data?.trips || [];

  const kpiCards = [
    { label: 'Total CO₂ Emitted', value: `${summary.total_co2_kg?.toLocaleString() || 0} kg`, icon: Droplets, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Trees to Offset', value: summary.trees_needed || 0, icon: TreePine, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Avg CO₂/km', value: `${summary.avg_co2_per_km || 0} kg`, icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Total Fuel Used', value: `${summary.total_fuel_liters?.toLocaleString() || 0} L`, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Distance', value: `${summary.total_distance_km?.toLocaleString() || 0} km`, icon: Route, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Trips Analyzed', value: summary.total_trips || 0, icon: Truck, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Leaf className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-white tracking-tight">Carbon Footprint</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            ESG compliance & environmental impact tracking
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-zinc-500 py-12">Loading carbon data...</div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpiCards.map((kpi, i) => (
              <Card key={i} className="rounded-[2rem] border-zinc-200/50 dark:border-white/5 text-center">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mx-auto mb-3`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{kpi.value}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mt-1">{kpi.label}</p>
              </Card>
            ))}
          </div>

          {/* Impact Card */}
          <Card className="rounded-[2rem] border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 dark:border-emerald-500/20">
            <div className="flex items-center gap-6">
              <div className="text-6xl">🌳</div>
              <div>
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Carbon Offset Required</h3>
                <p className="text-sm text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                  Your fleet has emitted <strong>{summary.total_co2_kg?.toLocaleString()} kg</strong> of CO₂.
                  You would need to plant <strong className="text-2xl text-emerald-600 dark:text-emerald-300">{summary.trees_needed}</strong> trees
                  to offset one year of emissions (each tree absorbs ~21.77 kg CO₂/year).
                </p>
              </div>
            </div>
          </Card>

          {/* Trip-level breakdown */}
          <Card className="rounded-[2rem] border-zinc-200/50 dark:border-white/5 p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Per-Trip CO₂ Breakdown</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-3">Trip</th>
                  <th className="text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-3">Route</th>
                  <th className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-3">Distance</th>
                  <th className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-3">Fuel</th>
                  <th className="text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-6 py-3">CO₂</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">#{t.id}</td>
                    <td className="px-6 py-3 text-sm text-zinc-600 dark:text-zinc-400">{t.source} → {t.destination}</td>
                    <td className="px-6 py-3 text-sm text-center font-mono text-zinc-600 dark:text-zinc-400">{t.actual_distance_km?.toLocaleString() || '—'} km</td>
                    <td className="px-6 py-3 text-sm text-center font-mono text-zinc-600 dark:text-zinc-400">{t.fuel_liters > 0 ? `${t.fuel_liters} L` : '—'}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`text-sm font-bold ${t.co2_kg > 50 ? 'text-red-500' : t.co2_kg > 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {t.co2_kg} kg
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
