const express = require('express');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateAndDispatch, completeTrip, cancelTrip } = require('../services/trips.service');
const { logAudit } = require('./audit.routes');

const router = express.Router();
router.use(authenticate);

// GET /api/trips
/**
 * @openapi
 * /trips:
 *   get:
 *     summary: Retrieve a list of trips
 *     description: Retrieve all trips with optional filtering by status, vehicle, driver, or search string.
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by trip status (e.g., Draft, Dispatched, Completed)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by route, vehicle, or driver name
 *     responses:
 *       200:
 *         description: A list of trips.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 */
router.get('/', (req, res) => {
  try {
    const { status, vehicle_id, driver_id, search } = req.query;
    let sql = `
      SELECT t.*, v.reg_number as vehicle_reg, v.name_model as vehicle_name,
             d.name as driver_name, d.license_number as driver_license, d.contact as driver_contact
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    if (vehicle_id) { sql += ' AND t.vehicle_id = ?'; params.push(vehicle_id); }
    if (driver_id) { sql += ' AND t.driver_id = ?'; params.push(driver_id); }
    if (search) { sql += ' AND (v.reg_number LIKE ? OR d.name LIKE ? OR t.source LIKE ? OR t.destination LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }

    sql += ' ORDER BY t.created_at DESC';
    const trips = db.prepare(sql).all(...params);
    res.json({ data: trips, total: trips.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/trips/:id
/**
 * @openapi
 * /trips/{id}:
 *   get:
 *     summary: Get a trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trip details
 *       404:
 *         description: Trip not found
 */
router.get('/:id', (req, res) => {
  try {
    const trip = db.prepare(`
      SELECT t.*, v.reg_number as vehicle_reg, v.name_model as vehicle_name, v.max_load_kg,
             d.name as driver_name, d.license_number as driver_license, d.contact as driver_contact
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!trip) return res.status(404).json({ error: true, message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST /api/trips
/**
 * @openapi
 * /trips:
 *   post:
 *     summary: Create a new draft trip
 *     tags: [Trips]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *               - driver_id
 *               - source
 *               - destination
 *               - cargo_weight_kg
 *             properties:
 *               vehicle_id:
 *                 type: integer
 *               driver_id:
 *                 type: integer
 *               source:
 *                 type: string
 *               destination:
 *                 type: string
 *               cargo_weight_kg:
 *                 type: number
 *     responses:
 *       201:
 *         description: Trip created successfully
 */
router.post('/', authorize('fleet_manager', 'dispatcher'), (req, res) => {
  try {
    const { vehicle_id, driver_id, source, destination, cargo_weight_kg, planned_distance_km, revenue, notes } = req.body;
    if (!vehicle_id || !driver_id || !source || !destination || cargo_weight_kg === undefined) {
      return res.status(400).json({ error: true, message: 'Missing required fields' });
    }

    const result = db.prepare(`
      INSERT INTO trips (vehicle_id, driver_id, source, destination, cargo_weight_kg, planned_distance_km, revenue, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(vehicle_id, driver_id, source, destination, cargo_weight_kg, planned_distance_km || null, revenue || 0, notes || null);

    const trip = db.prepare(`
      SELECT t.*, v.reg_number as vehicle_reg, d.name as driver_name, d.contact as driver_contact
      FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    logAudit(req.user?.id, req.user?.name, 'Created Trip', 'trip', trip.id, `${source} → ${destination}`);
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// PUT /api/trips/:id (edit Draft only)
router.put('/:id', authorize('fleet_manager', 'dispatcher'), (req, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
    if (!trip) return res.status(404).json({ error: true, message: 'Trip not found' });
    if (trip.status !== 'Draft') return res.status(409).json({ error: true, code: 'TRIP_NOT_DRAFT', message: 'Only Draft trips can be edited' });

    const { source, destination, cargo_weight_kg, planned_distance_km, revenue, notes, vehicle_id, driver_id } = req.body;
    db.prepare(`
      UPDATE trips SET source=COALESCE(?,source), destination=COALESCE(?,destination),
      cargo_weight_kg=COALESCE(?,cargo_weight_kg), planned_distance_km=COALESCE(?,planned_distance_km),
      revenue=COALESCE(?,revenue), notes=COALESCE(?,notes),
      vehicle_id=COALESCE(?,vehicle_id), driver_id=COALESCE(?,driver_id),
      updated_at=datetime('now') WHERE id=?
    `).run(source, destination, cargo_weight_kg, planned_distance_km, revenue, notes, vehicle_id, driver_id, req.params.id);

    res.json(db.prepare('SELECT t.*, v.reg_number as vehicle_reg, d.name as driver_name, d.contact as driver_contact FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id WHERE t.id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST /api/trips/:id/dispatch
router.post('/:id/dispatch', authorize('fleet_manager', 'dispatcher'), (req, res) => {
  try {
    const result = validateAndDispatch(req.params.id);
    if (req.app.get('io')) {
      req.app.get('io').emit('trip_update', { message: `Trip #${req.params.id} dispatched!`, trip: result });
    }
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
});

// POST /api/trips/:id/complete
router.post('/:id/complete', authorize('fleet_manager', 'dispatcher'), (req, res) => {
  try {
    const { end_odometer, actual_distance_km, fuel_liters, cost_per_liter } = req.body;
    if (!end_odometer || !actual_distance_km) {
      return res.status(400).json({ error: true, message: 'end_odometer and actual_distance_km are required' });
    }
    const trip = completeTrip(req.params.id, { end_odometer, actual_distance_km, fuel_liters, cost_per_liter });
    res.json(trip);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
});

// POST /api/trips/:id/cancel
router.post('/:id/cancel', authorize('fleet_manager', 'dispatcher'), (req, res) => {
  try {
    const trip = cancelTrip(req.params.id);
    res.json(trip);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
});

module.exports = router;
