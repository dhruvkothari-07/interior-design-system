const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

// GET all materials for a specific room
router.get("/rooms/:roomId/materials", authMiddleware, async (req, res) => {
    const { roomId } = req.params;
    try {
        const [materials] = await db.query(
            `SELECT 
                rm.id, rm.quantity, rm.notes, 
                m.id as material_id, m.name, m.price, m.unit 
             FROM room_materials rm 
             JOIN materials m ON rm.material_id = m.id 
             WHERE rm.room_id = ?`,
            [roomId]
        );
        res.status(200).json(materials);
    } catch (err) {
        console.error("Error fetching room materials:", err);
        res.status(500).json({ message: "Server error while fetching room materials" });
    }
});

// POST a new material to a specific room
router.post("/rooms/:roomId/materials", authMiddleware, async (req, res) => {
    const { roomId } = req.params;
    const { material_id, quantity, notes } = req.body;

    if (!material_id || !quantity) {
        return res.status(400).json({ message: "Material and quantity are required" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO room_materials (room_id, material_id, quantity, notes) VALUES (?, ?, ?, ?)",
            [roomId, material_id, quantity, notes || null]
        );
        const [[newRoomMaterial]] = await db.query("SELECT rm.id, rm.quantity, rm.notes, m.id as material_id, m.name, m.price, m.unit FROM room_materials rm JOIN materials m ON rm.material_id = m.id WHERE rm.id = ?", [result.insertId]);
        res.status(201).json(newRoomMaterial);
    } catch (err) {
        console.error("Error creating room material:", err);
        res.status(500).json({ message: "Server error while creating room material" });
    }
});

// DELETE a material from a room
router.delete("/room-materials/:id", authMiddleware, async (req, res) => {
    const { id } = req.params; // This is the ID from the room_materials table
    try {
        const [result] = await db.query("DELETE FROM room_materials WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Material entry not found." });
        }

        res.status(200).json({ message: "Material removed from room successfully." });
    } catch (err) {
        console.error("Error deleting room material:", err);
        res.status(500).json({ message: "Server error while deleting room material." });
    }
});

module.exports = router;