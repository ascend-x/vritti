const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

// GET /api/settings/users (fleet_manager only)
router.get('/users', authorize('fleet_manager'), (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST /api/settings/users
router.post('/users', authorize('fleet_manager'), (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: true, message: 'All fields required' });
    }
    const validRoles = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: true, message: 'Invalid role' });
    }

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (exists) return res.status(409).json({ error: true, message: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 12);
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)').run(name, email.toLowerCase(), hash, role);
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// PUT /api/settings/users/:id
router.put('/users/:id', authorize('fleet_manager'), (req, res) => {
  try {
    const { name, role } = req.body;
    db.prepare(`UPDATE users SET name=COALESCE(?,name), role=COALESCE(?,role) WHERE id=?`).run(name, role, req.params.id);
    res.json(db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// DELETE /api/settings/users/:id
router.delete('/users/:id', authorize('fleet_manager'), (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: true, message: 'Cannot delete your own account' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
