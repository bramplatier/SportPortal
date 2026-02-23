/**
 * Seed script - Vult de database met voorbeeldlessen en een admin-account.
 * Gebruik: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./config/database');

async function seed() {
  console.log('🌱 Seeding database...');

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

  // Admin gebruiker aanmaken
  const adminPassword = await bcrypt.hash('Admin123!', saltRounds);
  const demoPassword = await bcrypt.hash('Demo1234', saltRounds);

  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  );

  insertUser.run('Admin', 'admin@sportportal.nl', adminPassword, 'admin');
  insertUser.run('Jan de Vries', 'jan@example.nl', demoPassword, 'customer');
  insertUser.run('Lisa Bakker', 'lisa@example.nl', demoPassword, 'customer');

  console.log('✅ Gebruikers aangemaakt');

  // Groepslessen toevoegen
  const insertLesson = db.prepare(`
    INSERT OR IGNORE INTO lessons (name, description, instructor, day_of_week, start_time, end_time, max_participants, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const lessons = [
    ['Yoga', 'Ontspannende yoga sessie voor alle niveaus.', 'Sophie Jansen', 'Maandag', '09:00', '10:00', 20, 'Zaal A'],
    ['Spinning', 'Intensieve spinning les met geweldige muziek.', 'Mark de Boer', 'Maandag', '18:00', '19:00', 15, 'Spinningzaal'],
    ['Body Pump', 'Krachtige groepstraining met gewichten.', 'Eva Smit', 'Dinsdag', '10:00', '11:00', 25, 'Zaal B'],
    ['Zumba', 'Dansen en bewegen op Latijns-Amerikaanse muziek.', 'Maria Rodriguez', 'Dinsdag', '19:00', '20:00', 30, 'Grote zaal'],
    ['Pilates', 'Versterk je core met gecontroleerde oefeningen.', 'Sophie Jansen', 'Woensdag', '09:00', '10:00', 18, 'Zaal A'],
    ['CrossFit', 'High Intensity functionele training.', 'Tom Hendriks', 'Woensdag', '17:30', '18:30', 12, 'CrossFit box'],
    ['Kickboxing', 'Leer kickbokstechnieken in een groepssetting.', 'Daan Visser', 'Donderdag', '18:00', '19:00', 20, 'Vechtsportzaal'],
    ['Aqua Fitness', 'Sporten in het water, makkelijk voor gewrichten.', 'Linda de Wit', 'Donderdag', '10:00', '11:00', 15, 'Zwembad'],
    ['HIIT', 'Korte, intensieve intervaltraining.', 'Tom Hendriks', 'Vrijdag', '07:00', '07:45', 20, 'Zaal B'],
    ['Stretching', 'Uitgebreide stretchsessie voor flexibiliteit.', 'Sophie Jansen', 'Vrijdag', '12:00', '13:00', 25, 'Zaal A'],
    ['Bootcamp', 'Buiten trainen in groepsverband.', 'Mark de Boer', 'Zaterdag', '09:00', '10:30', 30, 'Buitenveld'],
    ['Yoga Flow', 'Dynamische yoga met vloeiende overgangen.', 'Sophie Jansen', 'Zondag', '10:00', '11:15', 20, 'Zaal A'],
  ];

  for (const lesson of lessons) {
    insertLesson.run(...lesson);
  }

  console.log('✅ Lessen aangemaakt');

  // Demo inschrijvingen
  const insertReg = db.prepare(
    'INSERT OR IGNORE INTO registrations (user_id, lesson_id) VALUES (?, ?)'
  );

  // Jan schrijft zich in voor een paar lessen
  insertReg.run(2, 1); // Yoga
  insertReg.run(2, 4); // Zumba
  insertReg.run(2, 9); // HIIT

  // Lisa schrijft zich in
  insertReg.run(3, 1); // Yoga
  insertReg.run(3, 3); // Body Pump
  insertReg.run(3, 11); // Bootcamp

  console.log('✅ Demo-inschrijvingen aangemaakt');
  console.log('\n📋 Demo-accounts:');
  console.log('   Admin: admin@sportportal.nl / Admin123!');
  console.log('   Klant: jan@example.nl / Demo1234');
  console.log('   Klant: lisa@example.nl / Demo1234');
  console.log('\n✨ Seeding voltooid!');
}

seed().catch(console.error);
