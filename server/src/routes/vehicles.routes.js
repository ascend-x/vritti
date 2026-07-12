const express = require('express');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { logAudit } = require('./audit.routes');

const router = express.Router();

// All routes require auth
router.use(authenticate);

// GET /api/vehicles
router.get('/', (req, res) => {
  try {
    const { status, type, region, search } = req.query;
    let sql = "SELECT v.*, (SELECT COUNT(*) FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'Completed') as completed_trips FROM vehicles v WHERE 1=1";
    const params = [];

    if (status) { sql += ' AND v.status = ?'; params.push(status); }
    if (type) { sql += ' AND v.type = ?'; params.push(type); }
    if (region) { sql += ' AND v.region = ?'; params.push(region); }
    if (search) { sql += ' AND (v.reg_number LIKE ? OR v.name_model LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    sql += ' ORDER BY v.created_at DESC';
    const vehicles = db.prepare(sql).all(...params);
    res.json({ data: vehicles, total: vehicles.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/vehicles/available-for-dispatch
router.get('/available-for-dispatch', (req, res) => {
  try {
    const vehicles = db.prepare(`SELECT * FROM vehicles WHERE status = 'Available' ORDER BY reg_number`).all();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/vehicles/:id
router.get('/:id', (req, res) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    if (!vehicle) return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Vehicle not found' });

    const trips = db.prepare('SELECT t.*, d.name as driver_name FROM trips t JOIN drivers d ON t.driver_id = d.id WHERE t.vehicle_id = ? ORDER BY t.created_at DESC').all(req.params.id);
    const maintenance = db.prepare('SELECT * FROM maintenance_logs WHERE vehicle_id = ? ORDER BY created_at DESC').all(req.params.id);
    const fuel = db.prepare('SELECT * FROM fuel_logs WHERE vehicle_id = ? ORDER BY date DESC').all(req.params.id);
    const costs = db.prepare('SELECT * FROM v_vehicle_costs WHERE vehicle_id = ?').get(req.params.id);

    res.json({ ...vehicle, trips, maintenance, fuel, costs });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST /api/vehicles
router.post('/', authorize('fleet_manager'), (req, res) => {
  try {
    const { reg_number, name_model, type, max_load_kg, odometer_km, acquisition_cost, region, notes, document_url } = req.body;
    if (!reg_number || !name_model || !type || !max_load_kg) {
      return res.status(400).json({ error: true, message: 'Missing required fields' });
    }

    const exists = db.prepare('SELECT id FROM vehicles WHERE reg_number = ?').get(reg_number.toUpperCase());
    if (exists) return res.status(409).json({ error: true, code: 'DUPLICATE_REG', message: `Registration number ${reg_number} already exists` });

    const result = db.prepare(`
      INSERT INTO vehicles (reg_number, name_model, type, max_load_kg, odometer_km, acquisition_cost, region, notes, document_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(reg_number.toUpperCase(), name_model, type, max_load_kg, odometer_km || 0, acquisition_cost || 0, region || null, notes || null, document_url || null);

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
    logAudit(req.user?.id, req.user?.name, 'Added Vehicle', 'vehicle', vehicle.id, `${reg_number} - ${name_model}`);
    res.status(201).json(vehicle);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: true, code: 'DUPLICATE_REG', message: 'Registration number already exists' });
    }
    res.status(500).json({ error: true, message: err.message });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', authorize('fleet_manager'), (req, res) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    if (!vehicle) return res.status(404).json({ error: true, message: 'Vehicle not found' });
    if (['On Trip', 'In Shop'].includes(vehicle.status) && req.body.status) {
      return res.status(409).json({ error: true, message: 'Cannot manually change status while vehicle is On Trip or In Shop' });
    }

    const { name_model, type, max_load_kg, odometer_km, acquisition_cost, region, notes, document_url } = req.body;
    db.prepare(`
      UPDATE vehicles SET name_model=COALESCE(?,name_model), type=COALESCE(?,type),
      max_load_kg=COALESCE(?,max_load_kg), odometer_km=COALESCE(?,odometer_km),
      acquisition_cost=COALESCE(?,acquisition_cost), region=COALESCE(?,region),
      notes=COALESCE(?,notes), document_url=COALESCE(?,document_url), updated_at=datetime('now') WHERE id=?
    `).run(name_model, type, max_load_kg, odometer_km, acquisition_cost, region, notes, document_url, req.params.id);

    logAudit(req.user?.id, req.user?.name, 'Updated Vehicle', 'vehicle', parseInt(req.params.id), vehicle.reg_number);
    res.json(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// PATCH /api/vehicles/:id/retire
router.patch('/:id/retire', authorize('fleet_manager'), (req, res) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    if (!vehicle) return res.status(404).json({ error: true, message: 'Vehicle not found' });
    if (vehicle.status === 'On Trip') return res.status(409).json({ error: true, message: 'Cannot retire a vehicle that is currently On Trip' });

    db.prepare(`UPDATE vehicles SET status='Retired', updated_at=datetime('now') WHERE id=?`).run(req.params.id);
    logAudit(req.user?.id, req.user?.name, 'Retired Vehicle', 'vehicle', parseInt(req.params.id), vehicle.reg_number);
    res.json(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
