const express = require('express');
const router = express.Router();
const { connect } = require('../db/db');

function buildProductsQuery({ search, category, limit, offset }) {
  let base = 'SELECT id, name, category, short_desc, price, image_url, created_at FROM products';
  const clauses = [];
  const params = [];

  if (search) {
    clauses.push('(name LIKE ? OR short_desc LIKE ? OR long_desc LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  if (category) {
    clauses.push('category = ?');
    params.push(category);
  }

  if (clauses.length) base += ' WHERE ' + clauses.join(' AND ');
  base += ' ORDER BY created_at DESC';
  base += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return { sql: base, params };
}

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const db = connect();
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const offset = (page - 1) * limit;

    const { sql, params } = buildProductsQuery({ search, category, limit, offset });

    const products = await db.allAsync(sql, params);

    let countSql = 'SELECT COUNT(*) as count FROM products';
    const whereClauses = [];
    const countParams = [];
    if (search) {
      whereClauses.push('(name LIKE ? OR short_desc LIKE ? OR long_desc LIKE ?)');
      const q = `%${search}%`;
      countParams.push(q, q, q);
    }
    if (category) {
      whereClauses.push('category = ?');
      countParams.push(category);
    }
    if (whereClauses.length) countSql += ' WHERE ' + whereClauses.join(' AND ');
    const row = await db.getAsync(countSql, countParams);
    const total = row ? row.count : 0;

    res.json({
      page,
      limit,
      total,
      products
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const db = connect();
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

    const product = await db.getAsync(
      `SELECT id, name, category, short_desc, long_desc, price, image_url, created_at
       FROM products WHERE id = ?`,
      [id]
    );

    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({ product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
