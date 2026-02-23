const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// ============================================================
// POST /api/auth/register - Nieuwe gebruiker registreren
// ============================================================
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Naam is verplicht.')
      .isLength({ min: 2, max: 100 })
      .withMessage('Naam moet tussen 2 en 100 tekens zijn.'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Ongeldig e-mailadres.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Wachtwoord moet minimaal 8 tekens zijn.')
      .matches(/[A-Z]/)
      .withMessage('Wachtwoord moet minimaal 1 hoofdletter bevatten.')
      .matches(/[a-z]/)
      .withMessage('Wachtwoord moet minimaal 1 kleine letter bevatten.')
      .matches(/[0-9]/)
      .withMessage('Wachtwoord moet minimaal 1 cijfer bevatten.'),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Controleer of e-mail al bestaat
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(409).json({ error: 'Dit e-mailadres is al geregistreerd.' });
      }

      // Wachtwoord hashen met bcrypt
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Gebruiker opslaan
      const stmt = db.prepare(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
      );
      const result = stmt.run(name, email, hashedPassword);

      // JWT token genereren
      const token = jwt.sign(
        { id: result.lastInsertRowid, email, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'Account succesvol aangemaakt.',
        token,
        user: { id: result.lastInsertRowid, name, email, role: 'customer' },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Er is een fout opgetreden bij registratie.' });
    }
  }
);

// ============================================================
// POST /api/auth/login - Inloggen
// ============================================================
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Ongeldig e-mailadres.')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Wachtwoord is verplicht.'),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Gebruiker opzoeken
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) {
        // Generieke foutmelding om user enumeration te voorkomen
        return res.status(401).json({ error: 'Ongeldige inloggegevens.' });
      }

      // Wachtwoord vergelijken
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Ongeldige inloggegevens.' });
      }

      // JWT token genereren
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Succesvol ingelogd.',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Er is een fout opgetreden bij inloggen.' });
    }
  }
);

// ============================================================
// GET /api/auth/me - Haal huidige gebruikersinfo op
// ============================================================
router.get('/me', authenticate, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Gebruiker niet gevonden.' });
  }

  // Haal extra profiel-statistieken op
  const registrationCount = db
    .prepare('SELECT COUNT(*) AS count FROM registrations WHERE user_id = ?')
    .get(req.user.id).count;

  const requestCount = db
    .prepare('SELECT COUNT(*) AS count FROM requests WHERE user_id = ?')
    .get(req.user.id).count;

  res.json({ user: { ...user, registration_count: registrationCount, request_count: requestCount } });
});

// ============================================================
// PUT /api/auth/profile - Profiel bijwerken
// ============================================================
router.put(
  '/profile',
  authenticate,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Naam is verplicht.')
      .isLength({ min: 2, max: 100 })
      .withMessage('Naam moet tussen 2 en 100 tekens zijn.'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Ongeldig e-mailadres.')
      .normalizeEmail(),
    body('current_password')
      .optional({ values: 'falsy' }),
    body('new_password')
      .optional({ values: 'falsy' })
      .isLength({ min: 8 })
      .withMessage('Nieuw wachtwoord moet minimaal 8 tekens zijn.')
      .matches(/[A-Z]/)
      .withMessage('Nieuw wachtwoord moet minimaal 1 hoofdletter bevatten.')
      .matches(/[a-z]/)
      .withMessage('Nieuw wachtwoord moet minimaal 1 kleine letter bevatten.')
      .matches(/[0-9]/)
      .withMessage('Nieuw wachtwoord moet minimaal 1 cijfer bevatten.'),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { name, email, current_password, new_password } = req.body;

      // Controleer uniekheid van e-mail
      const emailConflict = db
        .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
        .get(email, req.user.id);
      if (emailConflict) {
        return res.status(409).json({ error: 'Dit e-mailadres is al in gebruik.' });
      }

      // Als wachtwoord wordt gewijzigd, controleer het huidige wachtwoord
      if (new_password) {
        if (!current_password) {
          return res.status(400).json({ error: 'Huidig wachtwoord is verplicht om je wachtwoord te wijzigen.' });
        }

        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
        const validPassword = await bcrypt.compare(current_password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Huidig wachtwoord is onjuist.' });
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(new_password, saltRounds);

        db.prepare(
          'UPDATE users SET name = ?, email = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(name, email, hashedPassword, req.user.id);
      } else {
        db.prepare(
          'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(name, email, req.user.id);
      }

      const updatedUser = db
        .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
        .get(req.user.id);

      res.json({ message: 'Profiel succesvol bijgewerkt.', user: updatedUser });
    } catch (err) {
      console.error('Profile update error:', err);
      res.status(500).json({ error: 'Kon profiel niet bijwerken.' });
    }
  }
);

module.exports = router;
