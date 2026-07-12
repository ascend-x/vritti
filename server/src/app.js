require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const promClient = require('prom-client');
const statusMonitor = require('express-status-monitor');

// Initialize DB (runs migrations)
require('./db/database');

const app = express();

// Security Middleware
app.use(helmet());
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { error: true, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// General Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Live Visual Status Dashboard
app.use(statusMonitor({
  path: '/api/status',
  title: 'VRITTI Server Health',
}));

// Prometheus Metrics
promClient.collectDefaultMetrics();
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000]
});
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Swagger API Docs
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VRITTI API',
      version: '1.0.0',
      description: 'API Documentation for VRITTI Smart Transport Operations Platform',
    },
    servers: [{ url: '/api' }],
  },
  apis: ['./src/routes/*.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
app.use('/api/audit', require('./routes/audit.routes'));
app.use('/api/leaderboard', require('./routes/leaderboard.routes'));
app.use('/api/carbon', require('./routes/carbon.routes'));

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

// Setup Email Reminders Job (Bonus Feature)
const cron = require('node-cron');
const db = require('./db/database');

cron.schedule('0 9 * * *', () => {
  console.log('[CRON] Running daily license expiry check...');
  try {
    const expiring = db.prepare(`
      SELECT name, license_number, license_expiry 
      FROM drivers 
      WHERE status != 'Suspended' AND license_expiry <= date('now', '+30 days')
    `).all();
    
    if (expiring.length > 0) {
      console.log(`[CRON] Found ${expiring.length} expiring licenses. Sending email reminders to Safety Officer...`);
      expiring.forEach(d => {
        console.log(`[EMAIL MOCK] To: safety@vritti.com | Subj: License Expiring Soon: ${d.name} (${d.license_number}) by ${d.license_expiry}`);
      });
    }
  } catch (err) {
    console.error('[CRON] Error checking licenses:', err);
  }
});


const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚛 VRITTI Server running on http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`📖 Docs: http://localhost:${PORT}/api/docs`);
  console.log(`📊 UI Metrics: http://localhost:${PORT}/api/status`);
  console.log(`📈 Raw Metrics: http://localhost:${PORT}/api/metrics`);
  console.log(`🌿 Environment: ${process.env.NODE_ENV}\n`);
});

module.exports = app;
