const dotenv = require('dotenv')
const fs = require('fs');
const path = require('path');
const { connect, DB_FILE } = require('./db/db');
dotenv.config()

const schemaPath = path.join(__dirname, 'schema.sql');
const seedPath = path.join(__dirname, 'seed.sql');

async function run() {
  try {
    const db = connect();

    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync(schema);
    console.log('Schema executed.');

    const seedSql = fs.readFileSync(seedPath, 'utf8').trim();
    if (seedSql.length) {
      await db.execAsync(seedSql);
      console.log('Seed data inserted.');
    }

    console.log(`Database created/updated at: ${DB_FILE}`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

run();
