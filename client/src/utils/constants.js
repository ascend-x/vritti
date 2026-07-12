// Status color mappings for vehicles, drivers, trips
export const STATUS_STYLES = {
  // Vehicle statuses
  Available:  { bg: 'bg-emerald-50 dark:bg-emerald-500/10',  text: 'text-emerald-700 dark:text-emerald-400',  border: 'border-emerald-200 dark:border-emerald-500/20',  dot: 'bg-emerald-500' },
  'On Trip':  { bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-700 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-500/20',     dot: 'bg-blue-500' },
  'In Shop':  { bg: 'bg-amber-50 dark:bg-amber-500/10',    text: 'text-amber-700 dark:text-amber-400',    border: 'border-amber-200 dark:border-amber-500/20',    dot: 'bg-amber-500' },
  Retired:    { bg: 'bg-zinc-100 dark:bg-zinc-500/10',   text: 'text-zinc-600 dark:text-zinc-400',    border: 'border-zinc-200 dark:border-zinc-500/20',    dot: 'bg-zinc-500' },
  // Driver statuses
  'Off Duty': { bg: 'bg-zinc-100 dark:bg-zinc-500/10',   text: 'text-zinc-600 dark:text-zinc-400',    border: 'border-zinc-200 dark:border-zinc-500/20',    dot: 'bg-zinc-500' },
  Suspended:  { bg: 'bg-red-50 dark:bg-red-500/10',      text: 'text-red-700 dark:text-red-400',      border: 'border-red-200 dark:border-red-500/20',      dot: 'bg-red-500' },
  // Trip statuses
  Draft:      { bg: 'bg-zinc-100 dark:bg-zinc-500/10',   text: 'text-zinc-600 dark:text-zinc-400',    border: 'border-zinc-200 dark:border-zinc-500/20',    dot: 'bg-zinc-500' },
  Dispatched: { bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-700 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-500/20',     dot: 'bg-blue-500' },
  Completed:  { bg: 'bg-emerald-50 dark:bg-emerald-500/10',  text: 'text-emerald-700 dark:text-emerald-400',  border: 'border-emerald-200 dark:border-emerald-500/20',  dot: 'bg-emerald-500' },
  Cancelled:  { bg: 'bg-red-50 dark:bg-red-500/10',      text: 'text-red-700 dark:text-red-400',      border: 'border-red-200 dark:border-red-500/20',      dot: 'bg-red-500' },
  // Maintenance
  Active:     { bg: 'bg-amber-50 dark:bg-amber-500/10',    text: 'text-amber-700 dark:text-amber-400',    border: 'border-amber-200 dark:border-amber-500/20',    dot: 'bg-amber-500' },
  Closed:     { bg: 'bg-emerald-50 dark:bg-emerald-500/10',  text: 'text-emerald-700 dark:text-emerald-400',  border: 'border-emerald-200 dark:border-emerald-500/20',  dot: 'bg-emerald-500' },
};

export const ROLE_LABELS = {
  fleet_manager:     'Fleet Manager',
  dispatcher:        'Dispatcher',
  safety_officer:    'Safety Officer',
  financial_analyst: 'Financial Analyst',
};

export const ROLE_COLORS = {
  fleet_manager:     'bg-brand-100 text-brand-800',
  dispatcher:        'bg-blue-100 text-blue-800',
  safety_officer:    'bg-emerald-100 text-emerald-800',
  financial_analyst: 'bg-purple-100 text-purple-800',
};

export const VEHICLE_TYPES = ['Van', 'Truck', 'Bike', 'Bus', 'Pickup', 'Other'];
export const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];
export const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
export const TRIP_STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
export const LICENSE_CATEGORIES = ['LMV', 'HMV', 'HGMV', 'MCWG', 'Other'];
export const MAINTENANCE_TYPES = ['Oil Change', 'Tyre Replace', 'Engine Repair', 'Brake Service', 'Body Work', 'Other'];
export const EXPENSE_CATEGORIES = ['Toll', 'Repair', 'Fine', 'Permit', 'Other'];
export const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

export const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

export const formatNumber = (v, decimals = 0) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: decimals }).format(v || 0);

export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const daysUntilExpiry = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
};
