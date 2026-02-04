const db = require('../db/db');

async function migrate() {
    try {
        console.log("Starting migration: Add 'role' column to users table...");

        // 1. Check if column exists
        const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'role'");
        if (columns.length > 0) {
            console.log("Column 'role' already exists. Skipping ADD COLUMN.");
        } else {
            // 2. Add column
            await db.query("ALTER TABLE users ADD COLUMN role ENUM('admin', 'staff') DEFAULT 'staff'");
            console.log("Column 'role' added successfully.");
        }

        // 3. Set existing users to 'admin' (assuming current users are owners)
        // This ensures no one gets locked out during transition.
        const [result] = await db.query("UPDATE users SET role = 'admin' WHERE role IS NULL OR role = '' OR role = 'staff'");
        console.log(`Updated ${result.affectedRows} users to 'admin' role (migration safety).`);

        console.log("Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
