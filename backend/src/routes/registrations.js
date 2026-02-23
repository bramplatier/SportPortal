const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Alle routes vereisen authenticatie
router.use(authenticate);

// ============================================================
// GET /api/registrations - Alle inschrijvingen van de ingelogde gebruiker
// ============================================================
router.get('/', (req, res) => {
  try {
    const registrations = db
      .prepare(`
        SELECT 
          r.id AS registration_id,
          r.registered_at,
          l.id AS lesson_id,
          l.name,
          l.description,
          l.instructor,
          l.day_of_week,
          l.start_time,
          l.end_time,
          l.location,
          l.max_participants,
          (SELECT COUNT(*) FROM registrations r2 WHERE r2.lesson_id = l.id) AS current_participants
        FROM registrations r
        JOIN lessons l ON l.id = r.lesson_id
        WHERE r.user_id = ?
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

    res.json({ registrations });
  } catch (err) {
    console.error('Registrations fetch error:', err);
    res.status(500).json({ error: 'Kon inschrijvingen niet ophalen.' });
  }
});

// ============================================================
// POST /api/registrations/:lessonId - Inschrijven voor een les
// ============================================================
router.post('/:lessonId', (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'Ongeldig les-ID.' });
    }

    // Controleer of de les bestaat
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Les niet gevonden.' });
    }

    // Controleer of de gebruiker al is ingeschreven
    const existing = db
      .prepare('SELECT id FROM registrations WHERE user_id = ? AND lesson_id = ?')
      .get(req.user.id, lessonId);
    if (existing) {
      return res.status(409).json({ error: 'Je bent al ingeschreven voor deze les.' });
    }

    // Controleer of de les vol is
    const participantCount = db
      .prepare('SELECT COUNT(*) AS count FROM registrations WHERE lesson_id = ?')
      .get(lessonId);
    if (participantCount.count >= lesson.max_participants) {
      return res.status(400).json({ error: 'Deze les is vol.' });
    }

    // Inschrijving toevoegen
    const stmt = db.prepare(
      'INSERT INTO registrations (user_id, lesson_id) VALUES (?, ?)'
    );
    const result = stmt.run(req.user.id, lessonId);

    res.status(201).json({
      message: `Succesvol ingeschreven voor ${lesson.name}.`,
      registration: {
        id: result.lastInsertRowid,
        lesson_id: lessonId,
        lesson_name: lesson.name,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Kon inschrijving niet verwerken.' });
  }
});

// ============================================================
// DELETE /api/registrations/:lessonId - Afmelden voor een les
// ============================================================
router.delete('/:lessonId', (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'Ongeldig les-ID.' });
    }

    // Controleer of de inschrijving bestaat
    const registration = db
      .prepare('SELECT id FROM registrations WHERE user_id = ? AND lesson_id = ?')
      .get(req.user.id, lessonId);

    if (!registration) {
      return res.status(404).json({ error: 'Je bent niet ingeschreven voor deze les.' });
    }

    // Inschrijving verwijderen
    db.prepare('DELETE FROM registrations WHERE user_id = ? AND lesson_id = ?').run(
      req.user.id,
      lessonId
    );

    res.json({ message: 'Succesvol afgemeld.' });
  } catch (err) {
    console.error('Unregister error:', err);
    res.status(500).json({ error: 'Kon afmelding niet verwerken.' });
  }
});

module.exports = router;
