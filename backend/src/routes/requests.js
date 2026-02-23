const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const db = require('../config/database');

const router = express.Router();

// Alle routes vereisen authenticatie
router.use(authenticate);

// ============================================================
// GET /api/requests - Eigen aanvragen ophalen (klant)
// ============================================================
router.get('/', (req, res) => {
  try {
    const requests = db
      .prepare(`
        SELECT 
          r.*,
          u.name AS user_name,
          a.name AS responded_by_name
        FROM requests r
        JOIN users u ON u.id = r.user_id
        LEFT JOIN users a ON a.id = r.responded_by
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
      `)
      .all(req.user.id);

    res.json({ requests });
  } catch (err) {
    console.error('Requests fetch error:', err);
    res.status(500).json({ error: 'Kon aanvragen niet ophalen.' });
  }
});

// ============================================================
// POST /api/requests - Nieuwe aanvraag indienen
// ============================================================
router.post(
  '/',
  [
    body('category')
      .isIn(['equipment', 'facility', 'lesson', 'other'])
      .withMessage('Ongeldige categorie. Kies uit: equipment, facility, lesson, other.'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Titel is verplicht.')
      .isLength({ min: 3, max: 150 })
      .withMessage('Titel moet tussen 3 en 150 tekens zijn.'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Beschrijving is verplicht.')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Beschrijving moet tussen 10 en 1000 tekens zijn.'),
    handleValidationErrors,
  ],
  (req, res) => {
    try {
      const { category, title, description } = req.body;

      const stmt = db.prepare(
        'INSERT INTO requests (user_id, category, title, description) VALUES (?, ?, ?, ?)'
      );
      const result = stmt.run(req.user.id, category, title, description);

      const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(result.lastInsertRowid);

      res.status(201).json({
        message: 'Aanvraag succesvol ingediend.',
        request,
      });
    } catch (err) {
      console.error('Request create error:', err);
      res.status(500).json({ error: 'Kon aanvraag niet indienen.' });
    }
  }
);

// ============================================================
// DELETE /api/requests/:id - Eigen aanvraag verwijderen (alleen als status 'open')
// ============================================================
router.delete('/:id', (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Ongeldig aanvraag-ID.' });
    }

    const request = db
      .prepare('SELECT * FROM requests WHERE id = ? AND user_id = ?')
      .get(requestId, req.user.id);

    if (!request) {
      return res.status(404).json({ error: 'Aanvraag niet gevonden.' });
    }

    if (request.status !== 'open') {
      return res.status(400).json({ error: 'Alleen open aanvragen kunnen worden verwijderd.' });
    }

    db.prepare('DELETE FROM requests WHERE id = ?').run(requestId);

    res.json({ message: 'Aanvraag verwijderd.' });
  } catch (err) {
    console.error('Request delete error:', err);
    res.status(500).json({ error: 'Kon aanvraag niet verwijderen.' });
  }
});

module.exports = router;
