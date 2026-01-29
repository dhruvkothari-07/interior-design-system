const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = Router();
const db = require("../db/db");
const { rateLimit } = require('express-rate-limit');

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

        const hashpass = await bcrypt.hash(password,10);
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
        console.error("Signup Error:", err); // Log the actual error
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
            { id: user.id, username: user.username },
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

module.exports = router; 