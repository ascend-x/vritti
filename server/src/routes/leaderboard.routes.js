const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

// GET /api/leaderboard - Driver ranking
router.get('/', (req, res) => {
  try {
    const drivers = db.prepare(`
      SELECT 
        d.id, d.name, d.safety_score, d.status,
        COUNT(t.id) FILTER (WHERE t.status = 'Completed') AS completed_trips,
        COUNT(t.id) FILTER (WHERE t.status = 'Completed' AND t.end_time <= datetime(t.start_time, '+24 hours')) AS on_time_trips,
        COALESCE(SUM(t.actual_distance_km) FILTER (WHERE t.status = 'Completed'), 0) AS total_km,
        COALESCE(ROUND(AVG(fe.km_per_liter), 2), 0) AS avg_fuel_efficiency
      FROM drivers d
      LEFT JOIN trips t ON t.driver_id = d.id
      LEFT JOIN (
        SELECT t2.driver_id, 
               CASE WHEN SUM(fl.liters) > 0 THEN ROUND(SUM(t2.actual_distance_km) / SUM(fl.liters), 2) ELSE 0 END AS km_per_liter
        FROM trips t2
        JOIN fuel_logs fl ON fl.trip_id = t2.id
        WHERE t2.status = 'Completed'
        GROUP BY t2.driver_id
      ) fe ON fe.driver_id = d.id
      WHERE d.status != 'Suspended'
      GROUP BY d.id
      ORDER BY d.safety_score DESC, completed_trips DESC
    `).all();

    // Calculate composite score for ranking
    const ranked = drivers.map((d, i) => ({
      ...d,
      rank: i + 1,
      on_time_pct: d.completed_trips > 0 ? Math.round((d.on_time_trips / d.completed_trips) * 100) : 0,
      composite_score: Math.round(d.safety_score * 0.5 + Math.min(d.completed_trips * 5, 30) + Math.min(d.avg_fuel_efficiency * 2, 20)),
    }));

    // Re-sort by composite score
    ranked.sort((a, b) => b.composite_score - a.composite_score);
    ranked.forEach((d, i) => d.rank = i + 1);

    res.json({ data: ranked });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
