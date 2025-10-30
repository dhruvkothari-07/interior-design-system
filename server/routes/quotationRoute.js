const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");
const router = Router();


router.get("/quotations", authMiddleware, async (req, res) => {
    try {
        // JOIN with the clients table to get the client's name
        const [quotations] = await db.query(
            `SELECT 
                q.id, q.title, q.status, q.total_amount, q.createdAt,
                c.id as client_id, c.name as client_name 
             FROM quotations q 
             LEFT JOIN clients c ON q.client_id = c.id
             ORDER BY q.createdAt DESC`
        );
        res.status(200).json(quotations);
    } catch (err) {
        console.error("Error fetching quotations:", err);
        return res.status(500).json({ message: "Server Error while getting quotation" });
    }
});

router.get("/quotations/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const [quotation] = await db.query(
            `SELECT 
                q.id, q.title, q.status, q.total_amount, q.createdAt, q.updatedAt,
                c.id as client_id, c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address
             FROM quotations q 
             LEFT JOIN clients c ON q.client_id = c.id
             WHERE q.id = ?`,
            [id]
        );
        if (quotation.length === 0) {
            return res.status(404).json({ message: "Quotation not found" });
        }
        res.status(200).json(quotation[0]);
    } catch (err) {
        console.error("Error fetching single quotation:", err);
        return res.status(500).json({ message: "Server Error while getting quotation" });
    }
});

router.get("/clients", authMiddleware, async (req, res) => {
    try {
        const [clients] = await db.query(
            "SELECT id, name FROM clients ORDER BY name ASC"
        );
        res.status(200).json(clients);
    } catch (err) {
        console.error("Error fetching clients:", err);
        return res.status(500).json({ message: "Server Error while getting clients" });
    }
});



router.post("/quotations", authMiddleware, async (req, res) => {
    // Receive title and all client details from the frontend
    const { title, client_id, client_name, client_email, client_phone, client_address } = req.body;

    if (!title) {
        return res.status(400).json({ message: "Quotation Title is required" });
    }
    if (!client_id && !client_name) {
        return res.status(400).json({ message: "Either Client ID or Client Name is required" });
    }
    try {
        let finalClientId = client_id;

        // If client_id is not provided, create a new client
        if (!finalClientId) {
            const [clientResult] = await db.query(
                "INSERT INTO clients (name, email, phone, address) VALUES (?, ?, ?, ?)",
                [client_name, client_email || null, client_phone || null, client_address || null]
            );
            finalClientId = clientResult.insertId;
        } else {
            // Ensure the provided client_id actually exists
            const [existingClient] = await db.query("SELECT id FROM clients WHERE id = ?", [finalClientId]);
            if (existingClient.length === 0) return res.status(404).json({ message: "Selected client not found" });
        }

        const [quotationResult] = await db.query(
            "INSERT INTO quotations (title, client_id) VALUES (?, ?)",
            [title, finalClientId]
        );

        // Fetch and return the newly created quotation object for a better UX
        // We re-fetch it using the same JOIN as our GET endpoint for consistency
        const [[newQuotation]] = await db.query(
            `SELECT 
                q.id, q.title, q.status, q.total_amount, q.createdAt,
                c.id as client_id, c.name as client_name 
             FROM quotations q 
             LEFT JOIN clients c ON q.client_id = c.id
             WHERE q.id = ?`,
            [quotationResult.insertId]
        );
        res.status(201).json(newQuotation);
    } catch (err) {
        console.error("Error creating quotation:", err);
        return res.status(500).json({
            message: "Server error while creating quotation"
        });
    }
});

router.put("/quotations/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    // Match the keys sent from the frontend
    const { title, client_name, total_amount, status } = req.body;

    if (!title || !status) {
        return res.status(400).json({ message: "Title and status are required" });
    }
    try {
        const [updatedQuo] = await db.query(
            "UPDATE quotations SET title = ?, client_name = ?, total_amount = ?, status = ? WHERE id = ?",
            [title, client_name || null, total_amount || null, status, id]
        );
        if (updatedQuo.affectedRows === 0) {
            return res.status(404).json({ message: "Quotation not found or user unauthorized" });
        }

        // Fetch and return the updated quotation
        const [[updatedQuotation]] = await db.query("SELECT * FROM quotations WHERE id = ?", [id]);
        res.status(200).json(updatedQuotation);
    } catch (err) {
        console.error("Error updating quotation:", err);
        return res.status(500).json({
            message: "Server error while updating quotation"
        });
    }
});

// New, focused endpoint to update just the total amount
router.put("/quotations/:id/total", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { total_amount } = req.body;

    if (total_amount === undefined || total_amount === null) {
        return res.status(400).json({ message: "total_amount is required" });
    }

    try {
        const [result] = await db.query("UPDATE quotations SET total_amount = ? WHERE id = ?", [total_amount, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Quotation not found" });
        }
        res.status(200).json({ message: "Total amount updated successfully" });
    } catch (err) {
        console.error("Error updating quotation total:", err);
        return res.status(500).json({ message: "Server error while updating total" });
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