import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, UserCog } from 'lucide-react'
import toast from 'react-hot-toast'
import { getUsers, createUser, deleteUser } from '../api'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Button, Input, Select, PageHeader, Card, Badge } from '../components/ui/index'
import { ROLE_LABELS, ROLE_COLORS } from '../utils/constants'
import { useAuthStore } from '../store/authStore'

const ROLES = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']
const EMPTY = { name: '', email: '', password: '', role: 'dispatcher' }

const RBAC_TABLE = [
  { feature: 'Dashboard',         fleet: '✅', dispatcher: '✅', safety: '✅', finance: '✅' },
  { feature: 'Vehicles CRUD',     fleet: '✅', dispatcher: '👁️', safety: '👁️', finance: '👁️' },
  { feature: 'Retire Vehicle',    fleet: '✅', dispatcher: '❌', safety: '❌', finance: '❌' },
  { feature: 'Drivers CRUD',      fleet: '✅', dispatcher: '👁️', safety: '✅', finance: '👁️' },
  { feature: 'Safety Score Edit', fleet: '✅', dispatcher: '❌', safety: '✅', finance: '❌' },
  { feature: 'Create/Dispatch Trips', fleet: '✅', dispatcher: '✅', safety: '❌', finance: '❌' },
  { feature: 'Maintenance CRUD',  fleet: '✅', dispatcher: '❌', safety: '❌', finance: '❌' },
  { feature: 'Fuel & Expenses',   fleet: '✅', dispatcher: '✅', safety: '❌', finance: '✅' },
  { feature: 'Analytics',         fleet: '✅', dispatcher: '👁️', safety: '👁️', finance: '✅' },
  { feature: 'Settings / Users',  fleet: '✅', dispatcher: '❌', safety: '❌', finance: '❌' },
]

export default function Settings() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [modal, setModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const createMut = useMutation({ mutationFn: createUser, onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User created'); setModal(false); setForm(EMPTY) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })
  const deleteMut = useMutation({ mutationFn: deleteUser, onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User deleted'); setDeleteTarget(null) }, onError: err => toast.error(err.response?.data?.message || 'Failed') })

  const columns = [
    { key: 'name', label: 'Name', render: v => <span className="font-medium">{v}</span> },
    { key: 'email', label: 'Email', render: v => <span className="text-sm text-slate-500">{v}</span> },
    { key: 'role', label: 'Role', render: v => <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[v]}`}>{ROLE_LABELS[v]}</span> },
    { key: 'created_at', label: 'Joined', render: v => new Date(v).toLocaleDateString('en-IN') },
    {
      key: 'actions', label: '', sortable: false,
      render: (_, row) => row.id !== user?.id ? (
        <button onClick={() => setDeleteTarget(row)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      ) : <span className="text-xs text-slate-400 px-2">You</span>
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="User management and RBAC configuration" />

      {/* Current User */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white text-lg font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 inline-block ${ROLE_COLORS[user?.role]}`}>{ROLE_LABELS[user?.role]}</span>
          </div>
        </div>
      </Card>

      {/* User Management */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><UserCog className="w-4 h-4 text-brand-500" /> User Management</h3>
            <p className="text-xs text-slate-500 mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''} in the system</p>
          </div>
          <Button icon={Plus} size="sm" onClick={() => setModal(true)}>Add User</Button>
        </div>
        <DataTable columns={columns} data={users} loading={isLoading} emptyMessage="No users found." />
      </Card>

      {/* RBAC Reference Table */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Role Permissions Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Feature</th>
                {['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'].map(r => (
                  <th key={r} className="text-center py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {RBAC_TABLE.map(row => (
                <tr key={row.feature} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-6 font-medium text-slate-700">{row.feature}</td>
                  {[row.fleet, row.dispatcher, row.safety, row.finance].map((v, i) => (
                    <td key={i} className="py-2.5 px-3 text-center text-base">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New User" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!form.name || !form.email || !form.password) return toast.error('All fields required')
            createMut.mutate(form)
          }} loading={createMut.isPending}>Create User</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Password *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
          <Select label="Role *" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        loading={deleteMut.isPending} danger
        title="Delete User" confirmLabel="Delete User"
        message={`Delete ${deleteTarget?.name} (${deleteTarget?.email})? They will lose access immediately.`}
      />
    </div>
  )
}
