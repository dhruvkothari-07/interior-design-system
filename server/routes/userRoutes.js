const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = Router();
const db = require("../db/db");
const { rateLimit } = require('express-rate-limit');
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { sendPasswordResetEmail } = require("../utils/emailService");

// Rate limiter for login: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts, please try again later' }
});

const JWT_SECRET = process.env.JWT_SECRET;

//  SIGNUP
router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const checkUser = "SELECT * FROM users WHERE username = ? OR email = ?";

        const [results] = await db.query(checkUser, [username, email]);

        if (results.length > 0) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashpass = await bcrypt.hash(password, 10);
        const createUser = "INSERT INTO users (username, email, password) VALUES(?,?,?)";

        const [result] = await db.query(createUser, [username, email, hashpass]);

        // Generate token for auto-login
        const token = jwt.sign(
            { id: result.insertId, username: username },
            JWT_SECRET,
            { expiresIn: "5h" }
        );

        return res.status(200).json({
            message: "Signup successful!",
            token: token,
        });
    } catch (err) {
        console.error("Signup Error:", err);
        return res.status(500).json({ message: "Error while signup", error: err.message });
    }
});

// SIGNIN
router.post("/signin", loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const getuser = "SELECT * FROM users WHERE username= ?";
        // Use await, not a callback
        const [result] = await db.query(getuser, [username]);

        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect Credentials" });
        }
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "5h" }
        );
        return res.status(200).json({
            message: "Login successful!",
            token: token,
        });
    } catch (err) {
        console.error("Signin Error:", err);
        return res.status(500).json({ message: "Error while signin", error: err.message });
    }
});

// GET /settings - Fetch current user's company settings
router.get("/settings", authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT company_name, company_address, company_email, company_phone, default_terms, logo_url FROM users WHERE id = ?",
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: "User not found" });
        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching settings:", err);
        res.status(500).json({ message: "Error fetching settings" });
    }
});

// PUT /settings - Update company settings (Admin only)
router.put("/settings", authMiddleware, authMiddleware.requireRole('admin'), upload.single('logo'), async (req, res) => {
    let { company_name, company_address, company_email, company_phone, default_terms, logo_url } = req.body;

    // If file uploaded, use its path (relative to server root)
    if (req.file) {
        // Construct URL assuming server is hosting static /uploads
        // req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename
        // For simplicity, just storing relative path for now, frontend knows to prepend API base or just simple path
        // actually standard is to store full URL or consistent relative path.
        // Let's store '/uploads/filename'
        logo_url = `/uploads/${req.file.filename}`;
    }

    try {
        await db.query(
            `UPDATE users SET 
            company_name = ?, 
            company_address = ?, 
            company_email = ?, 
            company_phone = ?, 
            default_terms = ?, 
            logo_url = ? 
            WHERE id = ?`,
            [company_name, company_address, company_email, company_phone, default_terms, logo_url, req.user.id]
        );
        res.json({ message: "Settings updated successfully", logo_url });
    } catch (err) {
        console.error("Error updating settings:", err);
        res.status(500).json({ message: "Error updating settings" });
    }
});

// --- STAFF MANAGEMENT ROUTES (Admin Only) ---

// GET /staff - List all staff members
router.get("/staff", authMiddleware, authMiddleware.requireRole('admin'), async (req, res) => {
    try {
        // Fetch all users with role 'staff'
        const [staff] = await db.query("SELECT id, username, email, createdAt FROM users WHERE role = 'staff' ORDER BY createdAt DESC");
        res.json(staff);
    } catch (err) {
        console.error("Error fetching staff:", err);
        res.status(500).json({ message: "Error fetching staff list" });
    }
});

// POST /staff - Create a new staff member
router.post("/staff", authMiddleware, authMiddleware.requireRole('admin'), async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const checkUser = "SELECT * FROM users WHERE username = ? OR email = ?";
        const [results] = await db.query(checkUser, [username, email]);
        if (results.length > 0) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashpass = await bcrypt.hash(password, 10);
        // Explicitly set role to 'staff'
        const createUser = "INSERT INTO users (username, email, password, role) VALUES(?,?,?, 'staff')";
        const [result] = await db.query(createUser, [username, email, hashpass]);

        res.status(201).json({ message: "Staff member created successfully", id: result.insertId });
    } catch (err) {
        console.error("Create Staff Error:", err);
        res.status(500).json({ message: "Error creating staff member", error: err.message });
    }
});

// DELETE /staff/:id - Remove a staff member
router.delete("/staff/:id", authMiddleware, authMiddleware.requireRole('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM users WHERE id = ? AND role = 'staff'", [id]);
        res.json({ message: "Staff member removed successfully" });
    } catch (err) {
        console.error("Delete Staff Error:", err);
        res.status(500).json({ message: "Error deleting staff member" });
    }
});

// --- PASSWORD RESET ROUTES (OTP-Based) ---

// Rate limiter for password reset: 3 attempts per 15 minutes
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many password reset attempts, please try again later' }
});

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /forgot-password - Request password reset OTP
router.post("/forgot-password", passwordResetLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        // Check if user exists with this email
        const [users] = await db.query("SELECT id, email FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            // Don't reveal if email exists - always return success for security
            return res.json({ message: "If an account with that email exists, an OTP has been sent.", success: true });
        }

        const user = users[0];

        // Generate 6-digit OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Store OTP in database (using reset_token columns)
        await db.query(
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
            [otp, otpExpires, user.id]
        );

        // Send email with OTP
        const emailResult = await sendPasswordResetEmail(user.email, otp);

        if (!emailResult.success) {
            console.error("Failed to send OTP email:", emailResult.error);
            return res.status(500).json({ message: "Failed to send OTP. Please try again." });
        }

        res.json({ message: "If an account with that email exists, an OTP has been sent.", success: true });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "Error processing request", error: err.message });
    }
});

// POST /verify-otp - Verify the OTP code
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
    }

    try {
        // Find user with valid OTP
        const [users] = await db.query(
            "SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()",
            [email, otp]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // OTP is valid - return success (don't clear token yet, need it for password reset)
        res.json({ message: "OTP verified successfully", verified: true });

    } catch (err) {
        console.error("Verify OTP Error:", err);
        res.status(500).json({ message: "Error verifying OTP", error: err.message });
    }
});

// POST /reset-password - Reset password after OTP verification
router.post("/reset-password", async (req, res) => {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
        return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    try {
        // Find user with valid OTP (verify again for security)
        const [users] = await db.query(
            "SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()",
            [email, otp]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const user = users[0];

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear OTP
        await db.query(
            "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
            [hashedPassword, user.id]
        );

        res.json({ message: "Password reset successful! You can now sign in with your new password." });

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: "Error resetting password", error: err.message });
    }
});

module.exports = router;