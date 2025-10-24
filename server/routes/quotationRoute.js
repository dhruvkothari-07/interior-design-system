const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");
const router = Router();


router.get("/quotations", authMiddleware, async (req, res) => {
    try {
        const [quotations] = await db.query(
            "SELECT * FROM quotations ",
        );
        res.status(200).json(quotations);
    } catch (err) {
        console.error("Error fetching quotations:", err);
        return res.status(500).json({ message: "Server Error while getting quotation" });
    }
});

router.post("/quotations", authMiddleware, async (req, res) => {
    const { status, totalamt, title } = req.body;

    if (!status || !totalamt || !title) {
        return res.status(400).json({ message: "ALL FIELDS ARE REQUIRED" });
    }
    try {
        const [createQuo] = await db.query(
            "INSERT INTO quotations (status, totalamt, title) VALUES (?, ?, ?)",
            [status, totalamt, title]
        );

        res.status(201).json({
            message: "Created a new quotation",
        });
    } catch (err) {
        console.error("Error creating quotation:", err);
        return res.status(500).json({
            message: "Server error while creating quotation"
        });
    }
});

router.put("/quotations/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status, totalamt, title } = req.body;

    if (!status || !totalamt || !title) {
        return res.status(400).json({ message: "ALL FIELDS ARE REQUIRED" });
    }
    try {
        const [updatedQuo] = await db.query(
            "UPDATE quotations SET status = ?, totalamt = ?, title = ? WHERE id = ?",
            [status, totalamt, title, id]
        );
        if (updatedQuo.affectedRows === 0) {
            return res.status(404).json({ message: "Quotation not found or user unauthorized" });
        }

        res.status(200).json({ message: "Updated the quotation" });
    } catch (err) {
        console.error("Error updating quotation:", err);
        return res.status(500).json({
            message: "Server error while updating quotation"
        });
    }
});


router.delete("/quotations/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const [deleteQuotation] = await db.query(
            "DELETE FROM quotations WHERE id = ? ",
            [id]
        );
        if (deleteQuotation.affectedRows === 0) {
            return res.status(404).json({ message: "Quotation not found or user unauthorized" });
        }

        return res.status(200).json({
            message: "Deleted quotation"
        });
    } catch (err) {
        console.error("Error deleting quotation:", err);
        return res.status(500).json({
            message: "Server error while deleting quotation"
        });
    }
});

module.exports = router;