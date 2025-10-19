const db = mysql.createConnection({
    host: "localhost",
    user: "root",         // your MySQL username
    password: "",         // your MySQL password
    database: "testdb"    // your database name
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("✅ Connected to MySQL");
    }
});