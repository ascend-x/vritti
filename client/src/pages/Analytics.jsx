import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { getVehicleROI, getFuelEfficiency, getCostBreakdown, getFleetUtilization, exportCSV } from '../api'
import DataTable from '../components/ui/DataTable'
import { Button, PageHeader, Card } from '../components/ui/index'
import { formatCurrency } from '../utils/constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import toast from 'react-hot-toast'

const CHART_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444']

export default function Analytics() {
  const { data: roi = [] } = useQuery({ queryKey: ['analytics-roi'], queryFn: getVehicleROI })
  const { data: efficiency = [] } = useQuery({ queryKey: ['analytics-efficiency'], queryFn: getFuelEfficiency })
  const { data: costs = [] } = useQuery({ queryKey: ['analytics-costs'], queryFn: getCostBreakdown })
  const { data: utilization = [] } = useQuery({ queryKey: ['analytics-utilization'], queryFn: () => getFleetUtilization({ period: 'monthly' }) })

  const handleExport = async (type) => {
    try {
      await exportCSV(type)
      toast.success(`${type} data exported!`)
    } catch { toast.error('Export failed') }
  }

  const roiColumns = [
    { key: 'reg_number', label: 'Vehicle', render: v => <span className="font-mono text-xs font-semibold">{v}</span> },
    { key: 'name_model', label: 'Model' },
    { key: 'completed_trips', label: 'Trips' },
    { key: 'total_revenue', label: 'Revenue', render: v => formatCurrency(v) },
    { key: 'total_op_cost', label: 'Op Cost', render: v => formatCurrency(v) },
    { key: 'acquisition_cost', label: 'Acq. Cost', render: v => formatCurrency(v) },
    {
      key: 'roi_pct', label: 'ROI %',
      render: v => (
        <span className={`font-bold text-sm ${v > 0 ? 'text-emerald-600' : v < 0 ? 'text-red-600' : 'text-slate-500'}`}>
          {v > 0 ? '+' : ''}{v}%
        </span>
      )
    },
  ]

  const efficiencyData = efficiency.filter(e => e.total_liters > 0).slice(0, 10)
  const costData = costs.filter(c => c.total_op_cost > 0).slice(0, 10)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={() => handleExport('roi')}>Export ROI</Button>
            <Button variant="secondary" icon={Download} size="sm" onClick={() => handleExport('trips')}>Export Trips</Button>
            <Button variant="secondary" icon={Download} size="sm" onClick={() => handleExport('fuel')}>Export Fuel</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Efficiency */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Fuel Efficiency (km/L) — Top Vehicles</h3>
          {efficiencyData.length === 0
            ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Complete trips to see efficiency data</div>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={efficiencyData} layout="vertical" barSize={14}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="reg_number" tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip formatter={(v) => [`${v} km/L`, 'Efficiency']} contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="km_per_liter" fill="#10B981" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#64748B' }} />
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Operational Cost Breakdown by Vehicle</h3>
          {costData.length === 0
            ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No cost data yet</div>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={costData} barSize={14}>
                  <XAxis dataKey="reg_number" tick={{ fontSize: 9, fill: '#94A3B8', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v, n) => [formatCurrency(v), n === 'total_fuel_cost' ? 'Fuel' : 'Maintenance']} contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="total_fuel_cost" name="Fuel" stackId="a" fill="#F59E0B" radius={[0,0,0,0]} />
                  <Bar dataKey="total_maint_cost" name="Maintenance" stackId="a" fill="#3B82F6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>

        {/* Fleet Utilization Trend */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Fleet Utilization Trend</h3>
          {utilization.length === 0
            ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No utilization data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
                <LineChart data={utilization}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="active_trips" name="Active Trips" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="vehicles_used" name="Vehicles Used" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
          }
        </Card>
      </div>

      {/* ROI Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Vehicle ROI Analysis</h3>
          <Button variant="secondary" icon={Download} size="sm" onClick={() => handleExport('roi')}>Export CSV</Button>
        </div>
        <DataTable columns={roiColumns} data={roi} emptyMessage="No analytics data. Complete trips to see ROI." />
      </Card>
    </div>
  )
}
