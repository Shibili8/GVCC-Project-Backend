const express = require("express");
const router = express.Router();
const { connect } = require("../db/db");

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function validateEnquiry(body) {
  const errors = [];
  if (!body.name) errors.push("name is required");
  if (!body.email || !EMAIL_RE.test(body.email)) errors.push("valid email is required");
  if (!body.message) errors.push("message is required");
  return errors;
}

router.post("/", (req, res) => {
  const db = connect();

  const { product_id, name, email, phone, message } = req.body;

  const errors = validateEnquiry(req.body);
  if (errors.length) return res.status(400).json({ errors });

  if (product_id) {
    const exists = db.prepare("SELECT id FROM products WHERE id = ?").get(product_id);
    if (!exists) return res.status(400).json({ error: "Product does not exist" });
  }

  const stmt = db.prepare(
    `INSERT INTO enquiries (product_id, name, email, phone, message)
     VALUES (@product_id, @name, @email, @phone, @message)`
  );

  stmt.run({
    product_id: product_id || null,
    name,
    email,
    phone: phone || null,
    message,
  });

  const inserted = db.prepare(
    "SELECT * FROM enquiries ORDER BY id DESC LIMIT 1"
  ).get();

  res.status(201).json({ message: "Enquiry submitted", enquiry: inserted });
});

router.get("/", (req, res) => {
  const db = connect();

  const product_id = req.query.product_id;

  let sql = `
    SELECT e.*, p.name AS product_name
    FROM enquiries e
    LEFT JOIN products p ON e.product_id = p.id
  `;

  const params = {};

  if (product_id) {
    sql += " WHERE e.product_id = @product_id";
    params.product_id = product_id;
  }

  sql += " ORDER BY e.created_at DESC";

  const enquiries = db.prepare(sql).all(params);

  res.json({ total: enquiries.length, enquiries });
});

module.exports = router;
