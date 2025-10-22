const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
}).promise();

// Test the connection
db.getConnection()
    .then(() => console.log("✅ Connected to MySQL database"))
    .catch((err) => console.log("❌ Database connection failed:", err.message));

module.exports = db;
