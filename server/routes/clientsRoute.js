const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

// GET all clients (full details)
router.get("/clients-full", authMiddleware, async (req, res) => {
    try {
        const [clients] = await db.query("SELECT * FROM clients ORDER BY name ASC");
        res.status(200).json(clients);
    } catch (err) {
        console.error("Error fetching clients:", err);
        res.status(500).json({ message: "Server error while fetching clients" });
    }
});

// POST a new client
router.post("/clients", authMiddleware, async (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Client name is required" });
    }
    try {
        const [result] = await db.query(
            "INSERT INTO clients (name, email, phone, address) VALUES (?, ?, ?, ?)",
            [name, email || null, phone || null, address || null]
        );
        const [[newClient]] = await db.query("SELECT * FROM clients WHERE id = ?", [result.insertId]);
        res.status(201).json(newClient);
    } catch (err) {
        console.error("Error creating client:", err);
        res.status(500).json({ message: "Server error while creating client" });
    }
});

// PUT (update) a client
router.put("/clients/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Client name is required" });
    }
    try {
        const [result] = await db.query(
            "UPDATE clients SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?",
            [name, email || null, phone || null, address || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Client not found" });
        }
        const [[updatedClient]] = await db.query("SELECT * FROM clients WHERE id = ?", [id]);
        res.status(200).json(updatedClient);
    } catch (err) {
        console.error("Error updating client:", err);
        res.status(500).json({ message: "Server error while updating client" });
    }
});

// DELETE a client
router.delete("/clients/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM clients WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Client not found" });
        }
        res.status(200).json({ message: "Client deleted successfully" });
    } catch (err) {
        console.error("Error deleting client:", err);
        res.status(500).json({ message: "Server error while deleting client" });
    }
});


module.exports = router;