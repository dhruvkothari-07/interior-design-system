const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user:  process.env.DB_USER,         // your MySQL username
    password:  process.env.password,         // your MySQL password
    database:  process.env.DB_NAME    // your database name
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("✅ Connected to MySQL");
    }
});

module.exports = db; 