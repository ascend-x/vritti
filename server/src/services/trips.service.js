const db = require('../db/database');

function validateAndDispatch(tripId) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  if (!trip) throw { code: 'NOT_FOUND', message: 'Trip not found', status: 404 };
  if (trip.status !== 'Draft') throw { code: 'TRIP_NOT_DRAFT', message: 'Only Draft trips can be dispatched', status: 409 };

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(trip.vehicle_id);
  if (!vehicle) throw { code: 'NOT_FOUND', message: 'Vehicle not found', status: 404 };
  if (vehicle.status !== 'Available') {
    throw { code: 'VEHICLE_NOT_AVAILABLE', message: `Vehicle ${vehicle.reg_number} is currently ${vehicle.status} and cannot be dispatched`, status: 409 };
  }

  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(trip.driver_id);
  if (!driver) throw { code: 'NOT_FOUND', message: 'Driver not found', status: 404 };
  if (driver.status === 'Suspended') {
    throw { code: 'DRIVER_SUSPENDED', message: `Driver ${driver.name} is suspended`, status: 422 };
  }
  if (driver.status !== 'Available') {
    throw { code: 'DRIVER_NOT_AVAILABLE', message: `Driver ${driver.name} is currently ${driver.status}`, status: 409 };
  }
  if (new Date(driver.license_expiry) < new Date()) {
    throw { code: 'LICENSE_EXPIRED', message: `Driver ${driver.name}'s license expired on ${driver.license_expiry}`, status: 422 };
  }
  if (trip.cargo_weight_kg > vehicle.max_load_kg) {
    throw {
      code: 'OVERWEIGHT',
      message: `Cargo ${trip.cargo_weight_kg}kg exceeds vehicle capacity of ${vehicle.max_load_kg}kg`,
      status: 422
    };
  }

  // All checks passed — atomic transaction
  const dispatch = db.transaction(() => {
    db.prepare(`UPDATE trips SET status='Dispatched', start_time=datetime('now'), start_odometer=?, updated_at=datetime('now') WHERE id=?`)
      .run(vehicle.odometer_km, tripId);
    db.prepare(`UPDATE vehicles SET status='On Trip', updated_at=datetime('now') WHERE id=?`)
      .run(vehicle.id);
    db.prepare(`UPDATE drivers SET status='On Trip', updated_at=datetime('now') WHERE id=?`)
      .run(driver.id);
    return {
      trip: db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId),
      vehicle: db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle.id),
      driver: db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver.id),
    };
  });

  return dispatch();
}

function completeTrip(tripId, { end_odometer, actual_distance_km, fuel_liters, cost_per_liter }) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  if (!trip) throw { code: 'NOT_FOUND', message: 'Trip not found', status: 404 };
  if (trip.status !== 'Dispatched') throw { code: 'INVALID_STATUS', message: 'Only Dispatched trips can be completed', status: 409 };

  const complete = db.transaction(() => {
    db.prepare(`UPDATE trips SET status='Completed', end_time=datetime('now'), end_odometer=?, actual_distance_km=?, updated_at=datetime('now') WHERE id=?`)
      .run(end_odometer, actual_distance_km, tripId);
    db.prepare(`UPDATE vehicles SET status='Available', odometer_km=?, updated_at=datetime('now') WHERE id=?`)
      .run(end_odometer, trip.vehicle_id);
    db.prepare(`UPDATE drivers SET status='Available', updated_at=datetime('now') WHERE id=?`)
      .run(trip.driver_id);

    // Auto-create fuel log if fuel data provided
    if (fuel_liters > 0 && cost_per_liter > 0) {
      db.prepare(`INSERT INTO fuel_logs (vehicle_id, trip_id, date, liters, cost_per_liter, odometer_at_fill) VALUES (?,?,date('now'),?,?,?)`)
        .run(trip.vehicle_id, tripId, fuel_liters, cost_per_liter, end_odometer);
    }
  });

  complete();
  return db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
}

function cancelTrip(tripId) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  if (!trip) throw { code: 'NOT_FOUND', message: 'Trip not found', status: 404 };
  if (!['Draft', 'Dispatched'].includes(trip.status)) {
    throw { code: 'INVALID_STATUS', message: 'Cannot cancel a Completed or already Cancelled trip', status: 409 };
  }

  const cancel = db.transaction(() => {
    db.prepare(`UPDATE trips SET status='Cancelled', updated_at=datetime('now') WHERE id=?`).run(tripId);
    if (trip.status === 'Dispatched') {
      db.prepare(`UPDATE vehicles SET status='Available', updated_at=datetime('now') WHERE id=?`).run(trip.vehicle_id);
      db.prepare(`UPDATE drivers SET status='Available', updated_at=datetime('now') WHERE id=?`).run(trip.driver_id);
    }
  });

  cancel();
  return db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
}

module.exports = { validateAndDispatch, completeTrip, cancelTrip };
