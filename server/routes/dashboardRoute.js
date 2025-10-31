const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

// GET dashboard statistics
router.get("/dashboard/stats", authMiddleware, async (req, res) => {
    try {
        // Get total counts
        const [[quotationCount]] = await db.query("SELECT COUNT(*) as count FROM quotations");
        const [[materialCount]] = await db.query("SELECT COUNT(*) as count FROM materials");
        const [[clientCount]] = await db.query("SELECT COUNT(*) as count FROM clients");
        const [[approvedRevenue]] = await db.query(
            "SELECT SUM(total_amount) as total FROM quotations WHERE status = 'Approved'"
        );

        // Get quotation counts by status
        const [statusCounts] = await db.query(
            "SELECT status, COUNT(*) as count FROM quotations GROUP BY status"
        );

        // Get 5 most recent quotations
        const [recentQuotations] = await db.query(
            "SELECT id, title, status, createdAt FROM quotations ORDER BY createdAt DESC LIMIT 5"
        );

        res.status(200).json({
            totalQuotations: quotationCount.count,
            totalMaterials: materialCount.count,
            totalClients: clientCount.count,
            approvedRevenue: approvedRevenue.total || 0,
            quotationStatusCounts: statusCounts,
            recentQuotations: recentQuotations,
        });
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ message: "Server error while fetching dashboard stats" });
    }
});

module.exports = router;