const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateAdmin() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        await connection.query("UPDATE admins SET password = ? WHERE email = 'admin@example.com'", ['$2b$10$0X9BuyPophhUtlfDvzbgguHxN4DBE3BtVNh2J5iN5gQKl9YG7ijKi']);
        console.log("Admin password updated!");
        await connection.end();
    } catch(err) {
        console.error(err);
    }
}
updateAdmin();
