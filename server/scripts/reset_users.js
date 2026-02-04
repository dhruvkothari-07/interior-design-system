const db = require('../db/db');
const bcrypt = require('bcrypt');

async function resetUsers() {
    try {
        console.log("Starting user cleanup...");

        // 1. Delete all users EXCEPT 'user12'
        const [deleteResult] = await db.query("DELETE FROM users WHERE username != 'user12'");
        console.log(`Deleted ${deleteResult.affectedRows} users.`);

        // 2. Create new 'admin' user
        const username = 'admin';
        const password = 'admin1234';
        const email = 'admin@example.com'; // Default email

        // Check if 'admin' already exists (e.g. if user12 IS admin, or collision)
        const [existing] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

        if (existing.length > 0) {
            console.log(`User '${username}' already exists. Updating password.`);
            const hash = await bcrypt.hash(password, 10);
            await db.query("UPDATE users SET password = ?, role = 'admin' WHERE username = ?", [hash, username]);
        } else {
            console.log(`Creating new user '${username}'...`);
            const hash = await bcrypt.hash(password, 10);
            await db.query(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin')",
                [username, email, hash]
            );
        }

        // 3. Ensure 'user12' is an admin (optional, but safe default for survivors)
        // User request didn't explicitly say change user12's role, but let's leave it as is 
        // effectively, since previous migration set everyone to admin.

        console.log("User cleanup complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error during user cleanup:", err);
        process.exit(1);
    }
}

resetUsers();
