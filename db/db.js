const Database = require("better-sqlite3");
const path = require("path");

const DB_FILE = process.env.DB_FILE || path.join(__dirname, "..", "database.db");

let db;

function connect() {
  if (!db) {
    db = new Database(DB_FILE);
    db.pragma("foreign_keys = ON");
  }
  return db;
}

function close() {
  if (db) db.close();
}

module.exports = { connect, close, DB_FILE };
