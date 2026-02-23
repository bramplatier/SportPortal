const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const db = require('../config/database');

const router = express.Router();

// Alle admin routes vereisen authenticatie + admin rol
router.use(authenticate);
router.use(authorizeAdmin);

// Validatieregels voor lessen
const lessonValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Naam is verplicht.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Naam moet tussen 2 en 100 tekens zijn.'),
  body('instructor')
    .trim()
    .notEmpty()
    .withMessage('Instructeur is verplicht.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Instructeur naam moet tussen 2 en 100 tekens zijn.'),
  body('day_of_week')
    .isIn(['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'])
    .withMessage('Ongeldige dag van de week.'),
  body('start_time')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Starttijd moet in HH:MM formaat zijn.'),
  body('end_time')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Eindtijd moet in HH:MM formaat zijn.'),
  body('max_participants')
    .isInt({ min: 1, max: 100 })
    .withMessage('Max deelnemers moet tussen 1 en 100 zijn.'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Locatie is verplicht.')
    .isLength({ max: 100 })
    .withMessage('Locatie mag maximaal 100 tekens zijn.'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Beschrijving mag maximaal 500 tekens zijn.'),
  handleValidationErrors,
];

// ============================================================
// GET /api/admin/lessons - Alle lessen met deelnemersaantallen
// ============================================================
router.get('/lessons', (req, res) => {
  try {
    const lessons = db
      .prepare(`
        SELECT 
          l.*,
          COUNT(r.id) AS current_participants
        FROM lessons l
        LEFT JOIN registrations r ON r.lesson_id = l.id
        GROUP BY l.id
        ORDER BY 
          CASE l.day_of_week
            WHEN 'Maandag' THEN 1
            WHEN 'Dinsdag' THEN 2
            WHEN 'Woensdag' THEN 3
            WHEN 'Donderdag' THEN 4
            WHEN 'Vrijdag' THEN 5
            WHEN 'Zaterdag' THEN 6
            WHEN 'Zondag' THEN 7
          END,
          l.start_time
      `)
      .all();

    res.json({ lessons });
  } catch (err) {
    console.error('Admin lessons fetch error:', err);
    res.status(500).json({ error: 'Kon lessen niet ophalen.' });
  }
});

// ============================================================
// POST /api/admin/lessons - Nieuwe les aanmaken
// ============================================================
router.post('/lessons', lessonValidation, (req, res) => {
  try {
    const { name, description, instructor, day_of_week, start_time, end_time, max_participants, location } = req.body;

    const stmt = db.prepare(`
      INSERT INTO lessons (name, description, instructor, day_of_week, start_time, end_time, max_participants, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, description || null, instructor, day_of_week, start_time, end_time, max_participants, location);

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Les succesvol aangemaakt.', lesson });
  } catch (err) {
    console.error('Admin lesson create error:', err);
    res.status(500).json({ error: 'Kon les niet aanmaken.' });
  }
});

// ============================================================
// PUT /api/admin/lessons/:id - Les bewerken
// ============================================================
router.put('/lessons/:id', lessonValidation, (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'Ongeldig les-ID.' });
    }

    const existing = db.prepare('SELECT id FROM lessons WHERE id = ?').get(lessonId);
    if (!existing) {
      return res.status(404).json({ error: 'Les niet gevonden.' });
    }

    const { name, description, instructor, day_of_week, start_time, end_time, max_participants, location } = req.body;

    db.prepare(`
      UPDATE lessons 
      SET name = ?, description = ?, instructor = ?, day_of_week = ?, 
          start_time = ?, end_time = ?, max_participants = ?, location = ?
      WHERE id = ?
    `).run(name, description || null, instructor, day_of_week, start_time, end_time, max_participants, location, lessonId);

    const lesson = db.prepare(`
      SELECT l.*, COUNT(r.id) AS current_participants
      FROM lessons l
      LEFT JOIN registrations r ON r.lesson_id = l.id
      WHERE l.id = ?
      GROUP BY l.id
    `).get(lessonId);

    res.json({ message: 'Les succesvol bijgewerkt.', lesson });
  } catch (err) {
    console.error('Admin lesson update error:', err);
    res.status(500).json({ error: 'Kon les niet bijwerken.' });
  }
});

// ============================================================
// DELETE /api/admin/lessons/:id - Les verwijderen
// ============================================================
router.delete('/lessons/:id', (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'Ongeldig les-ID.' });
    }

    const existing = db.prepare('SELECT id, name FROM lessons WHERE id = ?').get(lessonId);
    if (!existing) {
      return res.status(404).json({ error: 'Les niet gevonden.' });
    }

    // Cascade: registrations worden automatisch verwijderd door FK constraint
    db.prepare('DELETE FROM lessons WHERE id = ?').run(lessonId);

    res.json({ message: `Les "${existing.name}" succesvol verwijderd.` });
  } catch (err) {
    console.error('Admin lesson delete error:', err);
    res.status(500).json({ error: 'Kon les niet verwijderen.' });
  }
});

// ============================================================
// GET /api/admin/lessons/:id/participants - Deelnemers van een les
// ============================================================
router.get('/lessons/:id/participants', (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'Ongeldig les-ID.' });
    }

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Les niet gevonden.' });
    }

    const participants = db
      .prepare(`
        SELECT u.id, u.name, u.email, r.registered_at
        FROM registrations r
        JOIN users u ON u.id = r.user_id
        WHERE r.lesson_id = ?
        ORDER BY r.registered_at
      `)
      .all(lessonId);

    res.json({ lesson, participants });
  } catch (err) {
    console.error('Admin participants fetch error:', err);
    res.status(500).json({ error: 'Kon deelnemers niet ophalen.' });
  }
});

// ============================================================
// GET /api/admin/users - Alle gebruikers ophalen
// ============================================================
router.get('/users', (req, res) => {
  try {
    const users = db
      .prepare(`
        SELECT 
          u.id, u.name, u.email, u.role, u.created_at,
          COUNT(r.id) AS registration_count
        FROM users u
        LEFT JOIN registrations r ON r.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `)
      .all();

    res.json({ users });
  } catch (err) {
    console.error('Admin users fetch error:', err);
    res.status(500).json({ error: 'Kon gebruikers niet ophalen.' });
  }
});

// ============================================================
// POST /api/admin/users - Nieuwe gebruiker aanmaken
// ============================================================
router.post(
  '/users',
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
    body('role')
      .isIn(['customer', 'admin'])
      .withMessage('Rol moet "customer" of "admin" zijn.'),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const bcrypt = require('bcrypt');
      const { name, email, password, role } = req.body;

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(409).json({ error: 'Dit e-mailadres is al geregistreerd.' });
      }

      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const stmt = db.prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
      );
      const result = stmt.run(name, email, hashedPassword, role);

      res.status(201).json({
        message: 'Gebruiker succesvol aangemaakt.',
        user: { id: result.lastInsertRowid, name, email, role },
      });
    } catch (err) {
      console.error('Admin user create error:', err);
      res.status(500).json({ error: 'Kon gebruiker niet aanmaken.' });
    }
  }
);

// ============================================================
// PUT /api/admin/users/:id - Gebruiker bewerken
// ============================================================
router.put(
  '/users/:id',
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
    body('role')
      .isIn(['customer', 'admin'])
      .withMessage('Rol moet "customer" of "admin" zijn.'),
    body('password')
      .optional({ values: 'falsy' })
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
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Ongeldig gebruikers-ID.' });
      }

      const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!existing) {
        return res.status(404).json({ error: 'Gebruiker niet gevonden.' });
      }

      const { name, email, role, password } = req.body;

      // Controleer uniekheid van e-mail
      const emailConflict = db
        .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
        .get(email, userId);
      if (emailConflict) {
        return res.status(409).json({ error: 'Dit e-mailadres is al in gebruik door een andere gebruiker.' });
      }

      if (password) {
        const bcrypt = require('bcrypt');
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        db.prepare(
          'UPDATE users SET name = ?, email = ?, role = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(name, email, role, hashedPassword, userId);
      } else {
        db.prepare(
          'UPDATE users SET name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(name, email, role, userId);
      }

      const user = db
        .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
        .get(userId);

      res.json({ message: 'Gebruiker succesvol bijgewerkt.', user });
    } catch (err) {
      console.error('Admin user update error:', err);
      res.status(500).json({ error: 'Kon gebruiker niet bijwerken.' });
    }
  }
);

// ============================================================
// DELETE /api/admin/users/:id - Gebruiker verwijderen
// ============================================================
router.delete('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Ongeldig gebruikers-ID.' });
    }

    // Voorkom dat admin zichzelf verwijdert
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Je kunt je eigen account niet verwijderen.' });
    }

    const existing = db.prepare('SELECT id, name FROM users WHERE id = ?').get(userId);
    if (!existing) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden.' });
    }

    // Cascade: registrations worden automatisch verwijderd door FK constraint
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({ message: `Gebruiker "${existing.name}" succesvol verwijderd.` });
  } catch (err) {
    console.error('Admin user delete error:', err);
    res.status(500).json({ error: 'Kon gebruiker niet verwijderen.' });
  }
});

// ============================================================
// GET /api/admin/stats - Dashboard statistieken
// ============================================================
router.get('/stats', (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const lessonCount = db.prepare('SELECT COUNT(*) AS count FROM lessons').get().count;
    const registrationCount = db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count;

    const popularLessons = db
      .prepare(`
        SELECT l.name, l.day_of_week, l.start_time, COUNT(r.id) AS participants, l.max_participants
        FROM lessons l
        LEFT JOIN registrations r ON r.lesson_id = l.id
        GROUP BY l.id
        ORDER BY participants DESC
        LIMIT 5
      `)
      .all();

    res.json({
      stats: {
        users: userCount,
        lessons: lessonCount,
        registrations: registrationCount,
      },
      popularLessons,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Kon statistieken niet ophalen.' });
  }
});

// ============================================================
// GET /api/admin/requests - Alle aanvragen ophalen
// ============================================================
router.get('/requests', (req, res) => {
  try {
    const requests = db
      .prepare(`
        SELECT 
          r.*,
          u.name AS user_name,
          u.email AS user_email,
          a.name AS responded_by_name
        FROM requests r
        JOIN users u ON u.id = r.user_id
        LEFT JOIN users a ON a.id = r.responded_by
        ORDER BY 
          CASE r.status 
            WHEN 'open' THEN 1 
            WHEN 'in_progress' THEN 2 
            ELSE 3 
          END,
          r.created_at DESC
      `)
      .all();

    res.json({ requests });
  } catch (err) {
    console.error('Admin requests fetch error:', err);
    res.status(500).json({ error: 'Kon aanvragen niet ophalen.' });
  }
});

// ============================================================
// PUT /api/admin/requests/:id - Aanvraag status bijwerken
// ============================================================
router.put(
  '/requests/:id',
  [
    body('status')
      .isIn(['open', 'in_progress', 'approved', 'denied', 'completed'])
      .withMessage('Ongeldige status.'),
    body('admin_response')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reactie mag maximaal 500 tekens zijn.'),
    handleValidationErrors,
  ],
  (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ error: 'Ongeldig aanvraag-ID.' });
      }

      const existing = db.prepare('SELECT id FROM requests WHERE id = ?').get(requestId);
      if (!existing) {
        return res.status(404).json({ error: 'Aanvraag niet gevonden.' });
      }

      const { status, admin_response } = req.body;

      db.prepare(`
        UPDATE requests 
        SET status = ?, admin_response = ?, responded_by = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(status, admin_response || null, req.user.id, requestId);

      const updated = db
        .prepare(`
          SELECT r.*, u.name AS user_name, a.name AS responded_by_name
          FROM requests r
          JOIN users u ON u.id = r.user_id
          LEFT JOIN users a ON a.id = r.responded_by
          WHERE r.id = ?
        `)
        .get(requestId);

      res.json({ message: 'Aanvraag bijgewerkt.', request: updated });
    } catch (err) {
      console.error('Admin request update error:', err);
      res.status(500).json({ error: 'Kon aanvraag niet bijwerken.' });
    }
  }
);

// ============================================================
// DELETE /api/admin/requests/:id - Aanvraag verwijderen
// ============================================================
router.delete('/requests/:id', (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Ongeldig aanvraag-ID.' });
    }

    const existing = db.prepare('SELECT id FROM requests WHERE id = ?').get(requestId);
    if (!existing) {
      return res.status(404).json({ error: 'Aanvraag niet gevonden.' });
    }

    db.prepare('DELETE FROM requests WHERE id = ?').run(requestId);

    res.json({ message: 'Aanvraag verwijderd.' });
  } catch (err) {
    console.error('Admin request delete error:', err);
    res.status(500).json({ error: 'Kon aanvraag niet verwijderen.' });
  }
});

