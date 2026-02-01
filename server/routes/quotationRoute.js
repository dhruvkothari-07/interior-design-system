const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");
const router = Router();


router.get("/quotations", authMiddleware, async (req, res) => {
    const { search = '' } = req.query;
    try {
        let query = `
            SELECT 
                q.id, q.title, q.status, q.total_amount, q.createdAt,
                c.id as client_id, c.name as client_name 
             FROM quotations q 
             LEFT JOIN clients c ON q.client_id = c.id
        `;
        const params = [];

        if (search) {
            query += ` WHERE q.title LIKE ? OR c.name LIKE ?`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY q.createdAt DESC`;

        const [quotations] = await db.query(query, params);
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
                q.id, q.title, q.status, q.total_amount, q.labor_cost, q.design_fee_type, q.design_fee_value, q.createdAt, q.updatedAt,
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

// GET company settings (for quotation summary)
router.get("/settings", authMiddleware, async (req, res) => {
    try {
        const [settings] = await db.query("SELECT * FROM settings LIMIT 1");
        // Return the settings or an empty object if not configured yet
        res.status(200).json(settings.length > 0 ? settings[0] : {});
    } catch (err) {
        // If table doesn't exist yet, return empty object to prevent frontend crash
        if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});

        console.error("Error fetching settings:", err);
        return res.status(500).json({ message: "Server Error while getting settings" });
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

router.post("/quotations/:id/duplicate", authMiddleware, async (req, res) => {
    const { id } = req.params; // Source Quotation ID
    const { new_title, new_client_id, new_client_name, new_client_email, new_client_phone, new_client_address } = req.body;

    if (!new_title) {
        return res.status(400).json({ message: "New Quotation Title is required" });
    }

    try {
        // 1. Fetch Source Quotation to get basic details (mostly for fallback or validation)
        const [[sourceQuotation]] = await db.query("SELECT * FROM quotations WHERE id = ?", [id]);
        if (!sourceQuotation) {
            return res.status(404).json({ message: "Source quotation not found" });
        }

        // 2. Create or Find Client
        let finalClientId = null;
        if (new_client_id) {
            // Case A: User selected an existing client explicitly
            finalClientId = new_client_id;
        } else if (new_client_name) {
            // Case B: User entered details for a NEW client
            const [clientResult] = await db.query(
                "INSERT INTO clients (name, email, phone, address) VALUES (?, ?, ?, ?)",
                [new_client_name, new_client_email || null, new_client_phone || null, new_client_address || null]
            );
            finalClientId = clientResult.insertId;
        } else {
            // Case C: No client details provided -> Keep original client
            finalClientId = sourceQuotation.client_id;
        }

        // 3. Create New Quotation
        // We copy over high-level defaults but rely on re-calculation for totals to be safe, though copying total is fine initially.
        const [quotationResult] = await db.query(
            "INSERT INTO quotations (title, client_id, status, total_amount, labor_cost, design_fee_type, design_fee_value) VALUES (?, ?, 'Draft', ?, ?, ?, ?)",
            [new_title, finalClientId, sourceQuotation.total_amount, sourceQuotation.labor_cost, sourceQuotation.design_fee_type, sourceQuotation.design_fee_value]
        );
        const newQuotationId = quotationResult.insertId;

        // 4. Fetch Source Rooms
        const [sourceRooms] = await db.query("SELECT * FROM rooms WHERE quotation_id = ?", [id]);

        // 5. Loop and Copy Rooms & Items
        for (const room of sourceRooms) {
            // Insert New Room
            const [roomResult] = await db.query(
                "INSERT INTO rooms (quotation_id, name, length, width, height, notes, room_total) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [newQuotationId, room.name, room.length, room.width, room.height, room.notes, room.room_total]
            );
            const newRoomId = roomResult.insertId;

            // Fetch Source Items for this Room
            const [sourceItems] = await db.query("SELECT * FROM room_items WHERE room_id = ?", [room.id]);

            // Copy Items
            for (const item of sourceItems) {
                await db.query(
                    "INSERT INTO room_items (room_id, catalog_item_id, description, specification, unit, rate, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [newRoomId, item.catalog_item_id, item.description, item.specification, item.unit, item.rate, item.quantity, item.total]
                );
            }
        }

        // 6. Return the new quotation
        const [[newQuotation]] = await db.query(
            `SELECT 
                q.id, q.title, q.status, q.total_amount, q.createdAt,
                c.id as client_id, c.name as client_name 
             FROM quotations q 
             LEFT JOIN clients c ON q.client_id = c.id
             WHERE q.id = ?`,
            [newQuotationId]
        );

        res.status(201).json(newQuotation);

    } catch (err) {
        console.error("Error duplicating quotation:", err);
        res.status(500).json({ message: "Server error while duplicating quotation" });
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
    const { total_amount, labor_cost, design_fee_type, design_fee_value } = req.body;

    if (total_amount === undefined || total_amount === null) {
        return res.status(400).json({ message: "total_amount is required" });
    }

    try {
        const [result] = await db.query("UPDATE quotations SET total_amount = ?, labor_cost = ?, design_fee_type = ?, design_fee_value = ? WHERE id = ?", [total_amount, labor_cost || 0, design_fee_type || 'percentage', design_fee_value || 0, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Quotation not found" });
        }
        res.status(200).json({ message: "Total amount updated successfully" });
    } catch (err) {
        console.error("Error updating quotation total:", err);
        return res.status(500).json({ message: "Server error while updating total" });
    }
});

// New, focused endpoint to update just the status
router.put("/quotations/:id/status", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    const allowedStatuses = ['Draft', 'Pending', 'Approved', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
    }

    try {
        const [result] = await db.query("UPDATE quotations SET status = ? WHERE id = ?", [status, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Quotation not found" });
        }
        res.status(200).json({ message: "Status updated successfully", newStatus: status });
    } catch (err) {
        console.error("Error updating quotation status:", err);
        return res.status(500).json({ message: "Server error while updating status" });
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