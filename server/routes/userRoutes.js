const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const router = Router();
const db = require("../db/db")

const JWT_SECRET = process.env.JWT_SECRET;

// SIGNUP
router.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const checkUser = "SELECT * FROM users WHERE username = ?";
        db.query(checkUser, [username], async (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Database error", error: err });
            }

            if (results.length > 0) {
                return res.status(409).json({ message: "User already exists" });
            }

            const hashpass = await bcrypt.hash(password, 10);
            const createUser = "INSERT INTO users (username,password) VALUES(?,?)";

            db.query(createUser, [username, hashpass], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Error inserting user", error: err });
                }
                return res.status(201).json({ message: "User registered successfully!" });
            });
        });
    } catch (err) {
        return res.status(500).json({ message: "Error while signup", error: err });
    }
});

// SIGNIN
router.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const getuser = "SELECT * FROM users WHERE username= ?";
        db.query(getuser, [username], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database error", err });
            }

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
        });
    } catch (err) {
        return res.status(500).json({ message: "Error while signin", error: err });
    }
});

module.exports = router;
