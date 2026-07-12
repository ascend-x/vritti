const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

// GET /api/audit - Get activity feed
router.get('/', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = db.prepare(`
      SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?
    `).all(limit);
    res.json({ data: logs, total: logs.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;

// Helper to log an action (used by other routes)
module.exports.logAudit = (userId, userName, action, entityType, entityId, details) => {
  try {
    db.prepare(`
      INSERT INTO audit_log (user_id, user_name, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, userName, action, entityType, entityId, details || null);
  } catch (err) {
    console.error('[Audit] Failed to log:', err.message);
  }
};
