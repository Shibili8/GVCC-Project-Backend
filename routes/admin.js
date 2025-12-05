const express = require("express");
const router = express.Router();
const { connect } = require("../db/db");

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "mysecureadmintoken123";

function authAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized admin access" });
  }
  next();
}

// GET /api/admin/enquiries
router.get("/enquiries", authAdmin, (req, res) => {
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

  res.json({
    total: enquiries.length,
    enquiries,
  });
});

module.exports = router;
