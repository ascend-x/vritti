const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard/kpis
router.get('/kpis', (req, res) => {
  try {
    const { type, status, region } = req.query;
    
    let vWhere = [];
    let vParams = [];
    
    if (type) { vWhere.push("type = ?"); vParams.push(type); }
    if (status) { vWhere.push("status = ?"); vParams.push(status); }
    if (region) { vWhere.push("region = ?"); vParams.push(region); }
    
    const vWhereClause = vWhere.length > 0 ? " AND " + vWhere.join(" AND ") : "";

    const getVCount = (statusCheck) => {
      let q = `SELECT COUNT(*) as count FROM vehicles WHERE ${statusCheck} ${vWhereClause}`;
      return db.prepare(q).get(...vParams).count;
    };

    const active_vehicles = getVCount("status != 'Retired'");
    const available_vehicles = getVCount("status = 'Available'");
    const in_maintenance = getVCount("status = 'In Shop'");
    const on_trip_vehicles = getVCount("status = 'On Trip'");
    const retired_vehicles = getVCount("status = 'Retired'");
    
    // For trips, we join vehicles to apply the vehicle filters
    let tWhereClause = vWhere.length > 0 ? " AND " + vWhere.map(w => `v.${w}`).join(" AND ") : "";
    const getTCount = (statusCheck) => {
      let q = `SELECT COUNT(*) as count FROM trips t JOIN vehicles v ON t.vehicle_id = v.id WHERE t.${statusCheck} ${tWhereClause}`;
      return db.prepare(q).get(...vParams).count;
    };

    const active_trips = getTCount("status = 'Dispatched'");
    const pending_trips = getTCount("status = 'Draft'");

    // Driver KPIs remain global
    const drivers_on_duty = db.prepare(`SELECT COUNT(*) as count FROM drivers WHERE status = 'On Trip'`).get().count;
    const drivers_available = db.prepare(`SELECT COUNT(*) as count FROM drivers WHERE status = 'Available'`).get().count;
    const drivers_suspended = db.prepare(`SELECT COUNT(*) as count FROM drivers WHERE status = 'Suspended'`).get().count;
    const expiring_licenses = db.prepare(`SELECT COUNT(*) as count FROM drivers WHERE license_expiry < date('now', '+30 days') AND license_expiry >= date('now')`).get().count;

    const fleet_utilization_pct = active_vehicles > 0 ? Math.round((on_trip_vehicles * 100.0) / active_vehicles * 10) / 10 : 0;

    res.json({
      active_vehicles, available_vehicles, in_maintenance, on_trip_vehicles, retired_vehicles,
      active_trips, pending_trips,
      drivers_on_duty, drivers_available, drivers_suspended, expiring_licenses,
      fleet_utilization_pct
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/dashboard/recent-trips
router.get('/recent-trips', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { type, status, region } = req.query;
    
    let vWhere = [];
    let vParams = [];
    if (type) { vWhere.push("v.type = ?"); vParams.push(type); }
    if (status) { vWhere.push("v.status = ?"); vParams.push(status); }
    if (region) { vWhere.push("v.region = ?"); vParams.push(region); }
    
    const vWhereClause = vWhere.length > 0 ? " AND " + vWhere.join(" AND ") : "";

    const trips = db.prepare(`
      SELECT t.id, t.source, t.destination, t.status, t.cargo_weight_kg, t.revenue,
             t.created_at, t.start_time, t.end_time,
             v.reg_number as vehicle_reg, v.name_model as vehicle_name,
             d.name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE 1=1 ${vWhereClause}
      ORDER BY t.created_at DESC LIMIT ?
    `).all(...vParams, limit);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/dashboard/vehicle-status-distribution
router.get('/vehicle-status-distribution', (req, res) => {
  try {
    const { type, status, region } = req.query;
    let vWhere = [];
    let vParams = [];
    if (type) { vWhere.push("type = ?"); vParams.push(type); }
    if (status) { vWhere.push("status = ?"); vParams.push(status); }
    if (region) { vWhere.push("region = ?"); vParams.push(region); }
    
    const vWhereClause = vWhere.length > 0 ? " WHERE " + vWhere.join(" AND ") : "";

    const data = db.prepare(`
      SELECT status, COUNT(*) as count FROM vehicles ${vWhereClause} GROUP BY status ORDER BY status
    `).all(...vParams);
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
