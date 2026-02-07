const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");
const { validate, rules } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = Router();


router.get("/quotations", authMiddleware, asyncHandler(async (req, res) => {
    const { search = '' } = req.query;
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
}));

router.get("/quotations/:id", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
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
}));

router.get("/clients", authMiddleware, asyncHandler(async (req, res) => {
    const [clients] = await db.query("SELECT id, name FROM clients ORDER BY name ASC");
    res.status(200).json(clients);
}));

// GET company settings (for quotation summary)
router.get("/settings", authMiddleware, asyncHandler(async (req, res) => {
    try {
        const [settings] = await db.query("SELECT * FROM settings LIMIT 1");
        res.status(200).json(settings.length > 0 ? settings[0] : {});
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
        throw err;
    }
}));


router.post("/quotations", authMiddleware, rules.createQuotation, validate, asyncHandler(async (req, res) => {
    const { title, client_id, client_name, client_email, client_phone, client_address } = req.body;

    let finalClientId = client_id;

    // If client_id is not provided, create a new client
    if (!finalClientId) {
        if (!client_name) {
            return res.status(400).json({ message: "Client name is required if selecting new client" });
        }
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
}));

router.put("/quotations/:id", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, client_name, total_amount, status } = req.body;

    if (!title || !status) {
        return res.status(400).json({ message: "Title and status are required" });
    }

    const [updatedQuo] = await db.query(
        "UPDATE quotations SET title = ?, client_name = ?, total_amount = ?, status = ? WHERE id = ?",
        [title, client_name || null, total_amount || null, status, id]
    );
    if (updatedQuo.affectedRows === 0) {
        return res.status(404).json({ message: "Quotation not found" });
    }

    const [[updatedQuotation]] = await db.query("SELECT * FROM quotations WHERE id = ?", [id]);
    res.status(200).json(updatedQuotation);
}));

// Update total endpoint
router.put("/quotations/:id/total", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { total_amount, labor_cost, design_fee_type, design_fee_value } = req.body;

    if (total_amount === undefined || total_amount === null) {
        return res.status(400).json({ message: "total_amount is required" });
    }

    const [result] = await db.query(
        "UPDATE quotations SET total_amount = ?, labor_cost = ?, design_fee_type = ?, design_fee_value = ? WHERE id = ?",
        [total_amount, labor_cost || 0, design_fee_type || 'percentage', design_fee_value || 0, id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Quotation not found" });
    }
    res.status(200).json({ message: "Total amount updated successfully" });
}));

// Update status endpoint
router.put("/quotations/:id/status", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: "Status is required" });

    const allowedStatuses = ['Draft', 'Pending', 'Approved', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
    }

    const [result] = await db.query("UPDATE quotations SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Quotation not found" });
    }
    res.status(200).json({ message: "Status updated successfully", newStatus: status });
}));


router.delete("/quotations/:id", authMiddleware, rules.idParam, validate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 1. Role Check
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    // 2. First check if it exists
    const [exists] = await db.query("SELECT id FROM quotations WHERE id = ?", [id]);
    if (exists.length === 0) return res.status(404).json({ message: "Quotation not found" });

    // 3. Check for linked Projects (Integrity Check)
    const [linkedProject] = await db.query("SELECT id FROM projects WHERE quotation_id = ?", [id]);
    if (linkedProject.length > 0) {
        return res.status(409).json({
            message: "Cannot delete quotation because it has an associated project. Please delete the project first."
        });
    }

    await db.query("DELETE FROM quotations WHERE id = ? ", [id]);
    res.status(200).json({ message: "Deleted quotation" });
}));

module.exports = router;