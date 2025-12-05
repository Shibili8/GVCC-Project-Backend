const express = require('express');
const router = express.Router();
const { connect } = require('../db/db');


const EMAIL_RE = /^\S+@\S+\.\S+$/;

function validateEnquiry(body) {
  const errors = [];
  if (!body.name || !body.name.trim()) errors.push('name is required');
  if (!body.email || !EMAIL_RE.test(body.email)) errors.push('valid email is required');
  if (!body.message || !body.message.trim()) errors.push('message is required');
  if (body.product_id !== undefined && body.product_id !== null) {
    const id = parseInt(body.product_id, 10);
    if (Number.isNaN(id) || id < 1) errors.push('product_id must be a positive integer');
  }
  return errors;
}

// POST /api/enquiries
router.post('/', async (req, res, next) => {
  try {
    const db = connect();
    const { product_id = null, name, email, phone = null, message } = req.body;

    const errors = validateEnquiry({ product_id, name, email, message });
    if (errors.length) return res.status(400).json({ errors });

    if (product_id) {
      const product = await db.getAsync('SELECT id FROM products WHERE id = ?', [product_id]);
      if (!product) return res.status(400).json({ error: 'Referenced product does not exist' });
    }

    const stmt = await db.runAsync(
      `INSERT INTO enquiries (product_id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)`,
      [product_id, name.trim(), email.trim(), phone ? phone.trim() : null, message.trim()]
    );

    const inserted = await db.getAsync('SELECT * FROM enquiries WHERE id = last_insert_rowid()');

    res.status(201).json({ message: 'Enquiry submitted', enquiry: inserted });
  } catch (err) {
    next(err);
  }
});

// GET /api/enquiries
// Returns all enquiries (admin). Supports optional ?product_id
router.get('/', async (req, res, next) => {
  try {
    const db = connect();
    const productId = req.query.product_id ? parseInt(req.query.product_id, 10) : null;
    let rows;
    if (productId && !Number.isNaN(productId)) {
      rows = await db.allAsync(
        `SELECT e.*, p.name as product_name
         FROM enquiries e
         LEFT JOIN products p ON e.product_id = p.id
         WHERE e.product_id = ?
         ORDER BY e.created_at DESC`,
        [productId]
      );
    } else {
      rows = await db.allAsync(
        `SELECT e.*, p.name as product_name
         FROM enquiries e
         LEFT JOIN products p ON e.product_id = p.id
         ORDER BY e.created_at DESC`
      );
    }
    res.json({ total: rows.length, enquiries: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
