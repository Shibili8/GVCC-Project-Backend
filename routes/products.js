const express = require("express");
const router = express.Router();
const { connect } = require("../db/db");

router.get("/", (req, res) => {
  const db = connect();

  const search = req.query.search?.trim() || "";
  const category = req.query.category?.trim() || "";
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let sql = `SELECT * FROM products WHERE 1=1`;
  let countSql = `SELECT COUNT(*) as count FROM products WHERE 1=1`;

  const params = {};
  const countParams = {};

  if (search) {
    sql += ` AND (name LIKE @q OR short_desc LIKE @q OR long_desc LIKE @q)`;
    countSql += ` AND (name LIKE @q OR short_desc LIKE @q OR long_desc LIKE @q)`;
    params.q = `%${search}%`;
    countParams.q = `%${search}%`;
  }

  if (category) {
    sql += ` AND category = @category`;
    countSql += ` AND category = @category`;
    params.category = category;
    countParams.category = category;
  }

  sql += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const total = db.prepare(countSql).get(countParams).count;
  const products = db.prepare(sql).all(params);

  res.json({ page, limit, total, products });
});

router.get("/:id", (req, res) => {
  const db = connect();
  const id = Number(req.params.id);

  if (!id) return res.status(400).json({ error: "Invalid product ID" });

  const product = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(id);

  if (!product) return res.status(404).json({ error: "Product not found" });

  res.json({ product });
});

module.exports = router;
