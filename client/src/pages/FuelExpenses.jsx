import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Fuel } from 'lucide-react'
import toast from 'react-hot-toast'
import { getFuelLogs, createFuelLog, deleteFuelLog, getExpenses, createExpense, deleteExpense } from '../api'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Button, Input, Select, PageHeader, Card } from '../components/ui/index'
import { EXPENSE_CATEGORIES, formatCurrency, formatDate } from '../utils/constants'
import { can } from '../utils/rbac'
import { useAuthStore } from '../store/authStore'
import api from '../api/axiosInstance'

const TODAY = new Date().toISOString().slice(0,10)
const EMPTY_FUEL = { vehicle_id: '', date: TODAY, liters: '', cost_per_liter: '', odometer_at_fill: '', filled_by: '', notes: '' }
const EMPTY_EXP = { vehicle_id: '', category: 'Toll', amount: '', date: TODAY, description: '' }

export default function FuelExpenses() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const role = user?.role
  const [tab, setTab] = useState('fuel')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL)
  const [expForm, setExpForm] = useState(EMPTY_EXP)
  const [vehicles, setVehicles] = useState([])

  const fetchVehicles = async () => {
    const { data } = await api.get('/vehicles')
    setVehicles(data.data || [])
  }

  const { data: fuelData = { data: [], total_cost: 0 }, isLoading: fuelLoading } = useQuery({
    queryKey: ['fuel-logs'], queryFn: () => getFuelLogs({})
  })
  const { data: expData = { data: [], total_amount: 0 }, isLoading: expLoading } = useQuery({
    queryKey: ['expenses'], queryFn: () => getExpenses({})
  })

  const addFuelMut = useMutation({ mutationFn: createFuelLog, onSuccess: () => { qc.invalidateQueries(['fuel-logs']); toast.success('Fuel log added'); setModal(null) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })
  const delFuelMut = useMutation({ mutationFn: deleteFuelLog, onSuccess: () => { qc.invalidateQueries(['fuel-logs']); toast.success('Deleted'); setDeleteTarget(null) }, onError: err => toast.error('Delete failed') })
  const addExpMut = useMutation({ mutationFn: createExpense, onSuccess: () => { qc.invalidateQueries(['expenses']); toast.success('Expense recorded'); setModal(null) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })
  const delExpMut = useMutation({ mutationFn: deleteExpense, onSuccess: () => { qc.invalidateQueries(['expenses']); toast.success('Deleted'); setDeleteTarget(null) }, onError: err => toast.error('Delete failed') })

  const fuelColumns = [
    { key: 'vehicle_reg', label: 'Vehicle', render: v => <span className="font-mono text-xs font-semibold">{v}</span> },
    { key: 'date', label: 'Date', render: v => formatDate(v) },
    { key: 'liters', label: 'Liters', render: v => `${v} L` },
    { key: 'cost_per_liter', label: '₹/L', render: v => `₹${v}` },
    { key: 'total_cost', label: 'Total', render: v => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'odometer_at_fill', label: 'Odometer', render: v => v ? `${v.toLocaleString()} km` : '—' },
    { key: 'filled_by', label: 'Filled By', render: v => v || '—' },
    can(role, 'canManageFuel') ? {
      key: 'del', label: '', sortable: false,
      render: (_, row) => <button onClick={e => { e.stopPropagation(); setDeleteTarget({ id: row.id, type: 'fuel' }) }} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
    } : null,
  ].filter(Boolean)

  const expColumns = [
    { key: 'vehicle_reg', label: 'Vehicle', render: v => v ? <span className="font-mono text-xs font-semibold">{v}</span> : '—' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', render: v => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'date', label: 'Date', render: v => formatDate(v) },
    { key: 'description', label: 'Description', render: v => v || '—' },
    can(role, 'canManageFuel') ? {
      key: 'del', label: '', sortable: false,
      render: (_, row) => <button onClick={e => { e.stopPropagation(); setDeleteTarget({ id: row.id, type: 'expense' }) }} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
    } : null,
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fuel & Expenses"
        action={can(role, 'canManageFuel') && (
          <Button icon={Plus} onClick={() => { fetchVehicles(); setModal(tab === 'fuel' ? 'add-fuel' : 'add-exp') }}>
            {tab === 'fuel' ? 'Log Fuel' : 'Add Expense'}
          </Button>
        )}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-100/50 dark:border-white/5 shadow-soft dark:shadow-none">
          <div className="flex gap-4 items-center">
            <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400"><Fuel className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Total Fuel Cost</p>
              <p className="text-2xl font-bold font-display text-zinc-900 dark:text-white">{formatCurrency(fuelData.total_cost)}</p>
            </div>
          </div>
        </div>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><Plus className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Other Expenses</p>
              <p className="text-2xl font-bold font-display text-zinc-900 dark:text-white">{formatCurrency(expData.total_amount)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[['fuel', 'Fuel Logs'], ['expenses', 'Other Expenses']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === v ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50' : 'text-slate-500 hover:text-slate-700'}`}>
            {l} ({v === 'fuel' ? fuelData.data.length : expData.data.length})
          </button>
        ))}
      </div>

      {tab === 'fuel'
        ? <DataTable columns={fuelColumns} data={fuelData.data} loading={fuelLoading} emptyMessage="No fuel logs yet." />
        : <DataTable columns={expColumns} data={expData.data} loading={expLoading} emptyMessage="No expenses recorded yet." />
      }

      {/* Add Fuel Modal */}
      <Modal isOpen={modal === 'add-fuel'} onClose={() => setModal(null)} title="Log Fuel" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={() => { if (!fuelForm.vehicle_id || !fuelForm.liters || !fuelForm.cost_per_liter) return toast.error('Required fields missing'); addFuelMut.mutate({ ...fuelForm, liters: Number(fuelForm.liters), cost_per_liter: Number(fuelForm.cost_per_liter), odometer_at_fill: Number(fuelForm.odometer_at_fill || 0) }) }} loading={addFuelMut.isPending}>
            Save Fuel Log
          </Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Vehicle *" value={fuelForm.vehicle_id} onChange={e => setFuelForm(f => ({ ...f, vehicle_id: e.target.value }))}>
            <option value="">Select vehicle</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.name_model}</option>)}
          </Select>
          <Input label="Date *" type="date" value={fuelForm.date} onChange={e => setFuelForm(f => ({ ...f, date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Liters *" type="number" value={fuelForm.liters} onChange={e => setFuelForm(f => ({ ...f, liters: e.target.value }))} />
            <Input label="Cost per Liter (₹) *" type="number" value={fuelForm.cost_per_liter} onChange={e => setFuelForm(f => ({ ...f, cost_per_liter: e.target.value }))} />
          </div>
          {fuelForm.liters && fuelForm.cost_per_liter && (
            <div className="px-3 py-2 bg-brand-50 rounded-lg text-sm font-semibold text-brand-800">
              Total: {formatCurrency(Number(fuelForm.liters) * Number(fuelForm.cost_per_liter))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Odometer (km)" type="number" value={fuelForm.odometer_at_fill} onChange={e => setFuelForm(f => ({ ...f, odometer_at_fill: e.target.value }))} />
            <Input label="Filled By" value={fuelForm.filled_by} onChange={e => setFuelForm(f => ({ ...f, filled_by: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal isOpen={modal === 'add-exp'} onClose={() => setModal(null)} title="Record Expense" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={() => { if (!expForm.category || !expForm.amount || !expForm.date) return toast.error('Required fields missing'); addExpMut.mutate({ ...expForm, amount: Number(expForm.amount) }) }} loading={addExpMut.isPending}>
            Save Expense
          </Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Vehicle" value={expForm.vehicle_id} onChange={e => setExpForm(f => ({ ...f, vehicle_id: e.target.value }))}>
            <option value="">No vehicle (general)</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.name_model}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category *" value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}>
              {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Select>
            <Input label="Amount (₹) *" type="number" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <Input label="Date *" type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
          <Input label="Description" value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} placeholder="NH-44 Toll booth..." />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget.type === 'fuel' ? delFuelMut.mutate(deleteTarget.id) : delExpMut.mutate(deleteTarget.id)}
        loading={delFuelMut.isPending || delExpMut.isPending}
        title="Delete Record" danger confirmLabel="Delete"
        message="Are you sure you want to delete this record? This cannot be undone."
      />
    </div>
  )
}
