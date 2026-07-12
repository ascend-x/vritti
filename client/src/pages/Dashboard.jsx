import { useQuery } from '@tanstack/react-query'
import { Truck, Users, MapPin, Wrench, Activity, Clock, TrendingUp, AlertTriangle, X, Download, AlertOctagon } from 'lucide-react'
import { useState } from 'react'
import { getDashboardKPIs, getRecentTrips, getVehicleStatusDist, getMonthlyRevenue, getExpiringLicenses } from '../api'
import KPICard from '../components/ui/KPICard'
import StatusBadge from '../components/ui/StatusBadge'
import { Card } from '../components/ui/index'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDateTime } from '../utils/constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const STATUS_COLORS = {
  Available: '#84cc16', 'On Trip': '#3B82F6', 'In Shop': '#F59E0B', Retired: '#A1A1AA'
}

export default function Dashboard() {
  const [dismissBanner, setDismissBanner] = useState(false)
  const [dismissFatigue, setDismissFatigue] = useState(false)
  const [filters, setFilters] = useState({ type: '', status: '', region: '' })

  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpis', filters], queryFn: () => getDashboardKPIs(filters), refetchInterval: 30000
  })
  const { data: recentTrips = [] } = useQuery({
    queryKey: ['recent-trips', filters], queryFn: () => getRecentTrips(10, filters), refetchInterval: 30000
  })
  const { data: vehicleStatus = [] } = useQuery({
    queryKey: ['vehicle-status-dist', filters], queryFn: () => getVehicleStatusDist(filters)
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

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('VRITTI Fleet Operations - Executive Report', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Active Vehicles: ${kpis?.active_vehicles || 0}`, 14, 40);
    doc.text(`Total Trips on Road: ${kpis?.active_trips || 0}`, 14, 46);
    doc.text(`Fleet Utilization: ${kpis?.fleet_utilization_pct || 0}%`, 14, 52);
    
    const tableData = recentTrips.map(t => [
      t.id, t.vehicle_reg, t.driver_name, t.source, t.destination, t.status
    ]);
    
    autoTable(doc, {
      startY: 62,
      head: [['Trip ID', 'Vehicle', 'Driver', 'Source', 'Destination', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [132, 204, 22] }
    });
    
    doc.save('vritti-fleet-report.pdf');
  };

  const fatiguedDriver = recentTrips.find(t => t.status === 'Dispatched')?.driver_name || 'Ramesh Kumar';

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <select 
            className="border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 outline-none focus:border-brand-500"
            value={filters.type} 
            onChange={e => setFilters({...filters, type: e.target.value})}
          >
            <option value="">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Bike">Bike</option>
            <option value="Bus">Bus</option>
            <option value="Pickup">Pickup</option>
            <option value="Other">Other</option>
          </select>
          
          <select 
            className="border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 outline-none focus:border-brand-500"
            value={filters.status} 
            onChange={e => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
          
          <select 
            className="border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 outline-none focus:border-brand-500"
            value={filters.region} 
            onChange={e => setFilters({...filters, region: e.target.value})}
          >
            <option value="">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
        </div>
        <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-brand-950 font-bold rounded-xl transition-colors shadow-brand shrink-0">
          <Download className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>

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

      {/* Simulated Fatigue Banner */}
      {!dismissFatigue && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2.5 text-red-800">
            <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium">
              ⚠️ <span className="font-bold">Compliance Alert:</span> Driver {fatiguedDriver} has been driving for 11.5 hours. Mandatory rest period required immediately.
            </span>
          </div>
          <button onClick={() => setDismissFatigue(true)} className="text-red-500 hover:text-red-700 flex-shrink-0">
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
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Monthly Revenue (₹)</h3>
          {monthlyRevenue.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyRevenue} barSize={24}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: 12, backgroundColor: '#18181b', color: '#fff' }} itemStyle={{ color: '#84cc16' }} />
                <Bar dataKey="revenue" fill="#84cc16" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Vehicle Status Donut */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Vehicle Status</h3>
          {vehicleStatus.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={vehicleStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {vehicleStatus.map(entry => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#A1A1AA'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', backgroundColor: '#18181b', color: '#fff' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Recent Trips */}
      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Recent Trips</h3>
        <div className="overflow-x-auto rounded-2xl border border-zinc-100/50 dark:border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100/50 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-800/30">
                {['Route', 'Vehicle', 'Driver', 'Cargo', 'Revenue', 'Status', 'Time'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {recentTrips.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-sm">No trips yet</td></tr>
              ) : recentTrips.map((t, i) => (
                <tr key={t.id} className={`transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 ${i % 2 === 1 ? 'bg-zinc-50/30 dark:bg-zinc-800/10' : 'bg-transparent'}`}>
                  <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-200">{t.source} → {t.destination}</td>
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.vehicle_reg}</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{t.driver_name}</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{t.cargo_weight_kg} kg</td>
                  <td className="px-5 py-3 text-zinc-800 dark:text-zinc-200">{formatCurrency(t.revenue)}</td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3 text-zinc-400 dark:text-zinc-500 text-xs font-medium">{formatDateTime(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
