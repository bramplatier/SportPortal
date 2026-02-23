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

  // Aankondigingen toevoegen
  const insertAnnouncement = db.prepare(`
    INSERT OR IGNORE INTO announcements (title, content, category, is_pinned, created_by)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertAnnouncement.run(
    'Welkom bij SportPortal!',
    'Welkom bij ons vernieuwde sportportaal! Hier kun je alle groepslessen bekijken, je inschrijven en afmelden. Heb je vragen of suggesties? Dien dan een aanvraag in via het aanvragenformulier.',
    'general',
    1,
    1
  );

  insertAnnouncement.run(
    'Vakantierooster Kerst 2026',
    'Let op: van 23 december t/m 1 januari hanteren wij een aangepast rooster. De ochtendlessen op maandag en woensdag vervallen. Alle andere lessen gaan gewoon door. Fijne feestdagen!',
    'schedule',
    0,
    1
  );

  insertAnnouncement.run(
    'Onderhoud zwembad',
    'Het zwembad is van 15 t/m 17 maart gesloten wegens groot onderhoud. De Aqua Fitness les verhuist tijdelijk naar Zaal B. Excuses voor het ongemak.',
    'maintenance',
    0,
    1
  );

  insertAnnouncement.run(
    'Sportdag 2026 - Doe mee!',
    'Op zaterdag 28 maart organiseren wij een grote sportdag voor al onze leden! Programma: bootcamp, estafette, voetbaltoernooi en meer. Inschrijving via de balie. Deelname is gratis voor leden.',
    'event',
    1,
    1
  );

  console.log('✅ Aankondigingen aangemaakt');

  // Voorbeeld aanvragen
  const insertRequest = db.prepare(`
    INSERT OR IGNORE INTO requests (user_id, category, title, description, status, admin_response, responded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertRequest.run(
    2, 'equipment', 'Nieuwe kettlebells',
    'De huidige kettlebells van 16kg zijn behoorlijk versleten. Kunnen er nieuwe besteld worden? Misschien ook 20kg erbij.',
    'approved', 'Nieuwe kettlebells zijn besteld en worden volgende week geleverd.', 1
  );

  insertRequest.run(
    3, 'lesson', 'Bokslessen toevoegen',
    'Ik zou het heel leuk vinden als er bokslessen worden aangeboden, bijv. op donderdag- of vrijdagavond. Er is veel belangstelling onder de leden!',
    'in_progress', null, null
  );

  insertRequest.run(
    2, 'facility', 'Warmer water in douches',
    'De douches bij kleedkamer 2 zijn de laatste weken erg koud. Zou het mogelijk zijn om de temperatuur iets hoger te zetten?',
    'completed', 'De thermostaat is bijgesteld. Laat het weten als het nog niet goed is.', 1
  );

  insertRequest.run(
    3, 'other', 'Muziek in de sportzaal',
    'Het zou fijn zijn als er achtergrondmuziek gedraaid wordt tijdens de vrije trainingsmomenten. Niet te hard, maar gewoon wat sfeer.',
    'open', null, null
  );

  console.log('✅ Voorbeeld-aanvragen aangemaakt');

  console.log('\n📋 Demo-accounts:');
  console.log('   Admin: admin@sportportal.nl / Admin123!');
  console.log('   Klant: jan@example.nl / Demo1234');
  console.log('   Klant: lisa@example.nl / Demo1234');
  console.log('\n✨ Seeding voltooid!');
}

seed().catch(console.error);
