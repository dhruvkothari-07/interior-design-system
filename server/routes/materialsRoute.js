const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");
const { validate, rules } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = Router();

router.get("/materials", authMiddleware, asyncHandler(async (req, res) => {
    const { search = '' } = req.query;
    let query = "SELECT id, name, category, unit, default_rate as price, default_description FROM catalog_items";
    const params = [];

    if (search) {
        query += " WHERE name LIKE ?";
        params.push(`%${search}%`);
    }
    const [results] = await db.query(query, params);
    res.status(200).json(results);
}));


router.post("/materials", authMiddleware, rules.createMaterial, validate, asyncHandler(async (req, res) => {
    const { name, price, unit, category, default_description } = req.body;

    const [result] = await db.query(
        "INSERT INTO catalog_items (name, category, default_rate, unit, default_description) VALUES (?, ?, ?, ?, ?)",
        [name, category, price, unit, default_description || null]
    );

    const newMaterial = {
        id: result.insertId,
        name,
        category,
        price,
        unit,
        default_description
    };
    res.status(201).json(newMaterial);
}));

router.delete("/materials/:id", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM catalog_items WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Material not found" })
    }
    res.status(200).json({ message: "Material deleted successfully" });
}));

router.put("/materials/:id", authMiddleware, rules.idParam, rules.createMaterial, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, price, unit, category, default_description } = req.body

    const [update] = await db.query(
        "UPDATE catalog_items SET name = ?, category = ?, default_rate = ?, unit = ?, default_description = ? WHERE id = ?",
        [name, category, price, unit, default_description || null, id]
    );

    if (update.affectedRows === 0) {
        return res.status(404).json({ message: "Material not found" });
    }

    const updatedMaterial = {
        id: parseInt(id, 10),
        name,
        category,
        price,
        unit,
        default_description
    };
    res.status(200).json(updatedMaterial);
}));

module.exports = router;