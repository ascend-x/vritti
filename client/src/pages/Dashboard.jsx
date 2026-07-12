import { useQuery } from '@tanstack/react-query'
import { Truck, Users, MapPin, Wrench, Activity, Clock, TrendingUp, AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { getDashboardKPIs, getRecentTrips, getVehicleStatusDist, getMonthlyRevenue, getExpiringLicenses } from '../api'
import KPICard from '../components/ui/KPICard'
import StatusBadge from '../components/ui/StatusBadge'
import { Card } from '../components/ui/index'
import { formatCurrency, formatDateTime } from '../utils/constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const STATUS_COLORS = {
  Available: '#10B981', 'On Trip': '#3B82F6', 'In Shop': '#F59E0B', Retired: '#94A3B8'
}

export default function Dashboard() {
  const [dismissBanner, setDismissBanner] = useState(false)

  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpis'], queryFn: getDashboardKPIs, refetchInterval: 30000
  })
  const { data: recentTrips = [] } = useQuery({
    queryKey: ['recent-trips'], queryFn: () => getRecentTrips(10), refetchInterval: 30000
  })
  const { data: vehicleStatus = [] } = useQuery({
    queryKey: ['vehicle-status-dist'], queryFn: getVehicleStatusDist
  })
  const { data: monthlyRevenue = [] } = useQuery({
    queryKey: ['monthly-revenue'], queryFn: () => getMonthlyRevenue(new Date().getFullYear())
  })
  const { data: expiring = [] } = useQuery({
    queryKey: ['expiring-licenses'], queryFn: getExpiringLicenses
  })

  const kpiCards = [
    { icon: Truck,    label: 'Active Vehicles',    value: kpis?.active_vehicles,      color: 'amber' },
    { icon: Truck,    label: 'Available',           value: kpis?.available_vehicles,   color: 'emerald' },
    { icon: Wrench,   label: 'In Maintenance',      value: kpis?.in_maintenance,       color: 'amber' },
    { icon: MapPin,   label: 'Active Trips',        value: kpis?.active_trips,         color: 'blue' },
    { icon: Clock,    label: 'Pending Trips',       value: kpis?.pending_trips,        color: 'slate' },
    { icon: Users,    label: 'Drivers On Duty',     value: kpis?.drivers_on_duty,      color: 'blue' },
    { icon: Activity, label: 'Fleet Utilization %', value: kpis?.fleet_utilization_pct,color: 'purple' },
    { icon: Users,    label: 'Suspended Drivers',   value: kpis?.drivers_suspended,    color: 'red' },
  ]

  return (
    <div className="space-y-6">
      {/* License expiry banner */}
      {!dismissBanner && expiring.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2.5 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-medium">
              ⚠️ {expiring.length} driver license{expiring.length > 1 ? 's' : ''} expiring within 30 days:&nbsp;
              <span className="font-semibold">{expiring.map(d => d.name).join(', ')}</span>
            </span>
          </div>
          <button onClick={() => setDismissBanner(true)} className="text-amber-500 hover:text-amber-700 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
        {kpiCards.map(({ icon, label, value, color }) => (
          <div key={label} className="col-span-1 sm:col-span-2">
            <KPICard icon={icon} label={label} value={value} color={color} loading={kpiLoading} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <Card className="lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Revenue (₹)</h3>
          {monthlyRevenue.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyRevenue} barSize={24}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#F59E0B" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Vehicle Status Donut */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Vehicle Status</h3>
          {vehicleStatus.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={vehicleStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {vehicleStatus.map(entry => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Recent Trips */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Trips</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Route', 'Vehicle', 'Driver', 'Cargo', 'Revenue', 'Status', 'Time'].map(h => (
                  <th key={h} className="pb-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentTrips.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No trips yet</td></tr>
              ) : recentTrips.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-slate-800">{t.source} → {t.destination}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600">{t.vehicle_reg}</td>
                  <td className="py-3 pr-4 text-slate-600">{t.driver_name}</td>
                  <td className="py-3 pr-4 text-slate-600">{t.cargo_weight_kg} kg</td>
                  <td className="py-3 pr-4 text-slate-800">{formatCurrency(t.revenue)}</td>
                  <td className="py-3 pr-4"><StatusBadge status={t.status} /></td>
                  <td className="py-3 text-slate-400 text-xs">{formatDateTime(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
