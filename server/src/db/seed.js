require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../vritti.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const fs = require('fs');
const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations/001_init.sql'), 'utf-8');
db.exec(migrationSQL);

function seed() {
  console.log('\n🌱 Seeding VRITTI database...\n');

  // ─── USERS ───
  const pwHash = bcrypt.hashSync('password123', 12);
  const users = [
    ['Admin User',   'admin@vritti.com',    pwHash, 'fleet_manager'],
    ['Sam Dispatch', 'dispatch@vritti.com', pwHash, 'dispatcher'],
    ['Priya Safety', 'safety@vritti.com',   pwHash, 'safety_officer'],
    ['Ravi Finance', 'finance@vritti.com',  pwHash, 'financial_analyst'],
  ];
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?,?,?,?)');
  users.forEach(u => insertUser.run(...u));
  console.log('✓ Users seeded (4)');

  // ─── VEHICLES ───
  const vehicles = [
    ['KA-01-AB-1001', 'Tata Ace',              'Van',    750,   15200, 450000,  'Available', 'South'],
    ['KA-01-AB-1002', 'Ashok Leyland 1616',    'Truck',  16000, 87400, 2800000, 'Available', 'South'],
    ['MH-04-CD-2001', 'Mahindra Bolero Pickup','Pickup', 1000,  34500, 750000,  'On Trip',   'West'],
    ['TN-07-EF-3001', 'Eicher 12.10',          'Truck',  8000,  120300,1600000, 'In Shop',   'South'],
    ['DL-01-GH-4001', 'TATA 407',              'Van',    2500,  56800, 900000,  'Available', 'North'],
    ['RJ-14-IJ-5001', 'Hero Splendor',         'Bike',   150,   8900,  75000,   'Available', 'North'],
    ['KA-01-KL-6001', 'Volvo FH16',            'Truck',  25000, 203000,8500000, 'Available', 'South'],
    ['MH-12-MN-7001', 'Force Traveller',       'Bus',    3000,  67200, 1200000, 'Retired',   'West'],
  ];
  const insertVehicle = db.prepare(`INSERT OR IGNORE INTO vehicles (reg_number, name_model, type, max_load_kg, odometer_km, acquisition_cost, status, region) VALUES (?,?,?,?,?,?,?,?)`);
  vehicles.forEach(v => insertVehicle.run(...v));
  console.log('✓ Vehicles seeded (8)');

  // ─── DRIVERS ───
  const today = new Date();
  const fDate = (y) => new Date(today.getFullYear() + y, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  const pDate = (d) => new Date(today.getTime() - d * 86400000).toISOString().slice(0, 10);
  const sDate = (d) => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);

  const drivers = [
    ['Rajesh Kumar',   'KA-HMV-2019-001',  'HMV',  fDate(3), '+91-9876500001', 92,  'Available'],
    ['Suresh Babu',    'TN-LMV-2020-002',  'LMV',  fDate(2), '+91-9876500002', 78,  'On Trip'],
    ['Mohan Das',      'MH-HMV-2018-003',  'HMV',  fDate(1), '+91-9876500003', 85,  'Available'],
    ['Pradeep Singh',  'DL-HGMV-2021-004', 'HGMV', fDate(4), '+91-9876500004', 96,  'Available'],
    ['Alex Thomas',    'KL-LMV-2015-005',  'LMV',  pDate(90),'+91-9876500005', 70,  'Off Duty'],  // Expired
    ['Vikas Sharma',   'RJ-HMV-2022-006',  'HMV',  fDate(5), '+91-9876500006', 55,  'Suspended'], // Suspended
    ['Anita Devi',     'UP-LMV-2023-007',  'LMV',  sDate(20),'+91-9876500007', 88,  'Available'], // Expiring soon
  ];
  const insertDriver = db.prepare(`INSERT OR IGNORE INTO drivers (name, license_number, license_category, license_expiry, contact, safety_score, status) VALUES (?,?,?,?,?,?,?)`);
  drivers.forEach(d => insertDriver.run(...d));
  console.log('✓ Drivers seeded (7)');

  // Get IDs
  const veh = db.prepare('SELECT id, reg_number FROM vehicles').all();
  const drv = db.prepare('SELECT id, name FROM drivers').all();
  const vId = (reg) => veh.find(v => v.reg_number === reg)?.id;
  const dId = (name) => drv.find(d => d.name === name)?.id;

  // ─── MAINTENANCE ───
  const maintenances = [
    // Active — TN-07-EF-3001 is In Shop
    [vId('TN-07-EF-3001'), 'Engine Repair',  'Overheating issue during long haul', '2025-07-08', null,         28000, 'Active', 'Ramesh Auto Works'],
    // Closed history
    [vId('KA-01-AB-1001'), 'Oil Change',     '15,000 km scheduled service',         '2025-05-10', '2025-05-11', 3500,  'Closed', 'Depot Workshop'],
    [vId('KA-01-AB-1002'), 'Tyre Replace',   'Front axle tyres worn out',           '2025-04-20', '2025-04-22', 18000, 'Closed', 'MRF Service Center'],
    [vId('KA-01-KL-6001'), 'Brake Service',  'Brake pads replaced',                 '2025-03-15', '2025-03-16', 12000, 'Closed', 'Bosch Service'],
  ];
  const insertMaint = db.prepare(`INSERT OR IGNORE INTO maintenance_logs (vehicle_id, type, description, start_date, end_date, cost, status, technician) VALUES (?,?,?,?,?,?,?,?)`);
  maintenances.forEach(m => insertMaint.run(...m));
  console.log('✓ Maintenance seeded (4)');

  // ─── TRIPS ───
  const trips = [
    // Active dispatched trip — vehicle + driver On Trip
    [vId('MH-04-CD-2001'), dId('Suresh Babu'),   'Pune Depot',        'Goa Hub',              800,  450, null, 22000,  'Dispatched', 56000,  null,   '2025-07-10T08:00:00', null],
    // Completed trips (for analytics)
    [vId('KA-01-AB-1001'), dId('Rajesh Kumar'),  'Bangalore Depot',   'Chennai Hub',           600,  360, 358,  18000, 'Completed',  15200,  15558,  '2025-07-05T07:30:00', '2025-07-05T13:45:00'],
    [vId('KA-01-AB-1002'), dId('Mohan Das'),     'Mumbai Port',       'Ahmedabad Warehouse',   12000,540, 545,  65000, 'Completed',  86870,  87415,  '2025-07-03T06:00:00', '2025-07-03T17:30:00'],
    [vId('DL-01-GH-4001'), dId('Pradeep Singh'), 'Delhi Hub',         'Jaipur Depot',          1800, 280, 276,  28000, 'Completed',  56400,  56676,  '2025-06-28T09:00:00', '2025-06-28T15:00:00'],
    [vId('KA-01-KL-6001'), dId('Rajesh Kumar'),  'Bangalore Port',    'Hyderabad Hub',         22000,570, 568,  85000, 'Completed',  202500, 203068, '2025-06-25T05:00:00', '2025-06-25T16:00:00'],
    [vId('KA-01-AB-1001'), dId('Mohan Das'),     'Coimbatore Hub',    'Madurai Depot',         400,  280, 278,  14000, 'Completed',  15558,  15836,  '2025-07-08T08:00:00', '2025-07-08T14:00:00'],
    // Draft trips
    [vId('KA-01-AB-1001'), dId('Rajesh Kumar'),  'Bangalore Depot',   'Coimbatore Hub',        500,  360, null, 19000, 'Draft',      null,   null,   null, null],
    [vId('DL-01-GH-4001'), dId('Pradeep Singh'), 'Delhi Depot',       'Chandigarh Hub',        900,  250, null, 12000, 'Draft',      null,   null,   null, null],
    // Cancelled trip
    [vId('KA-01-KL-6001'), dId('Mohan Das'),     'Chennai Port',      'Bangalore Hub',         18000,360, null, 60000, 'Cancelled',  null,   null,   null, null],
  ];
  const insertTrip = db.prepare(`INSERT OR IGNORE INTO trips (vehicle_id, driver_id, source, destination, cargo_weight_kg, planned_distance_km, actual_distance_km, revenue, status, start_odometer, end_odometer, start_time, end_time) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  trips.forEach(t => insertTrip.run(...t));
  console.log('✓ Trips seeded (9)');

  // Get completed trip IDs
  const completedTrips = db.prepare(`SELECT id FROM trips WHERE status='Completed'`).all();
  const tId = (i) => completedTrips[i]?.id;

  // ─── FUEL LOGS ───
  const fuelLogs = [
    [vId('KA-01-AB-1001'), tId(0), '2025-07-05', 45,  95.5, 15200, 'Depot Staff'],
    [vId('KA-01-AB-1001'), tId(0), '2025-07-01', 40,  94.0, 14850, 'Depot Staff'],
    [vId('KA-01-AB-1001'), tId(4), '2025-07-08', 38,  96.0, 15558, 'Depot Staff'],
    [vId('KA-01-AB-1002'), tId(1), '2025-07-03', 180, 93.0, 86870, 'Highway Pump'],
    [vId('KA-01-AB-1002'), null,   '2025-06-28', 175, 92.5, 86500, 'Highway Pump'],
    [vId('DL-01-GH-4001'), tId(2), '2025-06-28', 60,  96.0, 56400, 'Delhi Depot'],
    [vId('KA-01-KL-6001'), tId(3), '2025-06-25', 320, 91.0, 202500,'Port Fuel Station'],
    [vId('MH-04-CD-2001'), null,   '2025-07-08', 55,  94.5, 55800, 'Pune Depot'],
  ];
  const insertFuel = db.prepare(`INSERT OR IGNORE INTO fuel_logs (vehicle_id, trip_id, date, liters, cost_per_liter, odometer_at_fill, filled_by) VALUES (?,?,?,?,?,?,?)`);
  fuelLogs.forEach(f => insertFuel.run(...f));
  console.log('✓ Fuel logs seeded (8)');

  // ─── EXPENSES ───
  const expenses = [
    [vId('KA-01-AB-1001'), tId(0), 'Toll',   280,  '2025-07-05', 'NH-44 Toll Booth'],
    [vId('KA-01-AB-1002'), tId(1), 'Toll',   650,  '2025-07-03', 'Mumbai-Ahmedabad Expressway'],
    [vId('KA-01-AB-1002'), tId(1), 'Permit', 2000, '2025-07-03', 'Interstate permit Gujarat'],
    [vId('DL-01-GH-4001'), tId(2), 'Toll',   420,  '2025-06-28', 'NH-48 Toll Plaza'],
    [vId('KA-01-KL-6001'), tId(3), 'Toll',   890,  '2025-06-25', 'Multiple toll plazas'],
    [vId('KA-01-KL-6001'), tId(3), 'Fine',   500,  '2025-06-25', 'Overloading spot check (resolved)'],
    [vId('KA-01-AB-1001'), null,   'Repair', 1200, '2025-06-15', 'Minor body repair at depot'],
  ];
  const insertExpense = db.prepare(`INSERT OR IGNORE INTO expenses (vehicle_id, trip_id, category, amount, date, description) VALUES (?,?,?,?,?,?)`);
  expenses.forEach(e => insertExpense.run(...e));
  console.log('✓ Expenses seeded (7)');

  console.log('\n✅ VRITTI database seeded successfully!\n');
  console.log('Demo Credentials (password: password123):');
  console.log('  admin@vritti.com    → Fleet Manager');
  console.log('  dispatch@vritti.com → Dispatcher');
  console.log('  safety@vritti.com   → Safety Officer');
  console.log('  finance@vritti.com  → Financial Analyst');
  console.log('');
}

try {
  seed();
} catch (err) {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
} finally {
  db.close();
}
