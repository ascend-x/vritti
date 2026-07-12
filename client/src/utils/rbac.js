// RBAC utility — maps roles to allowed actions
export const ROLES = {
  FLEET_MANAGER: 'fleet_manager',
  DISPATCHER: 'dispatcher',
  SAFETY_OFFICER: 'safety_officer',
  FINANCIAL_ANALYST: 'financial_analyst',
};

export const PERMISSIONS = {
  // Vehicles
  canCreateVehicle:   [ROLES.FLEET_MANAGER],
  canEditVehicle:     [ROLES.FLEET_MANAGER],
  canRetireVehicle:   [ROLES.FLEET_MANAGER],

  // Drivers
  canCreateDriver:    [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  canEditDriver:      [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  canSuspendDriver:   [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  canEditSafetyScore: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],

  // Trips
  canCreateTrip:      [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
  canDispatchTrip:    [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
  canCompleteTrip:    [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
  canCancelTrip:      [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],

  // Maintenance
  canManageMaintenance: [ROLES.FLEET_MANAGER],

  // Fuel & Expenses
  canManageFuel:      [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.FINANCIAL_ANALYST],

  // Analytics
  canExportData:      [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],

  // Settings
  canManageUsers:     [ROLES.FLEET_MANAGER],
};

export const NAV_ITEMS = [
  { path: '/',            label: 'Dashboard',     icon: 'LayoutDashboard', roles: ['fleet_manager','dispatcher','safety_officer','financial_analyst'] },
  { path: '/vehicles',    label: 'Fleet',         icon: 'Truck',           roles: ['fleet_manager','dispatcher','safety_officer','financial_analyst'] },
  { path: '/drivers',     label: 'Drivers',       icon: 'Users',           roles: ['fleet_manager','dispatcher','safety_officer','financial_analyst'] },
  { path: '/trips',       label: 'Trips',         icon: 'MapPin',          roles: ['fleet_manager','dispatcher','safety_officer','financial_analyst'] },
  { path: '/maintenance', label: 'Maintenance',   icon: 'Wrench',          roles: ['fleet_manager','dispatcher','safety_officer','financial_analyst'] },
  { path: '/fuel',        label: 'Fuel & Expenses',icon: 'Fuel',           roles: ['fleet_manager','dispatcher','financial_analyst'] },
  { path: '/analytics',   label: 'Analytics',     icon: 'BarChart3',       roles: ['fleet_manager','dispatcher','safety_officer','financial_analyst'] },
  { path: '/optimizer',   label: 'Route Optimizer',icon: 'Compass',         roles: ['fleet_manager','dispatcher'] },
  { path: '/leaderboard', label: 'Leaderboard',    icon: 'Trophy',          roles: ['fleet_manager','dispatcher','safety_officer','financial_analyst'] },
  { path: '/carbon',      label: 'Carbon Impact',  icon: 'Leaf',            roles: ['fleet_manager','dispatcher','safety_officer','financial_analyst'] },
  { path: '/audit',       label: 'Activity Feed',  icon: 'Activity',        roles: ['fleet_manager'] },
  { path: '/kanban',      label: 'Kanban Board',   icon: 'Kanban',          roles: ['fleet_manager','dispatcher'] },
  { path: '/settings',    label: 'Settings',      icon: 'Settings',        roles: ['fleet_manager'] },
];

export function can(userRole, permission) {
  return PERMISSIONS[permission]?.includes(userRole) ?? false;
}

export function getNavItems(userRole) {
  return NAV_ITEMS.filter(item => item.roles.includes(userRole));
}
