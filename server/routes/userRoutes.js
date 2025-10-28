const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = Router();
const db = require("../db/db");

const JWT_SECRET = process.env.JWT_SECRET;

// SIGNUP
router.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const checkUser = "SELECT * FROM users WHERE username = ?";
        const [results] = await db.query(checkUser, [username]);

        if (results.length > 0) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashpass = await bcrypt.hash(password, 10);
        const createUser = "INSERT INTO users (username, password) VALUES(?,?)";

        await db.query(createUser, [username, hashpass]);

        return res.status(200).json({
            message: "Signup successful!",
        });

    } catch (err) {
        console.error("Signup Error:", err); 
        return res.status(500).json({ message: "Error while signup", error: err.message });
    }
});

// SIGNIN
router.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const getuser = "SELECT * FROM users WHERE username = ?";
       
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