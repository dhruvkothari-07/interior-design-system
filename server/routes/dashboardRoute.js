const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");
const { asyncHandler } = require('../middleware/errorHandler');

const router = Router();

// GET dashboard statistics
router.get("/dashboard/stats", authMiddleware, asyncHandler(async (req, res) => {
    // Accept query params for date filtering (default to current month/year)
    const queryMonth = parseInt(req.query.month);
    const queryYear = parseInt(req.query.year);
    const period = req.query.period || 'month'; // 'month', '3months', '6months', 'year'

    const currentYear = queryYear || new Date().getFullYear();
    const currentMonth = queryMonth || new Date().getMonth() + 1;

    // Calculate date range based on period
    let startDate, endDate;
    const now = new Date();

    if (period === 'year') {
        startDate = `${currentYear}-01-01`;
        endDate = `${currentYear}-12-31`;
    } else if (period === '6months') {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
    } else if (period === '3months') {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        startDate = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
    } else {
        // Default: single month
        startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`;
    }

    // --- TIER 1: FINANCIALS ---

    // 1. Total Revenue YTD (Sum of Approved Quotations this year)
    const [[revenueYTD]] = await db.query(
        "SELECT SUM(total_amount) as total FROM quotations WHERE status = 'Approved' AND YEAR(updatedAt) = ?",
        [currentYear]
    );

    // 2. Booked Revenue for selected period
    const [[revenueMonth]] = await db.query(
        "SELECT SUM(total_amount) as total, COUNT(*) as count FROM quotations WHERE status = 'Approved' AND updatedAt >= ? AND updatedAt <= ?",
        [startDate, endDate]
    );

    // 3. Operational Expenses for selected period
    const [[expensesMonth]] = await db.query(
        "SELECT SUM(amount) as total FROM expenses WHERE expense_date >= ? AND expense_date <= ?",
        [startDate, endDate]
    );

    // --- TIER 2: PIPELINE ---

    // Pending Quotes (Potential Business)
    const [[pendingQuotes]] = await db.query(
        "SELECT COUNT(*) as count, SUM(total_amount) as total FROM quotations WHERE status = 'Pending'"
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

    // --- TIER 2.6: CASHFLOW TREND (Revenue - Expenses per month, last 6 months) ---
    const [expensesTrendRaw] = await db.query(
        `SELECT DATE_FORMAT(expense_date, '%Y-%m') as monthKey, SUM(amount) as total
            FROM expenses
            WHERE expense_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY monthKey
            ORDER BY monthKey ASC`
    );

    // Calculate net cashflow per month
    const cashflowTrend = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleString('default', { month: 'short' });

        const revenue = revenueTrendRaw.find(r => r.monthKey === monthKey);
        const expenses = expensesTrendRaw.find(e => e.monthKey === monthKey);

        const netFlow = (revenue ? Number(revenue.total) : 0) - (expenses ? Number(expenses.total) : 0);
        cashflowTrend.push({
            month: monthLabel,
            total: netFlow
        });
    }

    // --- TIER 3: PROJECTS LIST & HEALTH ---
    const [projects] = await db.query(
        `SELECT 
            p.id, p.name, p.status, p.budget,
            c.name as client_name, 
            COALESCE(SUM(e.amount), 0) as total_spent
        FROM projects p
        JOIN quotations q ON p.quotation_id = q.id
        JOIN clients c ON q.client_id = c.id
        LEFT JOIN expenses e ON p.id = e.project_id
        GROUP BY p.id
        ORDER BY p.createdAt DESC`
    );

    // --- TIER 4: RECENT ACTIVITY (Admin Only Data Source) ---
    // Fetch recent 5 items from key tables to synthesize an activity feed

    // 1. Recent Quotes
    const [recentQuotes] = await db.query(
        `SELECT q.id, c.name as client_name, q.status, q.updatedAt as timestamp 
         FROM quotations q 
         JOIN clients c ON q.client_id = c.id 
         ORDER BY q.updatedAt DESC LIMIT 5`
    );

    // 2. Recent Projects
    const [recentProjects] = await db.query(
        `SELECT id, name, status, updatedAt as timestamp 
         FROM projects 
         ORDER BY updatedAt DESC LIMIT 5`
    );

    // 3. Recent Expenses (Joined with Projects for context)
    const [recentExpenses] = await db.query(
        `SELECT e.id, e.description, e.amount, e.expense_date as timestamp, p.name as project_name 
         FROM expenses e
         LEFT JOIN projects p ON e.project_id = p.id
         ORDER BY e.expense_date DESC LIMIT 5`
    );

    // Combine and sort
    const combinedActivity = [
        ...recentQuotes.map(q => ({
            id: `q-${q.id}`,
            type: 'quotation',
            description: `Quote for ${q.client_name}`,
            meta: q.status,
            timestamp: new Date(q.timestamp),
            link: '/quotations'
        })),
        ...recentProjects.map(p => ({
            id: `p-${p.id}`,
            type: 'project',
            description: `Project: ${p.name}`,
            meta: p.status,
            timestamp: new Date(p.timestamp),
            link: `/projects/${p.id}`
        })),
        ...recentExpenses.map(e => ({
            id: `e-${e.id}`,
            type: 'expense',
            description: e.project_name ? `${e.description} (${e.project_name})` : e.description,
            meta: e.amount,
            timestamp: new Date(e.timestamp),
            link: e.project_name ? `/projects` : '/dashboard'
        }))
    ];

    // Sort by timestamp descending and take top 10
    const recentActivity = combinedActivity
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

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
        revenueTrend,
        cashflowTrend,
        projects: projects,
        recentActivity
    });
}));

module.exports = router;