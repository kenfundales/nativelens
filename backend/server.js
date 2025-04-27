require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const port = 5000;

// PostgreSQL Connection to Amazon RDS
const pool = new Pool({
  user: "postgres",
  host: "native-tree-ai-instance.c3wgsu464gn1.ap-southeast-2.rds.amazonaws.com",
  database: "native_tree_ai_db",
  password: "nativetreeaiapp2025",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(cors());
app.use(bodyParser.json());

// 1. Get tree details by ID (for information page)
app.get("/trees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM native_tree_tbl WHERE tree_id = $1",
      [id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send("Tree not found");
    }
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).send("Server error");
  }
});

// 2. Get locations for a specific tree by ID (for map)
app.get("/trees/:id/locations", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM location_tbl WHERE tree_id = $1",
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).send("Server error");
  }
});

// 3. Add a new location for a tree
app.post("/locations", async (req, res) => {
  try {
    const { tree_id, latitude, longitude } = req.body;
    const result = await pool.query(
      "INSERT INTO location_tbl (tree_id, latitude, longitude) VALUES ($1, $2, $3) RETURNING *",
      [tree_id, latitude, longitude]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Insert error:", error);
    res.status(500).send("Server error");
  }
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${port}`);
});
