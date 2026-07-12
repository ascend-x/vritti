const db = require('../db/database');

function openMaintenance(data) {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(data.vehicle_id);
  if (!vehicle) throw { code: 'NOT_FOUND', message: 'Vehicle not found', status: 404 };
  if (vehicle.status === 'Retired') throw { code: 'VEHICLE_RETIRED', message: 'Cannot create maintenance for a retired vehicle', status: 409 };
  if (vehicle.status === 'On Trip') throw { code: 'VEHICLE_ON_TRIP', message: 'Cannot create maintenance for a vehicle currently on trip', status: 409 };

  // Check for existing active maintenance
  const existing = db.prepare(`SELECT id FROM maintenance_logs WHERE vehicle_id = ? AND status = 'Active'`).get(data.vehicle_id);
  if (existing) throw { code: 'MAINTENANCE_ACTIVE', message: 'Vehicle already has an active maintenance record', status: 409 };

  const create = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO maintenance_logs (vehicle_id, type, description, start_date, cost, technician, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.vehicle_id, data.type, data.description || null, data.start_date, data.cost || 0, data.technician || null, data.notes || null);
    db.prepare(`UPDATE vehicles SET status='In Shop', updated_at=datetime('now') WHERE id=?`).run(data.vehicle_id);
    return db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(result.lastInsertRowid);
  });

  return create();
}

function closeMaintenance(maintId, { end_date, cost }) {
  const maint = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(maintId);
  if (!maint) throw { code: 'NOT_FOUND', message: 'Maintenance record not found', status: 404 };
  if (maint.status === 'Closed') throw { code: 'ALREADY_CLOSED', message: 'Maintenance record is already closed', status: 409 };

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(maint.vehicle_id);

  const close = db.transaction(() => {
    db.prepare(`UPDATE maintenance_logs SET status='Closed', end_date=?, cost=?, updated_at=datetime('now') WHERE id=?`)
      .run(end_date || new Date().toISOString().slice(0, 10), cost ?? maint.cost, maintId);
    // Restore vehicle to Available unless it's Retired
    if (vehicle && vehicle.status !== 'Retired') {
      db.prepare(`UPDATE vehicles SET status='Available', updated_at=datetime('now') WHERE id=?`).run(maint.vehicle_id);
    }
  });

  close();
  return db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(maintId);
}

module.exports = { openMaintenance, closeMaintenance };
