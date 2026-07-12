import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMaintenance, createMaintenance, closeMaintenance } from '../api'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Button, Input, Select, PageHeader, Card } from '../components/ui/index'
import { MAINTENANCE_TYPES, formatCurrency, formatDate } from '../utils/constants'
import { can } from '../utils/rbac'
import { useAuthStore } from '../store/authStore'
import api from '../api/axiosInstance'

const EMPTY_FORM = { vehicle_id: '', type: 'Oil Change', description: '', start_date: new Date().toISOString().slice(0,10), cost: '', technician: '', notes: '' }
const EMPTY_CLOSE = { end_date: new Date().toISOString().slice(0,10), cost: '' }

export default function Maintenance() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const role = user?.role

  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null) // 'add' | 'close' | null
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [closeForm, setCloseForm] = useState(EMPTY_CLOSE)

  // Fetch all non-retired vehicles for the dropdown
  const [vehicles, setVehicles] = useState([])
  const fetchVehicles = async () => {
    const { data } = await api.get('/vehicles', { params: { status: '' } })
    setVehicles((data.data || []).filter(v => v.status !== 'Retired'))
  }

  const { data: { data: records = [] } = {}, isLoading } = useQuery({
    queryKey: ['maintenance', statusFilter], queryFn: () => getMaintenance({ status: statusFilter })
  })

  const createMut = useMutation({
    mutationFn: createMaintenance,
    onSuccess: () => { qc.invalidateQueries(['maintenance']); qc.invalidateQueries(['kpis']); qc.invalidateQueries(['vehicles']); toast.success('Maintenance opened — Vehicle is now In Shop'); setModal(null) },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })
  const closeMut = useMutation({
    mutationFn: ({ id, data }) => closeMaintenance(id, data),
    onSuccess: () => { qc.invalidateQueries(['maintenance']); qc.invalidateQueries(['kpis']); qc.invalidateQueries(['vehicles']); toast.success('Maintenance closed — Vehicle is now Available'); setModal(null) },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  })

  const openAdd = () => { setForm(EMPTY_FORM); fetchVehicles(); setModal('add') }
  const openClose = (rec) => { setSelected(rec); setCloseForm({ end_date: new Date().toISOString().slice(0,10), cost: rec.cost }); setModal('close') }

  const handleSubmit = () => {
    if (!form.vehicle_id || !form.type || !form.start_date) return toast.error('Vehicle, type, and start date required')
    createMut.mutate({ ...form, cost: Number(form.cost || 0) })
  }

  const columns = [
    { key: 'vehicle_reg', label: 'Vehicle', render: (v) => <span className="font-mono text-xs font-semibold">{v}</span> },
    { key: 'vehicle_name', label: 'Name' },
    { key: 'type', label: 'Type', render: v => <span className="flex items-center gap-1.5"><Wrench className="w-3 h-3 text-amber-500" />{v}</span> },
    { key: 'description', label: 'Description', render: v => <span className="text-xs text-slate-500 max-w-48 block truncate">{v || '—'}</span> },
    { key: 'technician', label: 'Technician', render: v => v || '—' },
    { key: 'start_date', label: 'Start Date', render: v => formatDate(v) },
    { key: 'end_date', label: 'End Date', render: v => v ? formatDate(v) : '—' },
    { key: 'cost', label: 'Cost', render: v => formatCurrency(v) },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'actions', label: '', sortable: false,
      render: (_, row) => can(role, 'canManageMaintenance') && row.status === 'Active' ? (
        <button onClick={e => { e.stopPropagation(); openClose(row) }} title="Close Maintenance"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors">
          <CheckCircle className="w-3 h-3" /> Close
        </button>
      ) : null
    },
  ]

  const activeCount = records.filter(r => r.status === 'Active').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Maintenance"
        subtitle={`${activeCount} active record${activeCount !== 1 ? 's' : ''}`}
        action={can(role, 'canManageMaintenance') && (
          <Button icon={Plus} onClick={openAdd}>Log Maintenance</Button>
        )}
      />

      {/* Active maintenance alert */}
      {activeCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
          <Wrench className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {activeCount} vehicle{activeCount > 1 ? 's are' : ' is'} currently in maintenance and hidden from dispatch
          </p>
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-200">
        {[['', 'All'], ['Active', 'Active'], ['Closed', 'Closed']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${statusFilter === v ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={records} loading={isLoading} emptyMessage="No maintenance records." />

      {/* Add Modal */}
      <Modal isOpen={modal === 'add'} onClose={() => setModal(null)} title="Log Maintenance Record"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSubmit} loading={createMut.isPending}>Open Maintenance</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Vehicle *" value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
            <option value="">Select vehicle</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.name_model} ({v.status})</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Maintenance Type *" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {MAINTENANCE_TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
            <Input label="Start Date *" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea className="input-field h-16 py-2 resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the maintenance work..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Estimated Cost (₹)" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            <Input label="Technician / Workshop" value={form.technician} onChange={e => setForm(f => ({ ...f, technician: e.target.value }))} />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            ⚠ Opening maintenance will immediately set the vehicle status to <strong>In Shop</strong>
          </div>
        </div>
      </Modal>

      {/* Close Modal */}
      <Modal isOpen={modal === 'close'} onClose={() => setModal(null)} title="Close Maintenance Record" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="success" onClick={() => closeMut.mutate({ id: selected.id, data: { end_date: closeForm.end_date, cost: Number(closeForm.cost) } })} loading={closeMut.isPending}>
            Close & Release Vehicle
          </Button>
        </>}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
            <strong>{selected?.vehicle_reg}</strong> — {selected?.type}<br />
            <span className="text-xs">{selected?.description}</span>
          </div>
          <Input label="End Date" type="date" value={closeForm.end_date} onChange={e => setCloseForm(f => ({ ...f, end_date: e.target.value }))} />
          <Input label="Final Cost (₹)" type="number" value={closeForm.cost} onChange={e => setCloseForm(f => ({ ...f, cost: e.target.value }))} />
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            ✓ Closing will restore vehicle status to <strong>Available</strong>
          </div>
        </div>
      </Modal>
    </div>
  )
}
