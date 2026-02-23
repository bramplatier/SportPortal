const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'sportportal.db');
const db = new Database(dbPath);

// WAL mode voor betere performance en concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Tabellen aanmaken
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    instructor TEXT NOT NULL,
    day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag')),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 20,
    location TEXT NOT NULL DEFAULT 'Sportzaal 1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id)
  );

  CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
  CREATE INDEX IF NOT EXISTS idx_registrations_lesson ON registrations(lesson_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

module.exports = db;