// ============================================================
// GET /api/admin/announcements - Alle aankondigingen ophalen (admin)
// ============================================================
router.get('/announcements', (req, res) => {
  try {
    const announcements = db
      .prepare(`
        SELECT a.*, u.name AS author_name
        FROM announcements a
        JOIN users u ON u.id = a.created_by
        ORDER BY a.is_pinned DESC, a.created_at DESC
      `)
      .all();

    res.json({ announcements });
  } catch (err) {
    console.error('Admin announcements fetch error:', err);
    res.status(500).json({ error: 'Kon aankondigingen niet ophalen.' });
  }
});

// ============================================================
// POST /api/admin/announcements - Nieuwe aankondiging
// ============================================================
router.post(
  '/announcements',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Titel is verplicht.')
      .isLength({ min: 3, max: 150 })
      .withMessage('Titel moet tussen 3 en 150 tekens zijn.'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Inhoud is verplicht.')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Inhoud moet tussen 10 en 2000 tekens zijn.'),
    body('category')
      .isIn(['general', 'schedule', 'maintenance', 'event'])
      .withMessage('Ongeldige categorie.'),
    body('is_pinned')
      .optional()
      .isBoolean()
      .withMessage('is_pinned moet een boolean zijn.'),
    handleValidationErrors,
  ],
  (req, res) => {
    try {
      const { title, content, category, is_pinned } = req.body;

      const stmt = db.prepare(
        'INSERT INTO announcements (title, content, category, is_pinned, created_by) VALUES (?, ?, ?, ?, ?)'
      );
      const result = stmt.run(title, content, category, is_pinned ? 1 : 0, req.user.id);

      const announcement = db
        .prepare(`
          SELECT a.*, u.name AS author_name 
          FROM announcements a 
          JOIN users u ON u.id = a.created_by 
          WHERE a.id = ?
        `)
        .get(result.lastInsertRowid);

      res.status(201).json({ message: 'Aankondiging geplaatst.', announcement });
    } catch (err) {
      console.error('Admin announcement create error:', err);
      res.status(500).json({ error: 'Kon aankondiging niet plaatsen.' });
    }
  }
);

