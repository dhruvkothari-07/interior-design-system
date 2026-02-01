const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

// GET dashboard statistics
router.get("/dashboard/stats", authMiddleware, async (req, res) => {
    try {
        const { year, month } = req.query;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();
        // If month is 0 or not provided, we consider it "All Year"
        const currentMonth = month ? parseInt(month) : 0;

        // --- TIER 1: FINANCIALS ---

        // 1. Total Revenue YTD (Sum of Approved Quotations this year) - ALWAYS YTD
        const [[revenueYTD]] = await db.query(
            "SELECT SUM(total_amount) as total FROM quotations WHERE status = 'Approved' AND YEAR(updatedAt) = ?",
            [currentYear]
        );

        // 2. Filtered Revenue (Month OR Year based on selection)
        let revenueQuery = "SELECT SUM(total_amount) as total, COUNT(*) as count FROM quotations WHERE status = 'Approved' AND YEAR(updatedAt) = ?";
        let revenueParams = [currentYear];

        if (currentMonth > 0) {
            revenueQuery += " AND MONTH(updatedAt) = ?";
            revenueParams.push(currentMonth);
        }

        const [[filteredRevenue]] = await db.query(revenueQuery, revenueParams);

        // 3. Filtered Operational Expenses
        let expensesQuery = "SELECT SUM(amount) as total FROM expenses WHERE YEAR(expense_date) = ?";
        let expensesParams = [currentYear];

        if (currentMonth > 0) {
            expensesQuery += " AND MONTH(expense_date) = ?";
            expensesParams.push(currentMonth);
        }

        const [[filteredExpenses]] = await db.query(expensesQuery, expensesParams);

        // --- TIER 2: PIPELINE & STATUS DISTRIBUTION ---

        // Pending Quotes (Potential Business)
        const [[pendingQuotes]] = await db.query(
            "SELECT COUNT(*) as count, SUM(total_amount) as total FROM quotations WHERE status = 'Pending'"
        );

        // Status Distribution (Pie Chart) - Count of all statuses
        const [statusCountsRaw] = await db.query(
            "SELECT status, COUNT(*) as count FROM quotations GROUP BY status"
        );

        // Format for Recharts: [{ name: 'Approved', value: 10, fill: '...' }]
        // We'll let frontend handle colors, or send default here
        const statusDistribution = statusCountsRaw.map(s => ({
            name: s.status,
            value: s.count
        }));

        // --- TIER 3: TOP CLIENTS (List) ---
        // Top 5 Clients by Revenue (from Approved projects)
        const [topClientsRaw] = await db.query(
            `SELECT 
                c.id,
                c.name, 
                COUNT(q.id) as deal_count, 
                SUM(q.total_amount) as total_revenue
             FROM clients c
             JOIN quotations q ON c.id = q.client_id
             WHERE q.status = 'Approved'
             GROUP BY c.id
             ORDER BY total_revenue DESC
             LIMIT 5`
        );

        // --- TIER 2.5: REVENUE TREND (Last 6 Months) ---
        const [revenueTrendRaw] = await db.query(
            `SELECT DATE_FORMAT(updatedAt, '%Y-%m') as monthKey, SUM(total_amount) as total
             FROM quotations
             WHERE status = 'Approved' AND updatedAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY monthKey
             ORDER BY monthKey ASC`
        );

        // Fill in missing months with 0
        const revenueTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = d.toLocaleString('default', { month: 'short' });

            const found = revenueTrendRaw.find(r => r.monthKey === monthKey);
            revenueTrend.push({
                month: monthLabel,
                total: found ? Number(found.total) : 0
            });
        }

        // --- TIER 3: PROJECTS LIST & HEALTH ---
        const [projects] = await db.query(
            `SELECT 
                p.id, p.name, p.status, q.total_amount as budget, p.end_date,
                c.name as client_name, 
                COALESCE(SUM(e.amount), 0) as total_spent
            FROM projects p
            JOIN quotations q ON p.quotation_id = q.id
            JOIN clients c ON q.client_id = c.id
            LEFT JOIN expenses e ON p.id = e.project_id
            GROUP BY p.id
            ORDER BY p.createdAt DESC`
        );

        // --- NEW: RECENT ACTIVITY FEED ---
        // Fetch recent items and combine
        const [recentQuotes] = await db.query("SELECT id, client_id, total_amount, status, updatedAt as date, 'Quotation' as type FROM quotations ORDER BY updatedAt DESC LIMIT 5");
        const [recentProjects] = await db.query("SELECT id, name, status, createdAt as date, 'Project' as type FROM projects ORDER BY createdAt DESC LIMIT 5");
        const [recentClients] = await db.query("SELECT id, name, email, createdAt as date, 'Client' as type FROM clients ORDER BY createdAt DESC LIMIT 5");

        // Combine and sort
        const recentActivityRaw = [...recentQuotes, ...recentProjects, ...recentClients]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        // Enhance with Client Names for Quotes if needed (or just send raw and let frontend handle basic display if client name is tricky to join efficiently in one go without complexity. 
        // Actually, for quotes, we usually want Client Name. Let's do a quick enrichment or just fetch it in the initial query.)
        // Let's optimize the quote query to join client name.
        const [recentQuotesWithClient] = await db.query(`
            SELECT q.id, c.name as client_name, q.total_amount, q.status, q.updatedAt as date, 'Quotation' as type 
            FROM quotations q 
            JOIN clients c ON q.client_id = c.id 
            ORDER BY q.updatedAt DESC LIMIT 5
        `);

        // Re-combine with better quote data
        const recentActivity = [...recentQuotesWithClient, ...recentProjects, ...recentClients]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        res.status(200).json({
            financials: {
                revenueYTD: revenueYTD.total || 0,
                revenueMonth: filteredRevenue.total || 0, // This is now 'Filtered Revenue' (Month or Year)
                expensesMonth: filteredExpenses.total || 0, // This is now 'Filtered Expenses'
            },
            pipeline: {
                pendingCount: pendingQuotes.count || 0,
                pendingValue: pendingQuotes.total || 0,
                wonMonthCount: filteredRevenue.count || 0,
                wonMonthValue: filteredRevenue.total || 0,
            },
            statusDistribution,
            topClients: topClientsRaw,
            revenueTrend,
            projects: projects,
            recentActivity // Return the activity feed
        });
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ message: "Server error while fetching dashboard stats" });
    }
});

module.exports = router;