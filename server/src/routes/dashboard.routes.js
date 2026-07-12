const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard/kpis
router.get('/kpis', (req, res) => {
  try {
    const kpis = db.prepare('SELECT * FROM v_dashboard_kpis').get();
    res.json(kpis);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/dashboard/recent-trips
router.get('/recent-trips', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const trips = db.prepare(`
      SELECT t.id, t.source, t.destination, t.status, t.cargo_weight_kg, t.revenue,
             t.created_at, t.start_time, t.end_time,
             v.reg_number as vehicle_reg, v.name_model as vehicle_name,
             d.name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC LIMIT ?
    `).all(limit);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/dashboard/vehicle-status-distribution
router.get('/vehicle-status-distribution', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT status, COUNT(*) as count FROM vehicles GROUP BY status ORDER BY status
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/dashboard/monthly-revenue
router.get('/monthly-revenue', (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const data = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
             COALESCE(SUM(revenue), 0) as revenue,
             COUNT(*) as trips
      FROM trips
      WHERE status = 'Completed' AND strftime('%Y', created_at) = ?
      GROUP BY month ORDER BY month
    `).all(String(year));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/dashboard/trips-per-day (last 7 days)
router.get('/trips-per-day', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as count
      FROM trips
      WHERE created_at >= date('now', '-7 days')
      GROUP BY day ORDER BY day
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/dashboard/expiring-licenses
router.get('/expiring-licenses', (req, res) => {
  try {
    const drivers = db.prepare(`
      SELECT id, name, license_number, license_expiry, status
      FROM drivers
      WHERE license_expiry BETWEEN date('now') AND date('now', '+30 days')
      ORDER BY license_expiry ASC
    `).all();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
