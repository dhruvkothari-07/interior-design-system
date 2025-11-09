const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db/db");

const router = Router();

// GET all projects (for a future list page)
router.get("/projects", authMiddleware, async (req, res) => {
    const { search = '' } = req.query;
    try {
        let query = `
            SELECT 
                p.id, p.name, p.status, p.start_date, p.end_date, p.createdAt,
                q.total_amount as budget, 
                c.name as client_name 
            FROM projects p 
            JOIN quotations q ON p.quotation_id = q.id 
            JOIN clients c ON q.client_id = c.id`;
        
        const params = [];
        if (search) {
            query += ` WHERE p.name LIKE ? OR c.name LIKE ?`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY p.createdAt DESC`;

        const [projects] = await db.query(query, params);
        res.status(200).json(projects);
    } catch (err) {
        console.error("Error fetching projects:", err);
        res.status(500).json({ message: "Server error while fetching projects." });
    }
});
// Check if a project exists for a given quotation
router.get("/projects/by-quotation/:quotationId", authMiddleware, async (req, res) => {
    const { quotationId } = req.params;
    try {
        const [projects] = await db.query("SELECT * FROM projects WHERE quotation_id = ?", [quotationId]);
        if (projects.length > 0) {
            res.status(200).json(projects[0]);
        } else {
            res.status(404).json({ message: "No project found for this quotation." });
        }
    } catch (err) {
        console.error("Error checking for project:", err);
        res.status(500).json({ message: "Server error while checking for project." });
    }
});

// POST - Create a new project from a quotation
router.post("/projects", authMiddleware, async (req, res) => {
    const { quotation_id, start_date, end_date } = req.body;

    if (!quotation_id) {
        return res.status(400).json({ message: "Quotation ID is required." });
    }

    try {
        // 1. Fetch the quotation to get its details
        const [[quotation]] = await db.query("SELECT * FROM quotations WHERE id = ?", [quotation_id]);
        if (!quotation) {
            return res.status(404).json({ message: "Quotation not found." });
        }

        // 2. Check if a project already exists for this quotation
        const [existingProjects] = await db.query("SELECT id FROM projects WHERE quotation_id = ?", [quotation_id]);
        if (existingProjects.length > 0) {
            return res.status(409).json({ message: "A project for this quotation already exists." });
        }

        // 3. Create the new project
        const [result] = await db.query(
            "INSERT INTO projects (quotation_id, name, budget, start_date, end_date) VALUES (?, ?, ?, ?, ?)", 
            [quotation_id, quotation.title, quotation.total_amount, start_date || null, end_date || null]
        );
        
        // Fetch the newly created project with its live budget for the response
        const [[newProject]] = await db.query("SELECT p.*, q.total_amount as budget FROM projects p JOIN quotations q ON p.quotation_id = q.id WHERE p.id = ?", [result.insertId]);
        res.status(201).json(newProject);
    } catch (err) {
        console.error("Error creating project:", err);
        res.status(500).json({ message: "Server error while creating project." });
    }
});

// GET a single project with all its details (tasks, expenses, notes)
router.get("/projects/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch project details along with client info
        // We select q.total_amount and alias it as 'budget'
        const [[project]] = await db.query(
            `SELECT p.*, q.total_amount as budget, c.name as client_name 
             FROM projects p 
             JOIN quotations q ON p.quotation_id = q.id 
             JOIN clients c ON q.client_id = c.id 
             WHERE p.id = ?`, [id]
        );
        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        // Fetch associated data
        const [tasks] = await db.query("SELECT * FROM tasks WHERE project_id = ? ORDER BY createdAt DESC", [id]);
        const [expenses] = await db.query("SELECT * FROM expenses WHERE project_id = ? ORDER BY expense_date DESC", [id]);
        const [notes] = await db.query("SELECT * FROM project_notes WHERE project_id = ? ORDER BY createdAt DESC", [id]);

        res.status(200).json({ ...project, tasks, expenses, notes });
    } catch (err) {
        console.error("Error fetching project details:", err);
        res.status(500).json({ message: "Server error while fetching project details." });
    }
});

// POST a new task to a project
router.post("/projects/:id/tasks", authMiddleware, async (req, res) => {
    const { id: project_id } = req.params;
    const { description } = req.body;
    if (!description) return res.status(400).json({ message: "Task description is required." });

    try {
        const [result] = await db.query("INSERT INTO tasks (project_id, description) VALUES (?, ?)", [project_id, description]);
        const [[newTask]] = await db.query("SELECT * FROM tasks WHERE id = ?", [result.insertId]);
        res.status(201).json(newTask);
    } catch (err) {
        console.error("Error adding task:", err);
        res.status(500).json({ message: "Server error while adding task." });
    }
});

// POST a new expense to a project
router.post("/projects/:id/expenses", authMiddleware, async (req, res) => {
    const { id: project_id } = req.params;
    const { description, amount, category, expense_date } = req.body;
    if (!description || !amount || !expense_date) return res.status(400).json({ message: "Description, amount, and date are required." });

    try {
        const [result] = await db.query(
            "INSERT INTO expenses (project_id, description, amount, category, expense_date) VALUES (?, ?, ?, ?, ?)",
            [project_id, description, amount, category || null, expense_date]
        );
        const [[newExpense]] = await db.query("SELECT * FROM expenses WHERE id = ?", [result.insertId]);
        res.status(201).json(newExpense);
    } catch (err) {
        console.error("Error adding expense:", err);
        res.status(500).json({ message: "Server error while adding expense." });
    }
});

// POST a new note to a project
router.post("/projects/:id/notes", authMiddleware, async (req, res) => {
    const { id: project_id } = req.params;
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: "Note content is required." });

    try {
        const [result] = await db.query("INSERT INTO project_notes (project_id, note) VALUES (?, ?)", [project_id, note]);
        const [[newNote]] = await db.query("SELECT * FROM project_notes WHERE id = ?", [result.insertId]);
        res.status(201).json(newNote);
    } catch (err) {
        console.error("Error adding note:", err);
        res.status(500).json({ message: "Server error while adding note." });
    }
});

// PUT to update a task's status
router.put("/tasks/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required." });

    try {
        await db.query("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);
        res.status(200).json({ message: "Task status updated." });
    } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ message: "Server error while updating task." });
    }
});

// PUT to update a project's status
router.put("/projects/:id/status", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Not Started', 'In Progress', 'On Hold', 'Completed'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "A valid status is required." });
    }

    try {
        const [result] = await db.query("UPDATE projects SET status = ? WHERE id = ?", [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Project not found." });
        }

        res.status(200).json({ message: "Project status updated successfully.", newStatus: status });
    } catch (err) {
        console.error("Error updating project status:", err);
        res.status(500).json({ message: "Server error while updating project status." });
    }
});

module.exports = router;