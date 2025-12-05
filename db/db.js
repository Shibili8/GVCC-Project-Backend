const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'database.db');

let db;

function connect() {
  if (!db) {
    db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        console.error('Failed to open database:', err);
        throw err;
      }
    });
    db.runAsync = promisify(db.run.bind(db));
    db.allAsync = promisify(db.all.bind(db));
    db.getAsync = promisify(db.get.bind(db));
    db.execAsync = promisify(db.exec.bind(db));
  }
  return db;
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { connect, close, DB_FILE };
