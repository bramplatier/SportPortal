const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Alle routes vereisen authenticatie
router.use(authenticate);

// ============================================================
// GET /api/announcements - Alle aankondigingen ophalen
// ============================================================
router.get('/', (req, res) => {
  try {
    const announcements = db
      .prepare(`
        SELECT 
          a.*,
          u.name AS author_name
        FROM announcements a
        JOIN users u ON u.id = a.created_by
        ORDER BY a.is_pinned DESC, a.created_at DESC
      `)
      .all();

    res.json({ announcements });
  } catch (err) {
    console.error('Announcements fetch error:', err);
    res.status(500).json({ error: 'Kon aankondigingen niet ophalen.' });
  }
});

module.exports = router;
