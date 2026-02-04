const db = require('../db/db');

async function addCreatedAtColumn() {
    try {
        console.log("Checking for 'createdAt' column in 'users' table...");

        // Check if column exists
        const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'createdAt'");

        if (columns.length === 0) {
            console.log("Column 'createdAt' missing. Adding it now...");
            await db.query("ALTER TABLE users ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            console.log("✅ Column 'createdAt' added successfully.");
        } else {
            console.log("ℹ️ Column 'createdAt' already exists.");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Error modifying table:", err);
        process.exit(1);
    }
}

addCreatedAtColumn();
