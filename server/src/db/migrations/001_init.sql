-- VRITTI — SQLite Schema (001_init.sql)
-- Smart Transport Operations Platform
-- WAL mode + foreign keys enabled at app startup

-- ─────────────────────────────────────────────────────────
-- USERS & AUTH
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL CHECK(role IN ('fleet_manager','dispatcher','safety_officer','financial_analyst')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────
-- VEHICLES
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reg_number       TEXT    NOT NULL UNIQUE,
  name_model       TEXT    NOT NULL,
  type             TEXT    NOT NULL CHECK(type IN ('Van','Truck','Bike','Bus','Pickup','Other')),
  max_load_kg      REAL    NOT NULL CHECK(max_load_kg > 0),
  odometer_km      REAL    NOT NULL DEFAULT 0,
  acquisition_cost REAL    NOT NULL DEFAULT 0,
  status           TEXT    NOT NULL DEFAULT 'Available'
                           CHECK(status IN ('Available','On Trip','In Shop','Retired')),
  region           TEXT,
  notes            TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────
-- DRIVERS
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  license_number   TEXT    NOT NULL UNIQUE,
  license_category TEXT    NOT NULL CHECK(license_category IN ('LMV','HMV','HGMV','MCWG','Other')),
  license_expiry   TEXT    NOT NULL,
  contact          TEXT,
  safety_score     INTEGER NOT NULL DEFAULT 100 CHECK(safety_score BETWEEN 0 AND 100),
  status           TEXT    NOT NULL DEFAULT 'Available'
                           CHECK(status IN ('Available','On Trip','Off Duty','Suspended')),
  notes            TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────
-- TRIPS
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id          INTEGER NOT NULL REFERENCES vehicles(id),
  driver_id           INTEGER NOT NULL REFERENCES drivers(id),
  source              TEXT    NOT NULL,
  destination         TEXT    NOT NULL,
  cargo_weight_kg     REAL    NOT NULL CHECK(cargo_weight_kg >= 0),
  planned_distance_km REAL,
  actual_distance_km  REAL,
  revenue             REAL    NOT NULL DEFAULT 0,
  status              TEXT    NOT NULL DEFAULT 'Draft'
                              CHECK(status IN ('Draft','Dispatched','Completed','Cancelled')),
  start_odometer      REAL,
  end_odometer        REAL,
  start_time          TEXT,
  end_time            TEXT,
  notes               TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver  ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status  ON trips(status);

-- ─────────────────────────────────────────────────────────
-- MAINTENANCE LOGS
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id  INTEGER NOT NULL REFERENCES vehicles(id),
  type        TEXT    NOT NULL CHECK(type IN ('Oil Change','Tyre Replace','Engine Repair','Brake Service','Body Work','Other')),
  description TEXT,
  start_date  TEXT    NOT NULL,
  end_date    TEXT,
  cost        REAL    NOT NULL DEFAULT 0,
  status      TEXT    NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Closed')),
  technician  TEXT,
  notes       TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_maint_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maint_status  ON maintenance_logs(status);

-- ─────────────────────────────────────────────────────────
-- FUEL LOGS
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fuel_logs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id       INTEGER NOT NULL REFERENCES vehicles(id),
  trip_id          INTEGER REFERENCES trips(id),
  date             TEXT    NOT NULL,
  liters           REAL    NOT NULL CHECK(liters > 0),
  cost_per_liter   REAL    NOT NULL CHECK(cost_per_liter > 0),
  total_cost       REAL    GENERATED ALWAYS AS (ROUND(liters * cost_per_liter, 2)) STORED,
  odometer_at_fill REAL,
  filled_by        TEXT,
  notes            TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_logs(vehicle_id);

-- ─────────────────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id  INTEGER REFERENCES vehicles(id),
  trip_id     INTEGER REFERENCES trips(id),
  category    TEXT    NOT NULL CHECK(category IN ('Toll','Repair','Fine','Permit','Other')),
  amount      REAL    NOT NULL CHECK(amount >= 0),
  date        TEXT    NOT NULL,
  description TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────
-- ANALYTICS VIEWS
-- ─────────────────────────────────────────────────────────

-- Per-vehicle cost summary
CREATE VIEW IF NOT EXISTS v_vehicle_costs AS
SELECT
  v.id                AS vehicle_id,
  v.reg_number,
  v.name_model,
  v.acquisition_cost,
  COALESCE(SUM(DISTINCT fl.total_cost), 0)   AS total_fuel_cost,
  COALESCE(SUM(DISTINCT ml.cost), 0)          AS total_maint_cost,
  COALESCE(SUM(DISTINCT fl.total_cost), 0) + COALESCE(SUM(DISTINCT ml.cost), 0) AS total_op_cost
FROM vehicles v
LEFT JOIN fuel_logs fl ON fl.vehicle_id = v.id
LEFT JOIN maintenance_logs ml ON ml.vehicle_id = v.id
GROUP BY v.id;

-- Per-vehicle revenue + distance
CREATE VIEW IF NOT EXISTS v_vehicle_revenue AS
SELECT
  vehicle_id,
  COALESCE(SUM(revenue), 0)              AS total_revenue,
  COALESCE(SUM(actual_distance_km), 0)   AS total_distance_km,
  COUNT(*) FILTER (WHERE status='Completed') AS completed_trips
FROM trips
GROUP BY vehicle_id;

-- ROI view
CREATE VIEW IF NOT EXISTS v_vehicle_roi AS
SELECT
  vc.vehicle_id,
  vc.reg_number,
  vc.name_model,
  vc.acquisition_cost,
  COALESCE(vr.total_revenue, 0)     AS total_revenue,
  vc.total_op_cost,
  COALESCE(vr.total_distance_km, 0) AS total_distance_km,
  COALESCE(vr.completed_trips, 0)   AS completed_trips,
  CASE WHEN vc.acquisition_cost > 0
    THEN ROUND(
      (COALESCE(vr.total_revenue,0) - vc.total_op_cost) / vc.acquisition_cost * 100, 2
    )
    ELSE 0
  END AS roi_pct
FROM v_vehicle_costs vc
LEFT JOIN v_vehicle_revenue vr ON vr.vehicle_id = vc.vehicle_id;

-- Fuel efficiency view
CREATE VIEW IF NOT EXISTS v_fuel_efficiency AS
SELECT
  v.id       AS vehicle_id,
  v.reg_number,
  v.name_model,
  v.type,
  COALESCE(SUM(fl.liters), 0)            AS total_liters,
  COALESCE(vr.total_distance_km, 0)      AS total_distance_km,
  CASE WHEN COALESCE(SUM(fl.liters), 0) > 0
    THEN ROUND(COALESCE(vr.total_distance_km,0) / SUM(fl.liters), 2)
    ELSE 0
  END AS km_per_liter
FROM vehicles v
LEFT JOIN fuel_logs fl ON fl.vehicle_id = v.id
LEFT JOIN v_vehicle_revenue vr ON vr.vehicle_id = v.id
GROUP BY v.id;

-- Dashboard KPI view
CREATE VIEW IF NOT EXISTS v_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM vehicles WHERE status != 'Retired')  AS active_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'Available') AS available_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'In Shop')   AS in_maintenance,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'On Trip')   AS on_trip_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'Retired')   AS retired_vehicles,
  (SELECT COUNT(*) FROM trips WHERE status = 'Dispatched')   AS active_trips,
  (SELECT COUNT(*) FROM trips WHERE status = 'Draft')        AS pending_trips,
  (SELECT COUNT(*) FROM drivers WHERE status = 'On Trip')    AS drivers_on_duty,
  (SELECT COUNT(*) FROM drivers WHERE status = 'Available')  AS drivers_available,
  (SELECT COUNT(*) FROM drivers WHERE status = 'Suspended')  AS drivers_suspended,
  (SELECT COUNT(*) FROM drivers
   WHERE license_expiry < date('now', '+30 days')
     AND license_expiry >= date('now'))                      AS expiring_licenses,
  CASE WHEN (SELECT COUNT(*) FROM vehicles WHERE status != 'Retired') > 0
    THEN ROUND(
      (SELECT COUNT(*) FROM vehicles WHERE status = 'On Trip') * 100.0 /
      (SELECT COUNT(*) FROM vehicles WHERE status != 'Retired'), 1
    )
    ELSE 0
  END AS fleet_utilization_pct;

-- ─────────────────────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id),
  user_name   TEXT,
  action      TEXT    NOT NULL,
  entity_type TEXT    NOT NULL,
  entity_id   INTEGER,
  details     TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
