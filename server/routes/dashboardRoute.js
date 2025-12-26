const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

// GET dashboard statistics
router.get("/dashboard/stats", authMiddleware, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // --- TIER 1: FINANCIALS ---
        
        // 1. Total Revenue YTD (Sum of Approved Quotations this year)
        const [[revenueYTD]] = await db.query(
            "SELECT SUM(total_amount) as total FROM quotations WHERE status = 'Approved' AND YEAR(updatedAt) = ?",
            [currentYear]
        );

        // 2. Booked Revenue This Month (Approved Quotations this month)
        const [[revenueMonth]] = await db.query(
            "SELECT SUM(total_amount) as total, COUNT(*) as count FROM quotations WHERE status = 'Approved' AND MONTH(updatedAt) = ? AND YEAR(updatedAt) = ?",
            [currentMonth, currentYear]
        );

        // 3. Operational Expenses This Month
        const [[expensesMonth]] = await db.query(
            "SELECT SUM(amount) as total FROM expenses WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ?",
            [currentMonth, currentYear]
        );

        // --- TIER 2: PIPELINE ---
        
        // Pending Quotes (Potential Business)
        const [[pendingQuotes]] = await db.query(
            "SELECT COUNT(*) as count, SUM(total_amount) as total FROM quotations WHERE status = 'Pending'"
        );

        // --- TIER 3: PROJECTS LIST & HEALTH ---
        const [projects] = await db.query(
            `SELECT 
                p.id, p.name, p.status, p.budget,
                c.name as client_name,
                COALESCE((SELECT SUM(amount) FROM expenses WHERE project_id = p.id), 0) as total_spent
            FROM projects p
            JOIN quotations q ON p.quotation_id = q.id
            JOIN clients c ON q.client_id = c.id
            ORDER BY p.createdAt DESC`
        );

        res.status(200).json({
            financials: {
                revenueYTD: revenueYTD.total || 0,
                revenueMonth: revenueMonth.total || 0,
                expensesMonth: expensesMonth.total || 0,
            },
            pipeline: {
                pendingCount: pendingQuotes.count || 0,
                pendingValue: pendingQuotes.total || 0,
                wonMonthCount: revenueMonth.count || 0,
                wonMonthValue: revenueMonth.total || 0,
            },
            projects: projects
        });
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ message: "Server error while fetching dashboard stats" });
    }
});

module.exports = router;