// ============================================================
// PUT /api/admin/announcements/:id - Aankondiging bewerken
// ============================================================
router.put(
  '/announcements/:id',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Titel is verplicht.')
      .isLength({ min: 3, max: 150 })
      .withMessage('Titel moet tussen 3 en 150 tekens zijn.'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Inhoud is verplicht.')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Inhoud moet tussen 10 en 2000 tekens zijn.'),
    body('category')
      .isIn(['general', 'schedule', 'maintenance', 'event'])
      .withMessage('Ongeldige categorie.'),
    body('is_pinned')
      .optional()
      .isBoolean()
      .withMessage('is_pinned moet een boolean zijn.'),
    handleValidationErrors,
  ],
  (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      if (isNaN(announcementId)) {
        return res.status(400).json({ error: 'Ongeldig aankondiging-ID.' });
      }

      const existing = db.prepare('SELECT id FROM announcements WHERE id = ?').get(announcementId);
      if (!existing) {
        return res.status(404).json({ error: 'Aankondiging niet gevonden.' });
      }

      const { title, content, category, is_pinned } = req.body;

      db.prepare(`
        UPDATE announcements 
        SET title = ?, content = ?, category = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(title, content, category, is_pinned ? 1 : 0, announcementId);

      const announcement = db
        .prepare(`
          SELECT a.*, u.name AS author_name 
          FROM announcements a 
          JOIN users u ON u.id = a.created_by 
          WHERE a.id = ?
        `)
        .get(announcementId);

      res.json({ message: 'Aankondiging bijgewerkt.', announcement });
    } catch (err) {
      console.error('Admin announcement update error:', err);
      res.status(500).json({ error: 'Kon aankondiging niet bijwerken.' });
    }
  }
);

// ============================================================
// DELETE /api/admin/announcements/:id - Aankondiging verwijderen
// ============================================================
router.delete('/announcements/:id', (req, res) => {
  try {
    const announcementId = parseInt(req.params.id);
    if (isNaN(announcementId)) {
      return res.status(400).json({ error: 'Ongeldig aankondiging-ID.' });
    }

    const existing = db.prepare('SELECT id FROM announcements WHERE id = ?').get(announcementId);
    if (!existing) {
      return res.status(404).json({ error: 'Aankondiging niet gevonden.' });
    }

    db.prepare('DELETE FROM announcements WHERE id = ?').run(announcementId);

    res.json({ message: 'Aankondiging verwijderd.' });
  } catch (err) {
    console.error('Admin announcement delete error:', err);
    res.status(500).json({ error: 'Kon aankondiging niet verwijderen.' });
  }
});

module.exports = router;
