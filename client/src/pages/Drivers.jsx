import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, ShieldOff, ShieldCheck, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getDrivers, createDriver, updateDriver, suspendDriver, reinstateDriver } from '../api'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Button, Input, Select, PageHeader, Card } from '../components/ui/index'
import { LICENSE_CATEGORIES, DRIVER_STATUSES, formatDate, daysUntilExpiry } from '../utils/constants'
import { can } from '../utils/rbac'
import { useAuthStore } from '../store/authStore'

const EMPTY_FORM = { name: '', license_number: '', license_category: 'LMV', license_expiry: '', contact: '', safety_score: 100, notes: '' }

function LicenseBadge({ expiry }) {
  const days = daysUntilExpiry(expiry)
  if (days === null) return <span className="text-slate-400">—</span>
  if (days < 0) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200"><AlertTriangle className="w-3 h-3" /> EXPIRED</span>
  if (days <= 30) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"><AlertTriangle className="w-3 h-3" /> {formatDate(expiry)} ({days}d)</span>
  return <span className="text-sm text-slate-600">{formatDate(expiry)}</span>
}

function SafetyBar({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono font-medium text-slate-600">{score}</span>
    </div>
  )
}

export default function Drivers() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const role = user?.role

  const [filters, setFilters] = useState({ status: '', category: '', search: '' })
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm] = useState(null) // { type, driver }
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const { data: { data: drivers = [] } = {}, isLoading } = useQuery({
    queryKey: ['drivers', filters], queryFn: () => getDrivers(filters)
  })

  const createMut = useMutation({ mutationFn: createDriver, onSuccess: () => { qc.invalidateQueries(['drivers']); qc.invalidateQueries(['kpis']); toast.success('Driver added!'); setModal(null) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })
  const updateMut = useMutation({ mutationFn: ({ id, data }) => updateDriver(id, data), onSuccess: () => { qc.invalidateQueries(['drivers']); toast.success('Driver updated!'); setModal(null) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })
  const suspendMut = useMutation({ mutationFn: suspendDriver, onSuccess: () => { qc.invalidateQueries(['drivers']); qc.invalidateQueries(['kpis']); toast.success('Driver suspended'); setConfirm(null) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })
  const reinstateMut = useMutation({ mutationFn: reinstateDriver, onSuccess: () => { qc.invalidateQueries(['drivers']); qc.invalidateQueries(['kpis']); toast.success('Driver reinstated'); setConfirm(null) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })

  const openAdd = () => { setForm(EMPTY_FORM); setErrors({}); setModal('add') }
  const openEdit = (d) => { setSelected(d); setForm({ ...d }); setErrors({}); setModal('edit') }
  const handleField = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Required'
    if (!form.license_number) e.license_number = 'Required'
    if (!form.license_expiry) e.license_expiry = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const payload = { ...form, safety_score: Number(form.safety_score) }
    if (modal === 'add') createMut.mutate(payload)
    else updateMut.mutate({ id: selected.id, data: payload })
  }

  const columns = [
    { key: 'name', label: 'Name', render: (v) => <span className="font-bold text-zinc-900 dark:text-zinc-100">{v}</span> },
    { key: 'license_number', label: 'License No', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'license_category', label: 'Category' },
    { key: 'license_expiry', label: 'Expiry', render: v => <LicenseBadge expiry={v} /> },
    { key: 'safety_score', label: 'Safety Score', render: v => <SafetyBar score={v} /> },
    { key: 'contact', label: 'Contact', render: v => v || '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          {can(role, 'canEditDriver') && (
            <button onClick={e => { e.stopPropagation(); openEdit(row) }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Edit className="w-3.5 h-3.5" /></button>
          )}
          {can(role, 'canSuspendDriver') && row.status !== 'Suspended' && row.status !== 'On Trip' && (
            <button onClick={e => { e.stopPropagation(); setConfirm({ type: 'suspend', driver: row }) }} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-500"><ShieldOff className="w-3.5 h-3.5" /></button>
          )}
          {can(role, 'canSuspendDriver') && row.status === 'Suspended' && (
            <button onClick={e => { e.stopPropagation(); setConfirm({ type: 'reinstate', driver: row }) }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-500 hover:text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" /></button>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Driver Management"
        subtitle={`${drivers.length} driver${drivers.length !== 1 ? 's' : ''} total`}
        action={can(role, 'canCreateDriver') && (
          <Button icon={Plus} onClick={openAdd}>Add Driver</Button>
        )}
      />

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search name / license..." className="input-field w-52" />
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input-field w-36">
            <option value="">All Status</option>
            {DRIVER_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="input-field w-32">
            <option value="">All Categories</option>
            {LICENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      <DataTable columns={columns} data={drivers} loading={isLoading} emptyMessage="No drivers found." />

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Driver' : 'Edit Driver'}
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>
            {modal === 'add' ? 'Add Driver' : 'Save Changes'}
          </Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name *" value={form.name} onChange={e => handleField('name', e.target.value)} error={errors.name} />
            <Input label="License Number *" value={form.license_number} onChange={e => handleField('license_number', e.target.value)} error={errors.license_number} className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="License Category" value={form.license_category} onChange={e => handleField('license_category', e.target.value)}>
              {LICENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Select>
            <Input label="License Expiry *" type="date" value={form.license_expiry} onChange={e => handleField('license_expiry', e.target.value)} error={errors.license_expiry} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Number" value={form.contact} onChange={e => handleField('contact', e.target.value)} placeholder="+91-9876543210" />
            {can(role, 'canEditSafetyScore') && (
              <div>
                <Input label={`Safety Score: ${form.safety_score}`} type="range" min={0} max={100} value={form.safety_score} onChange={e => handleField('safety_score', e.target.value)} />
                <SafetyBar score={Number(form.safety_score)} />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.type === 'suspend' ? suspendMut.mutate(confirm.driver.id) : reinstateMut.mutate(confirm.driver.id)}
        loading={suspendMut.isPending || reinstateMut.isPending}
        title={confirm?.type === 'suspend' ? 'Suspend Driver' : 'Reinstate Driver'}
        danger={confirm?.type === 'suspend'}
        confirmLabel={confirm?.type === 'suspend' ? 'Suspend' : 'Reinstate'}
        message={confirm?.type === 'suspend'
          ? `Suspend ${confirm?.driver?.name}? They will be blocked from all trip assignments.`
          : `Reinstate ${confirm?.driver?.name}? They will become available for trip assignments.`}
      />
    </div>
  )
}
