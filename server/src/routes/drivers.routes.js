const express = require('express');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { logAudit } = require('./audit.routes');

const router = express.Router();
router.use(authenticate);

// GET /api/drivers
router.get('/', (req, res) => {
  try {
    const { status, category, search } = req.query;
    let sql = `SELECT *, CASE WHEN license_expiry < date('now') THEN 1 ELSE 0 END as is_license_expired,
      CASE WHEN license_expiry BETWEEN date('now') AND date('now','+30 days') THEN 1 ELSE 0 END as is_expiring_soon
      FROM drivers WHERE 1=1`;
    const params = [];

    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (category) { sql += ' AND license_category = ?'; params.push(category); }
    if (search) { sql += ' AND (name LIKE ? OR license_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    sql += ' ORDER BY created_at DESC';
    const drivers = db.prepare(sql).all(...params);
    res.json({ data: drivers, total: drivers.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/drivers/available-for-dispatch
router.get('/available-for-dispatch', (req, res) => {
  try {
    const drivers = db.prepare(`
      SELECT * FROM drivers
      WHERE status = 'Available'
        AND license_expiry >= date('now')
      ORDER BY name
    `).all();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/drivers/:id
router.get('/:id', (req, res) => {
  try {
    const driver = db.prepare(`SELECT *, CASE WHEN license_expiry < date('now') THEN 1 ELSE 0 END as is_license_expired FROM drivers WHERE id = ?`).get(req.params.id);
    if (!driver) return res.status(404).json({ error: true, message: 'Driver not found' });

    const trips = db.prepare(`SELECT t.*, v.reg_number as vehicle_reg FROM trips t JOIN vehicles v ON t.vehicle_id = v.id WHERE t.driver_id = ? ORDER BY t.created_at DESC`).all(req.params.id);
    res.json({ ...driver, trips });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST /api/drivers
router.post('/', authorize('fleet_manager', 'safety_officer'), (req, res) => {
  try {
    const { name, license_number, license_category, license_expiry, contact, safety_score, notes } = req.body;
    if (!name || !license_number || !license_category || !license_expiry) {
      return res.status(400).json({ error: true, message: 'Missing required fields' });
    }

    const exists = db.prepare('SELECT id FROM drivers WHERE license_number = ?').get(license_number);
    if (exists) return res.status(409).json({ error: true, code: 'DUPLICATE_LICENSE', message: 'License number already exists' });

    const result = db.prepare(`
      INSERT INTO drivers (name, license_number, license_category, license_expiry, contact, safety_score, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, license_number, license_category, license_expiry, contact || null, safety_score ?? 100, notes || null);

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(result.lastInsertRowid);
    logAudit(req.user?.id, req.user?.name, 'Added Driver', 'driver', driver.id, name);
    res.status(201).json(driver);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: true, message: 'License number already exists' });
    }
    res.status(500).json({ error: true, message: err.message });
  }
});

// PUT /api/drivers/:id
router.put('/:id', authorize('fleet_manager', 'safety_officer'), (req, res) => {
  try {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    if (!driver) return res.status(404).json({ error: true, message: 'Driver not found' });

    const { name, license_number, license_category, license_expiry, contact, safety_score, notes } = req.body;
    db.prepare(`
      UPDATE drivers SET name=COALESCE(?,name), license_number=COALESCE(?,license_number),
      license_category=COALESCE(?,license_category), license_expiry=COALESCE(?,license_expiry),
      contact=COALESCE(?,contact), safety_score=COALESCE(?,safety_score), notes=COALESCE(?,notes),
      updated_at=datetime('now') WHERE id=?
    `).run(name, license_number, license_category, license_expiry, contact, safety_score, notes, req.params.id);

    logAudit(req.user?.id, req.user?.name, 'Updated Driver', 'driver', parseInt(req.params.id), name || driver.name);
    res.json(db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// PATCH /api/drivers/:id/suspend
router.patch('/:id/suspend', authorize('fleet_manager', 'safety_officer'), (req, res) => {
  try {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    if (!driver) return res.status(404).json({ error: true, message: 'Driver not found' });
    if (driver.status === 'On Trip') return res.status(409).json({ error: true, message: 'Cannot suspend a driver currently On Trip' });

    db.prepare(`UPDATE drivers SET status='Suspended', updated_at=datetime('now') WHERE id=?`).run(req.params.id);
    logAudit(req.user?.id, req.user?.name, 'Suspended Driver', 'driver', parseInt(req.params.id), driver.name);
    res.json(db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// PATCH /api/drivers/:id/reinstate
router.patch('/:id/reinstate', authorize('fleet_manager', 'safety_officer'), (req, res) => {
  try {
    db.prepare(`UPDATE drivers SET status='Available', updated_at=datetime('now') WHERE id=?`).run(req.params.id);
    logAudit(req.user?.id, req.user?.name, 'Reinstated Driver', 'driver', parseInt(req.params.id));
    res.json(db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
