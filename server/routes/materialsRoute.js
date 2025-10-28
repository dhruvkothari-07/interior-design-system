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
    const { name, quantity, unit } = req.body;
    if (!name || !quantity || !unit) {
        return res.status(400).json({ message: "All fields are required" })
    }
    try {
        const [createMaterial] = await db.query("INSERT INTO materials (name,quantity,unit) VALUES (?,?,?)", [name, quantity, unit]);
        res.status(201).json({
            message: "Material added successfully",
            data: createMaterial.insertId
        });

    }
    catch (err) {
        return res.status(500).json({
            message: "Error while creating materials"
        })

    }
});

router.delete("/materials/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM materials WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Material not found" })
        }
        res.status(200).json({ message: "Material deleted successfully" });

    }
    catch (err) {
        return res.status(500).json({
            message: "Error while deleting Material"
        })
    }
})
router.put("/materials/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, quantity, unit } = req.body
    if (!name || !quantity || !unit) {
        return res.status(400).json({ message: "All fields are required" });

    }
    try {
        const [update] = await db.query("UPDATE  materials SET name = ? ,quantity = ? , unit =? WHERE id =?", [name, quantity, unit, id]);
        if (update.affectedRows === 0) {
            return res.status(404).json({ message: "Material not found" });
        }

        res.status(200).json({ message: "Material updated successfully" });


    }
    catch (err) {
        console.error("Error while updating material:", err);
        return res.status(500).json({
            message: "Error while updating Material"
        })
    }
})

module.exports = router;