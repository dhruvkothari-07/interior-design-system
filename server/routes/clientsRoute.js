const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");
const { validate, rules } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = Router();

// GET all clients (full details)
router.get("/clients-full", authMiddleware, asyncHandler(async (req, res) => {
    const { search = '' } = req.query;
    let query = "SELECT * FROM clients";
    const params = [];

    if (search) {
        query += " WHERE name LIKE ?";
        params.push(`%${search}%`);
    }
    query += " ORDER BY name ASC";
    const [clients] = await db.query(query, params);
    res.status(200).json(clients);
}));

// GET a single client with all their details
router.get("/clients/:id/details", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 1. Fetch client details
    const [[client]] = await db.query("SELECT * FROM clients WHERE id = ?", [id]);
    if (!client) {
        return res.status(404).json({ message: "Client not found." });
    }

    // 2. Fetch all quotations for this client
    const [quotations] = await db.query(
        "SELECT id, title, status, total_amount, createdAt FROM quotations WHERE client_id = ? ORDER BY createdAt DESC",
        [id]
    );

    // 3. Fetch all projects for this client
    const [projects] = await db.query(
        `SELECT p.id, p.name, p.status, p.start_date, p.end_date, p.budget 
            FROM projects p
            JOIN quotations q ON p.quotation_id = q.id
            WHERE q.client_id = ? 
            ORDER BY p.createdAt DESC`,
        [id]
    );

    res.status(200).json({ ...client, quotations, projects });
}));

// POST a new client
router.post("/clients", authMiddleware, rules.createClient, validate, asyncHandler(async (req, res) => {
    const { name, email, phone, address } = req.body;

    const [result] = await db.query(
        "INSERT INTO clients (name, email, phone, address) VALUES (?, ?, ?, ?)",
        [name, email || null, phone || null, address || null]
    );

    const [[newClient]] = await db.query("SELECT * FROM clients WHERE id = ?", [result.insertId]);
    res.status(201).json(newClient);
}));

// PUT (update) a client
router.put("/clients/:id", authMiddleware, rules.idParam, rules.createClient, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const [result] = await db.query(
        "UPDATE clients SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?",
        [name, email || null, phone || null, address || null, id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Client not found" });
    }

    const [[updatedClient]] = await db.query("SELECT * FROM clients WHERE id = ?", [id]);
    res.status(200).json(updatedClient);
}));

// DELETE a client
router.delete("/clients/:id", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM clients WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({ message: "Client deleted successfully" });
}));

module.exports = router;