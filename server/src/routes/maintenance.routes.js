const express = require('express');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { openMaintenance, closeMaintenance } = require('../services/maintenance.service');
const { logAudit } = require('./audit.routes');

const router = express.Router();
router.use(authenticate);

// GET /api/maintenance
router.get('/', (req, res) => {
  try {
    const { vehicle_id, status } = req.query;
    let sql = `
      SELECT m.*, v.reg_number as vehicle_reg, v.name_model as vehicle_name
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    if (vehicle_id) { sql += ' AND m.vehicle_id = ?'; params.push(vehicle_id); }
    if (status) { sql += ' AND m.status = ?'; params.push(status); }
    sql += ' ORDER BY m.created_at DESC';

    res.json({ data: db.prepare(sql).all(...params) });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/maintenance/:id
router.get('/:id', (req, res) => {
  try {
    const maint = db.prepare('SELECT m.*, v.reg_number as vehicle_reg FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id WHERE m.id = ?').get(req.params.id);
    if (!maint) return res.status(404).json({ error: true, message: 'Maintenance record not found' });
    res.json(maint);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST /api/maintenance
router.post('/', authorize('fleet_manager'), (req, res) => {
  try {
    const { vehicle_id, type, description, start_date, cost, technician, notes } = req.body;
    if (!vehicle_id || !type || !start_date) {
      return res.status(400).json({ error: true, message: 'vehicle_id, type, and start_date are required' });
    }
    const record = openMaintenance({ vehicle_id, type, description, start_date, cost, technician, notes });
    logAudit(req.user?.id, req.user?.name, 'Opened Maintenance', 'maintenance', record.id, `${type} for Vehicle #${vehicle_id}`);
    res.status(201).json(record);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
});

// PUT /api/maintenance/:id (update Active record fields)
router.put('/:id', authorize('fleet_manager'), (req, res) => {
  try {
    const maint = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(req.params.id);
    if (!maint) return res.status(404).json({ error: true, message: 'Not found' });
    if (maint.status === 'Closed') return res.status(409).json({ error: true, message: 'Cannot edit a closed maintenance record' });

    const { description, cost, technician, notes } = req.body;
    db.prepare(`UPDATE maintenance_logs SET description=COALESCE(?,description), cost=COALESCE(?,cost),
      technician=COALESCE(?,technician), notes=COALESCE(?,notes), updated_at=datetime('now') WHERE id=?`)
      .run(description, cost, technician, notes, req.params.id);
    res.json(db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// PUT /api/maintenance/:id/close
router.put('/:id/close', authorize('fleet_manager'), (req, res) => {
  try {
    const { end_date, cost } = req.body;
    const record = closeMaintenance(req.params.id, { end_date, cost });
    logAudit(req.user?.id, req.user?.name, 'Closed Maintenance', 'maintenance', record.id);
    res.json(record);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
});

module.exports = router;
