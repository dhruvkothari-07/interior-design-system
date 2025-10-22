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


router.post("/material", authMiddleware, async (req, res) => {
    const { name, quantity, unit } = req.body;
    if (!name || !quantity || !unit) {
        return res.status(400).json({ message: "All fields are required" })
    }
    try {
        const [createMaterial] = await db.query("INSERT INTO materials (name,quantity,unit), VALUES (?,?,?)", [name, quantity, unit]);
        res.status(201).json({
            message: "Material added successfully",
            data: createMaterial
        });

    }
    catch (err) {
        return res.status(500).json({
            message: "Error while creating materials"
        })

    }
});
