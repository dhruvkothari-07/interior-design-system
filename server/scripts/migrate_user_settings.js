const db = require('../db/db');

async function migrate() {
    try {
        console.log("Starting migration...");
        const query = `
            ALTER TABLE users 
            ADD COLUMN company_name VARCHAR(255), 
            ADD COLUMN company_address TEXT, 
            ADD COLUMN company_email VARCHAR(255), 
            ADD COLUMN company_phone VARCHAR(50), 
            ADD COLUMN default_terms TEXT, 
            ADD COLUMN logo_url TEXT;
        `;
        await db.query(query);
        console.log("Migration successful: Added company columns to users table.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist, skipping migration.");
        } else {
            console.error("Migration failed:", err);
        }
    } finally {
        process.exit(0);
    }
}

migrate();
