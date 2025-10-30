const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

// GET all rooms for a specific quotation
router.get("/quotations/:quotationId/rooms", authMiddleware, async (req, res) => {
    const { quotationId } = req.params;
    try {
        const [rooms] = await db.query(
            "SELECT * FROM rooms WHERE quotation_id = ? ORDER BY createdAt DESC",
            [quotationId]
        );
        res.status(200).json(rooms);
    } catch (err) {
        console.error("Error fetching quotation rooms:", err);
        res.status(500).json({ message: "Server error while fetching rooms" });
    }
});

// POST a new room to a specific quotation
router.post("/quotations/:quotationId/rooms", authMiddleware, async (req, res) => {
    const { quotationId } = req.params;
    const { name, length, width, height, notes } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Room name is required" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO rooms (quotation_id, name, length, width, height, notes) VALUES (?, ?, ?, ?, ?, ?)",
            [quotationId, name, length || 0, width || 0, height || 0, notes || null]
        );

        const [[newRoom]] = await db.query("SELECT * FROM rooms WHERE id = ?", [result.insertId]);
        res.status(201).json(newRoom);
    } catch (err) {
        console.error("Error creating quotation room:", err);
        res.status(500).json({ message: "Server error while creating room" });
    }
});

// DELETE a room
router.delete("/rooms/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM rooms WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Room not found." });
        }

        res.status(200).json({ message: "Room deleted successfully." });
    } catch (err) {
        console.error("Error deleting room:", err);
        res.status(500).json({ message: "Server error while deleting room." });
    }
});


module.exports = router;