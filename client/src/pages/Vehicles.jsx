import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Truck, Edit, Archive, ExternalLink, FileText, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { getVehicles, createVehicle, updateVehicle, retireVehicle, getVehicleDocuments, uploadVehicleDocument, deleteVehicleDocument } from '../api'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Button, Input, Select, PageHeader, Card } from '../components/ui/index'
import { VEHICLE_TYPES, VEHICLE_STATUSES, REGIONS, formatCurrency } from '../utils/constants'
import { can } from '../utils/rbac'
import { useAuthStore } from '../store/authStore'

const EMPTY_FORM = { reg_number: '', name_model: '', type: 'Van', max_load_kg: '', odometer_km: '', acquisition_cost: '', region: '', notes: '', document_url: '' }

export default function Vehicles() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const role = user?.role

  const [filters, setFilters] = useState({ status: '', type: '', region: '', search: '' })
  const [modal, setModal] = useState(null) // null | 'add' | 'edit'
  const [docModal, setDocModal] = useState(null) // vehicle object or null
  const [selected, setSelected] = useState(null)
  const [confirmRetire, setConfirmRetire] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const { data: { data: vehicles = [] } = {}, isLoading } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => getVehicles({ ...filters }),
  })

  const createMut = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => { qc.invalidateQueries(['vehicles']); qc.invalidateQueries(['kpis']); toast.success('Vehicle registered!'); setModal(null) },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create vehicle'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateVehicle(id, data),
    onSuccess: () => { qc.invalidateQueries(['vehicles']); toast.success('Vehicle updated!'); setModal(null) },
    onError: err => toast.error(err.response?.data?.message || 'Update failed'),
  })
  const retireMut = useMutation({
    mutationFn: retireVehicle,
    onSuccess: () => { qc.invalidateQueries(['vehicles']); qc.invalidateQueries(['kpis']); toast.success('Vehicle retired'); setConfirmRetire(null) },
    onError: err => toast.error(err.response?.data?.message || 'Retire failed'),
  })

  const { data: docs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents', docModal?.id],
    queryFn: () => getVehicleDocuments(docModal.id),
    enabled: !!docModal
  })

  const uploadMut = useMutation({
    mutationFn: ({ id, formData }) => uploadVehicleDocument(id, formData),
    onSuccess: () => { qc.invalidateQueries(['documents', docModal?.id]); toast.success('Document uploaded'); },
    onError: () => toast.error('Upload failed')
  })

  const deleteDocMut = useMutation({
    mutationFn: deleteVehicleDocument,
    onSuccess: () => { qc.invalidateQueries(['documents', docModal?.id]); toast.success('Document deleted'); },
    onError: () => toast.error('Delete failed')
  })

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    uploadMut.mutate({ id: docModal.id, formData });
  }

  const openAdd = () => { setForm(EMPTY_FORM); setErrors({}); setModal('add') }
  const openEdit = (v) => { setSelected(v); setForm({ ...v }); setErrors({}); setModal('edit') }
  const handleField = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.reg_number) e.reg_number = 'Required'
    if (!form.name_model) e.name_model = 'Required'
    if (!form.max_load_kg || Number(form.max_load_kg) <= 0) e.max_load_kg = 'Must be > 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const payload = { ...form, max_load_kg: Number(form.max_load_kg), odometer_km: Number(form.odometer_km || 0), acquisition_cost: Number(form.acquisition_cost || 0) }
    if (modal === 'add') createMut.mutate(payload)
    else updateMut.mutate({ id: selected.id, data: payload })
  }

  const columns = [
    { key: 'reg_number', label: 'Reg No', render: v => <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">{v}</span> },
    { key: 'name_model', label: 'Name/Model' },
    { key: 'type', label: 'Type' },
    { key: 'max_load_kg', label: 'Capacity', render: v => `${v.toLocaleString('en-IN')} kg` },
    { key: 'odometer_km', label: 'Odometer', render: v => `${v.toLocaleString('en-IN')} km` },
    { key: 'acquisition_cost', label: 'Acq. Cost', render: v => formatCurrency(v) },
    { key: 'region', label: 'Region', render: v => v || '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'docs', label: 'Docs', render: (_, row) => (
        <button onClick={e => { e.stopPropagation(); setDocModal(row) }} className="text-brand-500 hover:underline flex items-center gap-1 font-medium text-xs">
          Manage
        </button>
      )
    },
    {
      key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          {can(role, 'canEditVehicle') && row.status !== 'Retired' && (
            <button onClick={e => { e.stopPropagation(); openEdit(row) }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {can(role, 'canRetireVehicle') && row.status !== 'Retired' && (
            <button onClick={e => { e.stopPropagation(); setConfirmRetire(row) }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-500">
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    },
  ]

  const FormContent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Registration Number *" value={form.reg_number} onChange={e => handleField('reg_number', e.target.value.toUpperCase())} placeholder="KA-01-AB-1234" error={errors.reg_number} disabled={modal === 'edit'} className="font-mono uppercase" />
        <Input label="Name / Model *" value={form.name_model} onChange={e => handleField('name_model', e.target.value)} placeholder="Tata Ace" error={errors.name_model} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Type *" value={form.type} onChange={e => handleField('type', e.target.value)}>
          {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
        </Select>
        <Input label="Max Load Capacity (kg) *" type="number" value={form.max_load_kg} onChange={e => handleField('max_load_kg', e.target.value)} placeholder="750" error={errors.max_load_kg} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Odometer (km)" type="number" value={form.odometer_km} onChange={e => handleField('odometer_km', e.target.value)} placeholder="0" />
        <Input label="Acquisition Cost (₹)" type="number" value={form.acquisition_cost} onChange={e => handleField('acquisition_cost', e.target.value)} placeholder="450000" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Region" value={form.region} onChange={e => handleField('region', e.target.value)}>
          <option value="">Select region</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </Select>
        <Input label="Document Link (URL)" type="url" value={form.document_url || ''} onChange={e => handleField('document_url', e.target.value)} placeholder="https://drive.google.com/..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Notes</label>
        <textarea className="input-field h-20 py-2.5 resize-none" value={form.notes} onChange={e => handleField('notes', e.target.value)} placeholder="Optional notes..." />
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fleet Registry"
        subtitle={`${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} total`}
        action={can(role, 'canCreateVehicle') && (
          <Button icon={Plus} onClick={openAdd}>Add Vehicle</Button>
        )}
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search reg / name..." className="input-field w-48" />
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input-field w-36">
            <option value="">All Status</option>
            {VEHICLE_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="input-field w-32">
            <option value="">All Types</option>
            {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))} className="input-field w-32">
            <option value="">All Regions</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          {(filters.search || filters.status || filters.type || filters.region) && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ status: '', type: '', region: '', search: '' })}>Clear</Button>
          )}
        </div>
      </Card>

      <DataTable columns={columns} data={vehicles} loading={isLoading} emptyMessage="No vehicles found. Add your first vehicle." />

      {/* Add/Edit Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Register New Vehicle' : 'Edit Vehicle'}
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>
            {modal === 'add' ? 'Register Vehicle' : 'Save Changes'}
          </Button>
        </>}
      >
        <FormContent />
      </Modal>

      {/* Retire confirm */}
      <ConfirmDialog
        isOpen={!!confirmRetire} onClose={() => setConfirmRetire(null)}
        onConfirm={() => retireMut.mutate(confirmRetire?.id)}
        loading={retireMut.isPending}
        title="Retire Vehicle" danger
        confirmLabel="Retire Vehicle"
        message={`Are you sure you want to retire ${confirmRetire?.reg_number}? This will remove it from all dispatch selections permanently.`}
      />

      {/* Document Modal */}
      <Modal isOpen={!!docModal} onClose={() => setDocModal(null)} title={`Documents: ${docModal?.reg_number}`} footer={<Button onClick={() => setDocModal(null)}>Close</Button>}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage documents like insurance, RC, or permits for this vehicle.</p>
            <label className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 text-brand-950 font-semibold rounded-lg cursor-pointer hover:bg-brand-600 transition text-sm">
              <Upload className="w-4 h-4" />
              {uploadMut.isPending ? 'Uploading...' : 'Upload'}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadMut.isPending} />
            </label>
          </div>
          
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
            {docsLoading ? (
              <div className="p-4 text-center text-zinc-500 text-sm">Loading...</div>
            ) : docs.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">No documents found.</div>
            ) : (
              docs.map(d => (
                <div key={d.id} className="p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-zinc-400" />
                    <div>
                      <a href={`http://localhost:5000${d.file_path}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">{d.name}</a>
                      <p className="text-xs text-zinc-500">{new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteDocMut.mutate(d.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition" disabled={deleteDocMut.isPending}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
