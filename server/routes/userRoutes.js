const { Router } = require("express");
const express = require("express");
const mysql = require("mysql2")
const bodyparser = require("body-parser")



const router = Router();

export const signup = () => {
    router.post("/signup", async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }
        try {
            const checkUser = "SELECT * FROM users WHERE username = ?";
            const checkingUser = db.query(checkUser, [username], (err, results) => {
                if (err) {
                    return res.status(500).json({ message: "Database error", error: err });
                }
                if (results.length > 0) {
                    return res.json({ message: "User already exist" })
                }
            })

            const createUser = "INSERT INTO users (username,password) VALUES(?,?)";
            const createdUser = db.query(createUser, [username], [password], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Error inserting user", error: err });
                }
            });
            return res.status(201).json({ message: "User registered successfully!", createdUser });
        }
        catch (err) {
            return res.json({
                message: "Error while signup ", err
            })
        }
    })

}
