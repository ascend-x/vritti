require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Initialize DB (runs migrations)
require('./db/database');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/vehicles', require('./routes/vehicles.routes'));
app.use('/api/drivers', require('./routes/drivers.routes'));
app.use('/api/trips', require('./routes/trips.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/fuel-logs', require('./routes/fuel.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/settings', require('./routes/settings.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'VRITTI', version: '1.0.0' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: true,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    statusCode: err.status || 500
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚛 VRITTI Server running on http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🌿 Environment: ${process.env.NODE_ENV}\n`);
});

module.exports = app;
