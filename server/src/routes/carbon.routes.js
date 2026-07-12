const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

// CO₂ emission factor: ~2.68 kg CO₂ per liter of diesel
const CO2_PER_LITER = 2.68;

// GET /api/carbon - Carbon footprint summary
router.get('/', (req, res) => {
  try {
    const trips = db.prepare(`
      SELECT 
        t.id, t.source, t.destination, t.actual_distance_km, t.status,
        t.created_at, d.name as driver_name, v.reg_number, v.type,
        COALESCE(SUM(fl.liters), 0) as fuel_liters
      FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN fuel_logs fl ON fl.trip_id = t.id
      WHERE t.status = 'Completed'
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `).all();

    // Calculate CO₂ for each trip
    const tripsWithCarbon = trips.map(t => {
      const co2Kg = t.fuel_liters > 0 
        ? Math.round(t.fuel_liters * CO2_PER_LITER * 100) / 100
        : Math.round((t.actual_distance_km || 0) * 0.21 * 100) / 100; // Fallback: avg 0.21 kg/km
      return { ...t, co2_kg: co2Kg };
    });

    const totalCO2 = tripsWithCarbon.reduce((s, t) => s + t.co2_kg, 0);
    const totalKm = tripsWithCarbon.reduce((s, t) => s + (t.actual_distance_km || 0), 0);
    const totalFuel = tripsWithCarbon.reduce((s, t) => s + t.fuel_liters, 0);
    const treesNeeded = Math.round(totalCO2 / 21.77); // avg tree absorbs ~21.77 kg/year

    res.json({
      summary: {
        total_co2_kg: Math.round(totalCO2 * 100) / 100,
        total_distance_km: Math.round(totalKm),
        total_fuel_liters: Math.round(totalFuel * 100) / 100,
        total_trips: tripsWithCarbon.length,
        trees_needed: treesNeeded,
        avg_co2_per_km: totalKm > 0 ? Math.round((totalCO2 / totalKm) * 100) / 100 : 0,
      },
      trips: tripsWithCarbon.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
