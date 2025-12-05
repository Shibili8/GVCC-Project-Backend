const fs = require("fs");
const path = require("path");
const { connect, DB_FILE } = require("./db/db");

const schemaPath = path.join(__dirname, "schema.sql");
const seedPath = path.join(__dirname, "seed.sql");

try {
  const db = connect();

  const schema = fs.readFileSync(schemaPath, "utf8");
  const seed = fs.readFileSync(seedPath, "utf8");

  db.exec(schema);
  console.log("Schema applied.");

  db.exec(seed);
  console.log("Seed data inserted.");

  console.log("Database ready at:", DB_FILE);
} catch (err) {
  console.error("Seeding failed:", err);
  process.exit(1);
}
