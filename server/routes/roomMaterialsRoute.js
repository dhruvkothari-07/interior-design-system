const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

// Helper function to update room and quotation totals
async function updateRoomAndQuotationTotals(roomId) {
    // 1. Recalculate room_total
    const [[roomTotalResult]] = await db.query(
        `SELECT COALESCE(SUM(total), 0) AS calculated_room_total
         FROM room_items
         WHERE room_id = ?`,
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
                id, catalog_item_id as material_id, description as name, specification, unit, rate as price, quantity, total
             FROM room_items
             WHERE room_id = ?`,
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
    const { material_id, quantity, description, unit, rate, specification, saveToCatalog } = req.body;

    if (!quantity) return res.status(400).json({ message: "Quantity is required" });

    try {
        let finalDescription, finalUnit, finalRate, finalSpec, finalCatalogId = material_id;

        if (material_id) {
            // Prevent duplicate catalog items in the same room
            const [existing] = await db.query("SELECT id FROM room_items WHERE room_id = ? AND catalog_item_id = ?", [roomId, material_id]);
            if (existing.length > 0) {
                return res.status(409).json({ message: "Item already exists in this room" });
            }

            const [[catalogItem]] = await db.query("SELECT * FROM catalog_items WHERE id = ?", [material_id]);
            if (!catalogItem) return res.status(404).json({ message: "Catalog item not found" });
            finalDescription = catalogItem.name;
            finalUnit = catalogItem.unit;
            finalRate = catalogItem.default_rate;
            finalSpec = catalogItem.default_description;
        } else {
            if (!description || rate === undefined || !unit) {
                return res.status(400).json({ message: "Description, unit, and rate are required for custom items" });
            }
            finalDescription = description;
            finalUnit = unit;
            finalRate = rate;
            finalSpec = specification;

            if (saveToCatalog) {
                const [catResult] = await db.query(
                    "INSERT INTO catalog_items (name, unit, default_rate, category, default_description) VALUES (?, ?, ?, ?, ?)",
                    [description, unit, rate, 'Custom', specification || null]
                );
                finalCatalogId = catResult.insertId;
            }
        }

        const total = quantity * finalRate;

        const [result] = await db.query(
            "INSERT INTO room_items (room_id, catalog_item_id, description, specification, unit, rate, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [roomId, finalCatalogId || null, finalDescription, finalSpec || null, finalUnit, finalRate, quantity, total]
        );
        
        const [[newRoomMaterial]] = await db.query(
            "SELECT id, catalog_item_id as material_id, description as name, specification, unit, rate as price, quantity, total FROM room_items WHERE id = ?", 
            [result.insertId]
        );
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
    const { id } = req.params;
    const { quantity, rate, description, specification } = req.body;

    if (quantity !== undefined && Number(quantity) <= 0) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    try {
        // Fetch current values to handle partial updates and recalculate total
        const [[item]] = await db.query("SELECT * FROM room_items WHERE id = ?", [id]);
        if (!item) return res.status(404).json({ message: "Item not found" });

        const finalQty = quantity !== undefined ? quantity : item.quantity;
        const finalRate = rate !== undefined ? rate : item.rate;
        const finalDesc = description !== undefined ? description : item.description;
        const finalSpec = specification !== undefined ? specification : item.specification;

        const newTotal = finalQty * finalRate;

        const [result] = await db.query(
            "UPDATE room_items SET quantity = ?, rate = ?, description = ?, specification = ?, total = ? WHERE id = ?",
            [finalQty, finalRate, finalDesc, finalSpec, newTotal, id]
        );

        const [[updatedRoomMaterial]] = await db.query(
            "SELECT id, catalog_item_id as material_id, description as name, specification, unit, rate as price, quantity, total, room_id FROM room_items WHERE id = ?", 
            [id]
        );
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
    const { id } = req.params;
    try {
        // Get room_id before deletion
        const [[item]] = await db.query("SELECT room_id FROM room_items WHERE id = ?", [id]);
        
        const [result] = await db.query("DELETE FROM room_items WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Item not found." });
        }

        res.status(200).json({ message: "Item removed from room successfully." });

        if (item) await updateRoomAndQuotationTotals(item.room_id);
    } catch (err) {
        console.error("Error deleting room material:", err);
        res.status(500).json({ message: "Server error while deleting room material." });
    }
});

module.exports = router;