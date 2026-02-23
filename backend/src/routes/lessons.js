const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Alle routes vereisen authenticatie
router.use(authenticate);

// ============================================================
// GET /api/lessons - Alle beschikbare lessen ophalen
// ============================================================
router.get('/', (req, res) => {
  try {
    const lessons = db
      .prepare(`
        SELECT 
          l.*,
          COUNT(r.id) AS current_participants,
          EXISTS(
            SELECT 1 FROM registrations r2 
            WHERE r2.lesson_id = l.id AND r2.user_id = ?
          ) AS is_registered
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
      .all(req.user.id);

    // Boolean conversie (SQLite geeft 0/1)
    const result = lessons.map((l) => ({
      ...l,
      is_registered: !!l.is_registered,
    }));

    res.json({ lessons: result });
  } catch (err) {
    console.error('Lessons fetch error:', err);
    res.status(500).json({ error: 'Kon lessen niet ophalen.' });
  }
});

// ============================================================
// GET /api/lessons/:id - Eén les ophalen met deelnemers
// ============================================================
router.get('/:id', (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'Ongeldig les-ID.' });
    }

    const lesson = db
      .prepare(`
        SELECT 
          l.*,
          COUNT(r.id) AS current_participants
        FROM lessons l
        LEFT JOIN registrations r ON r.lesson_id = l.id
        WHERE l.id = ?
        GROUP BY l.id
      `)
      .get(lessonId);

    if (!lesson) {
      return res.status(404).json({ error: 'Les niet gevonden.' });
    }

    // Controleer of de huidige gebruiker is ingeschreven
    const registration = db
      .prepare('SELECT id FROM registrations WHERE user_id = ? AND lesson_id = ?')
      .get(req.user.id, lessonId);

    lesson.is_registered = !!registration;

    res.json({ lesson });
  } catch (err) {
    console.error('Lesson fetch error:', err);
    res.status(500).json({ error: 'Kon les niet ophalen.' });
  }
});

module.exports = router;
