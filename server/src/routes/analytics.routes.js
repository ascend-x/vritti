const express = require('express');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

// GET /api/analytics/vehicle-roi
router.get('/vehicle-roi', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM v_vehicle_roi ORDER BY roi_pct DESC').all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/analytics/fuel-efficiency
router.get('/fuel-efficiency', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM v_fuel_efficiency ORDER BY km_per_liter DESC').all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/analytics/cost-breakdown
router.get('/cost-breakdown', (req, res) => {
  try {
    const { from, to } = req.query;
    const data = db.prepare('SELECT * FROM v_vehicle_costs ORDER BY total_op_cost DESC').all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/analytics/fleet-utilization
router.get('/fleet-utilization', (req, res) => {
  try {
    const { period = 'monthly', year } = req.query;
    const y = year || new Date().getFullYear();
    const data = db.prepare(`
      SELECT
        strftime('%Y-%m', t.created_at) as period,
        COUNT(CASE WHEN t.status='Dispatched' OR t.status='Completed' THEN 1 END) as active_trips,
        COUNT(DISTINCT t.vehicle_id) as vehicles_used
      FROM trips t
      WHERE strftime('%Y', t.created_at) = ?
      GROUP BY period ORDER BY period
    `).all(String(y));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/analytics/export/csv
router.get('/export/csv', (req, res) => {
  try {
    const { type = 'roi' } = req.query;
    let data = [];
    let filename = 'vritti_export';

    if (type === 'roi') {
      data = db.prepare('SELECT * FROM v_vehicle_roi').all();
      filename = 'vritti_vehicle_roi';
    } else if (type === 'fuel') {
      data = db.prepare('SELECT fl.*, v.reg_number FROM fuel_logs fl JOIN vehicles v ON fl.vehicle_id = v.id ORDER BY fl.date DESC').all();
      filename = 'vritti_fuel_logs';
    } else if (type === 'expenses') {
      data = db.prepare('SELECT e.*, v.reg_number FROM expenses e LEFT JOIN vehicles v ON e.vehicle_id = v.id ORDER BY e.date DESC').all();
      filename = 'vritti_expenses';
    } else if (type === 'trips') {
      data = db.prepare(`SELECT t.*, v.reg_number as vehicle_reg, d.name as driver_name FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id ORDER BY t.created_at DESC`).all();
      filename = 'vritti_trips';
    } else if (type === 'efficiency') {
      data = db.prepare('SELECT * FROM v_fuel_efficiency').all();
      filename = 'vritti_fuel_efficiency';
    }

    if (data.length === 0) {
      return res.status(200).json([]);
    }

    // Generate CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v ?? ''}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/analytics/top-vehicles
router.get('/top-vehicles', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT v.id, v.reg_number, v.name_model, v.type,
             COALESCE(SUM(fl.total_cost), 0) + COALESCE(SUM(ml.cost), 0) as total_op_cost,
             COALESCE(COUNT(DISTINCT t.id), 0) as trip_count
      FROM vehicles v
      LEFT JOIN fuel_logs fl ON fl.vehicle_id = v.id
      LEFT JOIN maintenance_logs ml ON ml.vehicle_id = v.id
      LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'Completed'
      GROUP BY v.id
      ORDER BY total_op_cost DESC LIMIT 5
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
