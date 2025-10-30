const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

router.get("/materials", authMiddleware, async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM materials");
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching materials:", err);
        res.status(500).json({ message: "Server error while fetching materials" });
    }
});


router.post("/materials", authMiddleware, async (req, res) => {
    // Include category in destructuring
    const { name, price, unit, category } = req.body;
    if (!name || !price || !unit) {
        return res.status(400).json({ message: "All fields are required" })
    }
    try {
        // Add category to the INSERT statement
        const [result] = await db.query("INSERT INTO materials (name, category, price, unit) VALUES (?, ?, ?, ?)", [name, category, price, unit]);
        
        // Return the full new material object
        const newMaterial = {
            id: result.insertId,
            name,
            category,
            price,
            unit
        };
        res.status(201).json(newMaterial);
    }
    catch (err) {
        console.error("Error while creating material:", err);
        return res.status(500).json({
            message: "Error while creating materials"
        })
    }
});

router.delete("/materials/:id/", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM materials WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Material not found" })
        }
        res.status(200).json({ message: "Material deleted successfully" });

    }
    catch (err) {
        console.error("Error while deleting material:", err);
        return res.status(500).json({
            message: "Error while deleting Material"
        })
    }
})
router.put("/materials/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    // Include category
    const { name, price, unit, category } = req.body
    if (!name || !price || !unit) {
        return res.status(400).json({ message: "All fields are required" });

    }
    try {
        // Add category to the UPDATE statement
        const [update] = await db.query("UPDATE materials SET name = ?, category = ?, price = ?, unit = ? WHERE id = ?", [name, category, price, unit, id]);
        if (update.affectedRows === 0) {
            return res.status(404).json({ message: "Material not found" });
        }

        // Return the full updated material object
        const updatedMaterial = {
            id: parseInt(id, 10), // Ensure id is a number
            name,
            category,
            price,
            unit
        };
        res.status(200).json(updatedMaterial);
    }
    catch (err) {
        console.error("Error while updating material:", err);
        return res.status(500).json({
            message: "Error while updating Material"
        })
    }
})

module.exports = router;