require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const lessonRoutes = require('./routes/lessons');
const registrationRoutes = require('./routes/registrations');
const requestRoutes = require('./routes/requests');
const announcementRoutes = require('./routes/announcements');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet - stel veilige HTTP-headers in
app.use(helmet());

// CORS - sta alleen de frontend origin toe
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate limiting - voorkom brute-force aanvallen
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 100,
  message: { error: 'Te veel verzoeken. Probeer het later opnieuw.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 10, // stricter voor auth endpoints
  message: { error: 'Te veel inlogpogingen. Probeer het over 15 minuten opnieuw.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' })); // Beperk body grootte

// ============================================================
// ROUTES
// ============================================================

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint niet gevonden.' });
});

// Globale error handler - lekt geen interne details naar de client
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Er is een interne serverfout opgetreden.' });
});

// ============================================================
// SERVER STARTEN
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🏟️  SportPortal API draait op http://localhost:${PORT}`);
  console.log(`   Omgeving: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}\n`);
});
