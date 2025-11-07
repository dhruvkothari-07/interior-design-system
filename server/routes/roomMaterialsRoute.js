const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

// Helper function to update room and quotation totals
async function updateRoomAndQuotationTotals(roomId) {
    // 1. Recalculate room_total
    const [[roomTotalResult]] = await db.query(
        `SELECT COALESCE(SUM(rm.quantity * m.price), 0) AS calculated_room_total
         FROM room_materials rm
         JOIN materials m ON rm.material_id = m.id
         WHERE rm.room_id = ?`,
        [roomId]
    );
    const newRoomTotal = roomTotalResult.calculated_room_total;

    // 2. Update room_total in rooms table
    await db.query(
        `UPDATE rooms SET room_total = ? WHERE id = ?`,
        [newRoomTotal, roomId]
    );

    // 3. Get parent quotation_id
    const [[room]] = await db.query(`SELECT quotation_id FROM rooms WHERE id = ?`, [roomId]);
    if (!room) return; // Room not found, cannot update quotation

    const quotationId = room.quotation_id;

    // 4. Recalculate quotation total_amount
    const [[quotationTotalResult]] = await db.query(
        `SELECT COALESCE(SUM(room_total), 0) AS calculated_quotation_total
         FROM rooms
         WHERE quotation_id = ?`,
        [quotationId]
    );
    const newQuotationTotal = quotationTotalResult.calculated_quotation_total;

    // 5. Update total_amount in quotations table
    await db.query(
        `UPDATE quotations SET total_amount = ? WHERE id = ?`,
        [newQuotationTotal, quotationId]
    );
}

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

        // Recalculate and update totals after adding material
        await updateRoomAndQuotationTotals(roomId);
    } catch (err) {
        console.error("Error creating room material:", err);
        res.status(500).json({ message: "Server error while creating room material" });
    }
});

// PUT (update) a material in a room
router.put("/room-materials/:id", authMiddleware, async (req, res) => {
    const { id } = req.params; // This is the ID from the room_materials table
    const { quantity } = req.body;

    if (quantity === undefined) {
        return res.status(400).json({ message: "Quantity is required" });
    }
    if (Number(quantity) <= 0) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    try {
        const [result] = await db.query(
            "UPDATE room_materials SET quantity = ? WHERE id = ?",
            [quantity, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Material entry not found." });
        }
        const [[updatedRoomMaterial]] = await db.query("SELECT rm.id, rm.quantity, rm.notes, m.id as material_id, m.name, m.price, m.unit FROM room_materials rm JOIN materials m ON rm.material_id = m.id WHERE rm.id = ?", [id]);
        res.status(200).json(updatedRoomMaterial);

        // Recalculate and update totals after updating material
        await updateRoomAndQuotationTotals(updatedRoomMaterial.room_id); // Assuming room_id is part of updatedRoomMaterial
    } catch (err) {
        console.error("Error updating room material:", err);
        res.status(500).json({ message: "Server error while updating room material." });
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

        // Recalculate and update totals after deleting material
        const [[deletedMaterialInfo]] = await db.query("SELECT room_id FROM room_materials WHERE id = ?", [id]); // Get room_id before deletion
        if (deletedMaterialInfo) await updateRoomAndQuotationTotals(deletedMaterialInfo.room_id);
    } catch (err) {
        console.error("Error deleting room material:", err);
        res.status(500).json({ message: "Server error while deleting room material." });
    }
});

module.exports = router;