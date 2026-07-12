import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Send, CheckCircle, XCircle, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip, getAvailableVehicles, getAvailableDrivers } from '../api'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Button, Input, Select, PageHeader, Card } from '../components/ui/index'
import { TRIP_STATUSES, formatCurrency, formatDateTime } from '../utils/constants'
import { can } from '../utils/rbac'
import { useAuthStore } from '../store/authStore'

const EMPTY_TRIP = { vehicle_id: '', driver_id: '', source: '', destination: '', cargo_weight_kg: '', planned_distance_km: '', revenue: '', notes: '' }
const EMPTY_COMPLETE = { end_odometer: '', actual_distance_km: '', fuel_liters: '', cost_per_liter: '' }

function CapacityBar({ cargo, maxLoad }) {
  if (!cargo || !maxLoad) return null
  const pct = Math.min((cargo / maxLoad) * 100, 100)
  const over = cargo > maxLoad
  const color = over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Cargo load</span>
        <span className={over ? 'text-red-600 font-semibold' : ''}>{cargo} / {maxLoad} kg</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {over && <p className="text-xs text-red-600 mt-1 font-medium">⚠ Exceeds vehicle capacity!</p>}
    </div>
  )
}

export default function Trips() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const role = user?.role

  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // 'create' | 'complete' | null
  const [selected, setSelected] = useState(null)
  const [cancelConfirm, setCancelConfirm] = useState(null)
  const [tripForm, setTripForm] = useState(EMPTY_TRIP)
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE)
  const [errors, setErrors] = useState({})

  const { data: { data: trips = [] } = {}, isLoading } = useQuery({
    queryKey: ['trips', statusFilter, search], queryFn: () => getTrips({ status: statusFilter, search }),
    refetchInterval: 15000,
  })
  const { data: availableVehicles = [] } = useQuery({ queryKey: ['available-vehicles'], queryFn: getAvailableVehicles, enabled: modal === 'create' })
  const { data: availableDrivers = [] } = useQuery({ queryKey: ['available-drivers'], queryFn: getAvailableDrivers, enabled: modal === 'create' })

  const invalidate = () => { qc.invalidateQueries(['trips']); qc.invalidateQueries(['kpis']); qc.invalidateQueries(['recent-trips']) }

  const createMut = useMutation({ mutationFn: createTrip, onSuccess: () => { invalidate(); toast.success('Trip created as Draft'); setModal(null); setTripForm(EMPTY_TRIP) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })
  const dispatchMut = useMutation({ mutationFn: dispatchTrip, onSuccess: () => { invalidate(); toast.success('🚛 Trip dispatched! Vehicle & Driver are now On Trip') }, onError: err => toast.error(err.response?.data?.message || 'Dispatch failed') })
  const completeMut = useMutation({ mutationFn: ({ id, data }) => completeTrip(id, data), onSuccess: () => { invalidate(); toast.success('✅ Trip completed! Vehicle & Driver are Available again'); setModal(null) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })
  const cancelMut = useMutation({ mutationFn: cancelTrip, onSuccess: () => { invalidate(); toast.success('Trip cancelled'); setCancelConfirm(null) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })

  const selectedVehicle = availableVehicles.find(v => v.id === Number(tripForm.vehicle_id))

  const handleTripField = (k, v) => setTripForm(f => ({ ...f, [k]: v }))

  const validateTrip = () => {
    const e = {}
    if (!tripForm.vehicle_id) e.vehicle_id = 'Required'
    if (!tripForm.driver_id) e.driver_id = 'Required'
    if (!tripForm.source) e.source = 'Required'
    if (!tripForm.destination) e.destination = 'Required'
    if (!tripForm.cargo_weight_kg) e.cargo_weight_kg = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreateTrip = () => {
    if (!validateTrip()) return
    createMut.mutate({ ...tripForm, cargo_weight_kg: Number(tripForm.cargo_weight_kg), planned_distance_km: Number(tripForm.planned_distance_km || 0), revenue: Number(tripForm.revenue || 0) })
  }

  const openComplete = (trip) => { setSelected(trip); setCompleteForm(EMPTY_COMPLETE); setModal('complete') }

  const handleComplete = () => {
    if (!completeForm.end_odometer || !completeForm.actual_distance_km) {
      return toast.error('End odometer and actual distance are required')
    }
    completeMut.mutate({ id: selected.id, data: { end_odometer: Number(completeForm.end_odometer), actual_distance_km: Number(completeForm.actual_distance_km), fuel_liters: Number(completeForm.fuel_liters || 0), cost_per_liter: Number(completeForm.cost_per_liter || 0) } })
  }

  const cargoOver = selectedVehicle && Number(tripForm.cargo_weight_kg) > selectedVehicle.max_load_kg

  const columns = [
    { key: 'id', label: '#', render: v => <span className="font-mono text-xs text-slate-400">#{v}</span> },
    { key: 'source', label: 'Route', render: (v, row) => <div><div className="font-medium text-slate-800">{v}</div><div className="text-xs text-slate-400">→ {row.destination}</div></div> },
    { key: 'vehicle_reg', label: 'Vehicle', render: v => <span className="font-mono text-xs font-semibold">{v}</span> },
    { key: 'driver_name', label: 'Driver' },
    { key: 'cargo_weight_kg', label: 'Cargo', render: v => `${v} kg` },
    { key: 'revenue', label: 'Revenue', render: v => formatCurrency(v) },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Created', render: v => <span className="text-xs text-slate-400">{formatDateTime(v)}</span> },
    {
      key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          {can(role, 'canDispatchTrip') && row.status === 'Draft' && (
            <button onClick={e => { e.stopPropagation(); dispatchMut.mutate(row.id) }} title="Dispatch" className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
          {can(role, 'canCompleteTrip') && row.status === 'Dispatched' && (
            <button onClick={e => { e.stopPropagation(); openComplete(row) }} title="Complete" className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors">
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {can(role, 'canCancelTrip') && ['Draft', 'Dispatched'].includes(row.status) && (
            <button onClick={e => { e.stopPropagation(); setCancelConfirm(row) }} title="Cancel" className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-500 transition-colors">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trip Management"
        subtitle={`${trips.length} trip${trips.length !== 1 ? 's' : ''}`}
        action={can(role, 'canCreateTrip') && (
          <Button icon={Plus} onClick={() => { setTripForm(EMPTY_TRIP); setErrors({}); setModal('create') }}>New Trip</Button>
        )}
      />

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {['', ...TRIP_STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
              ${statusFilter === s ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50' : 'text-slate-500 hover:text-slate-700'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search route, vehicle, driver..." className="input-field w-64" />
      </div>

      <DataTable columns={columns} data={trips} loading={isLoading} emptyMessage="No trips found." />

      {/* Create Trip Modal */}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Create New Trip" size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleCreateTrip} loading={createMut.isPending} disabled={cargoOver}>Create Trip</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Source *" value={tripForm.source} onChange={e => handleTripField('source', e.target.value)} placeholder="Bangalore Depot" error={errors.source} />
            <Input label="Destination *" value={tripForm.destination} onChange={e => handleTripField('destination', e.target.value)} placeholder="Chennai Hub" error={errors.destination} />
          </div>

          <Select label="Vehicle * (Available only)" value={tripForm.vehicle_id} onChange={e => handleTripField('vehicle_id', e.target.value)} error={errors.vehicle_id}>
            <option value="">Select vehicle</option>
            {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.name_model} ({v.max_load_kg} kg max)</option>)}
          </Select>

          <Select label="Driver * (Available + valid license only)" value={tripForm.driver_id} onChange={e => handleTripField('driver_id', e.target.value)} error={errors.driver_id}>
            <option value="">Select driver</option>
            {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.license_category} (exp: {d.license_expiry})</option>)}
          </Select>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input label="Cargo Weight (kg) *" type="number" value={tripForm.cargo_weight_kg} onChange={e => handleTripField('cargo_weight_kg', e.target.value)} error={errors.cargo_weight_kg} />
              {selectedVehicle && <CapacityBar cargo={Number(tripForm.cargo_weight_kg)} maxLoad={selectedVehicle.max_load_kg} />}
            </div>
            <Input label="Planned Distance (km)" type="number" value={tripForm.planned_distance_km} onChange={e => handleTripField('planned_distance_km', e.target.value)} />
            <Input label="Revenue (₹)" type="number" value={tripForm.revenue} onChange={e => handleTripField('revenue', e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea className="input-field h-16 py-2 resize-none" value={tripForm.notes} onChange={e => handleTripField('notes', e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal isOpen={modal === 'complete'} onClose={() => setModal(null)} title={`Complete Trip #${selected?.id}`} size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="success" onClick={handleComplete} loading={completeMut.isPending}>Complete Trip</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
            <strong>{selected?.source}</strong> → <strong>{selected?.destination}</strong><br />
            <span className="text-xs">Vehicle: {selected?.vehicle_reg} | Driver: {selected?.driver_name}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="End Odometer (km) *" type="number" value={completeForm.end_odometer} onChange={e => setCompleteForm(f => ({ ...f, end_odometer: e.target.value }))} />
            <Input label="Actual Distance (km) *" type="number" value={completeForm.actual_distance_km} onChange={e => setCompleteForm(f => ({ ...f, actual_distance_km: e.target.value }))} />
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Fuel Log (auto-recorded)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Fuel Consumed (liters)" type="number" value={completeForm.fuel_liters} onChange={e => setCompleteForm(f => ({ ...f, fuel_liters: e.target.value }))} placeholder="0" />
              <Input label="Cost per Liter (₹)" type="number" value={completeForm.cost_per_liter} onChange={e => setCompleteForm(f => ({ ...f, cost_per_liter: e.target.value }))} placeholder="95.50" />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelConfirm} onClose={() => setCancelConfirm(null)}
        onConfirm={() => cancelMut.mutate(cancelConfirm?.id)}
        loading={cancelMut.isPending} danger
        title="Cancel Trip" confirmLabel="Cancel Trip"
        message={`Cancel trip #${cancelConfirm?.id} (${cancelConfirm?.source} → ${cancelConfirm?.destination})? ${cancelConfirm?.status === 'Dispatched' ? 'Vehicle and driver will be set back to Available.' : ''}`}
      />
    </div>
  )
}
