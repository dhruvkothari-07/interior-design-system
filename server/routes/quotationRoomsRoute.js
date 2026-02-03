const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");
const { validate, rules } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = Router();

// GET all rooms for a specific quotation
router.get("/quotations/:quotationId/rooms", authMiddleware, asyncHandler(async (req, res) => {
    const { quotationId } = req.params;
    const [rooms] = await db.query(
        `SELECT 
            qr.id, qr.quotation_id, qr.name, qr.length, qr.width, qr.height, qr.notes,
            COALESCE(SUM(ri.total), 0) AS room_total
            FROM rooms qr
            LEFT JOIN room_items ri ON qr.id = ri.room_id
            WHERE qr.quotation_id = ?
            GROUP BY qr.id
            ORDER BY qr.id ASC`,
        [quotationId]
    );
    res.status(200).json(rooms);
}));

// GET a single room by its ID
router.get("/rooms/:id", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [[room]] = await db.query("SELECT * FROM rooms WHERE id = ?", [id]);

    if (!room) {
        return res.status(404).json({ message: "Room not found." });
    }
    res.status(200).json(room);
}));

// POST a new room to a specific quotation
router.post("/quotations/:quotationId/rooms", authMiddleware, rules.createRoom, validate, asyncHandler(async (req, res) => {
    const { quotationId } = req.params;
    const { name, length, width, height, notes } = req.body;

    const [result] = await db.query(
        "INSERT INTO rooms (quotation_id, name, length, width, height, notes) VALUES (?, ?, ?, ?, ?, ?)",
        [quotationId, name, length || 0, width || 0, height || 0, notes || null]
    );

    const [[newRoom]] = await db.query("SELECT * FROM rooms WHERE id = ?", [result.insertId]);
    res.status(201).json(newRoom);
}));

// PUT (update) a room
router.put("/rooms/:id", authMiddleware, rules.idParam, rules.createRoom, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, length, width, height, notes } = req.body;

    const [result] = await db.query(
        "UPDATE rooms SET name = ?, length = ?, width = ?, height = ?, notes = ? WHERE id = ?",
        [name, length || 0, width || 0, height || 0, notes || null, id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Room not found." });
    }

    const [[updatedRoom]] = await db.query("SELECT * FROM rooms WHERE id = ?", [id]);
    res.status(200).json(updatedRoom);
}));

// DELETE a room
router.delete("/rooms/:id", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM rooms WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Room not found." });
    }

    res.status(200).json({ message: "Room deleted successfully." });
}));

module.exports = router;