const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = Router();
const db = require("../db/db");
const { rateLimit } = require('express-rate-limit');
const { validate, rules } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Rate limiter for login: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts, please try again later' }
});

const JWT_SECRET = process.env.JWT_SECRET;

// SIGNUP
router.post("/signup", rules.signup, validate, asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const [results] = await db.query(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        [username, email]
    );

    if (results.length > 0) {
        return res.status(409).json({ message: "User already exists" });
    }

    const hashpass = await bcrypt.hash(password, 12);
    const [result] = await db.query(
        "INSERT INTO users (username, email, password) VALUES(?,?,?)",
        [username, email, hashpass]
    );

    const token = jwt.sign(
        { id: result.insertId, username },
        JWT_SECRET,
        { expiresIn: "5h" }
    );

    res.status(201).json({ message: "Signup successful!", token });
}));

// SIGNIN
router.post("/signin", loginLimiter, rules.signin, validate, asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const [result] = await db.query(
        "SELECT id, username, password FROM users WHERE username = ?",
        [username]
    );

    if (result.length === 0) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "5h" }
    );

    res.json({ message: "Login successful!", token });
}));

module.exports = router;