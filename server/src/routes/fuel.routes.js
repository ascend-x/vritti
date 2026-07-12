const express = require('express');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

// ─── FUEL LOGS ───

// GET /api/fuel-logs
router.get('/', (req, res) => {
  try {
    const { vehicle_id, trip_id, from, to } = req.query;
    let sql = `SELECT fl.*, v.reg_number as vehicle_reg, v.name_model as vehicle_name FROM fuel_logs fl JOIN vehicles v ON fl.vehicle_id = v.id WHERE 1=1`;
    const params = [];

    if (vehicle_id) { sql += ' AND fl.vehicle_id = ?'; params.push(vehicle_id); }
    if (trip_id) { sql += ' AND fl.trip_id = ?'; params.push(trip_id); }
    if (from) { sql += ' AND fl.date >= ?'; params.push(from); }
    if (to) { sql += ' AND fl.date <= ?'; params.push(to); }
    sql += ' ORDER BY fl.date DESC, fl.created_at DESC';

    const logs = db.prepare(sql).all(...params);
    const total_cost = logs.reduce((s, l) => s + (l.total_cost || 0), 0);
    res.json({ data: logs, total: logs.length, total_cost: Math.round(total_cost * 100) / 100 });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST /api/fuel-logs
router.post('/', authorize('fleet_manager', 'dispatcher', 'financial_analyst'), (req, res) => {
  try {
    const { vehicle_id, trip_id, date, liters, cost_per_liter, odometer_at_fill, filled_by, notes } = req.body;
    if (!vehicle_id || !date || !liters || !cost_per_liter) {
      return res.status(400).json({ error: true, message: 'vehicle_id, date, liters, cost_per_liter are required' });
    }

    const result = db.prepare(`
      INSERT INTO fuel_logs (vehicle_id, trip_id, date, liters, cost_per_liter, odometer_at_fill, filled_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(vehicle_id, trip_id || null, date, liters, cost_per_liter, odometer_at_fill || null, filled_by || null, notes || null);

    res.status(201).json(db.prepare('SELECT fl.*, v.reg_number as vehicle_reg FROM fuel_logs fl JOIN vehicles v ON fl.vehicle_id = v.id WHERE fl.id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// DELETE /api/fuel-logs/:id
router.delete('/:id', authorize('fleet_manager', 'financial_analyst'), (req, res) => {
  try {
    db.prepare('DELETE FROM fuel_logs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Fuel log deleted' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ─── EXPENSES ───

// GET /api/expenses
router.get('/expenses', (req, res) => {
  try {
    const { vehicle_id, trip_id, category } = req.query;
    let sql = `SELECT e.*, v.reg_number as vehicle_reg FROM expenses e LEFT JOIN vehicles v ON e.vehicle_id = v.id WHERE 1=1`;
    const params = [];

    if (vehicle_id) { sql += ' AND e.vehicle_id = ?'; params.push(vehicle_id); }
    if (trip_id) { sql += ' AND e.trip_id = ?'; params.push(trip_id); }
    if (category) { sql += ' AND e.category = ?'; params.push(category); }
    sql += ' ORDER BY e.date DESC';

    const expenses = db.prepare(sql).all(...params);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ data: expenses, total: expenses.length, total_amount: Math.round(total * 100) / 100 });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST /api/expenses
router.post('/expenses', authorize('fleet_manager', 'dispatcher', 'financial_analyst'), (req, res) => {
  try {
    const { vehicle_id, trip_id, category, amount, date, description } = req.body;
    if (!category || !amount || !date) {
      return res.status(400).json({ error: true, message: 'category, amount, date are required' });
    }

    const result = db.prepare(`
      INSERT INTO expenses (vehicle_id, trip_id, category, amount, date, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(vehicle_id || null, trip_id || null, category, amount, date, description || null);

    res.status(201).json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// DELETE /api/expenses/:id (using /expenses/delete/:id to avoid conflict with fuel-logs)
router.delete('/expenses/:id', authorize('fleet_manager', 'financial_analyst'), (req, res) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
