const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        const sql = fs.readFileSync('database.sql', 'utf8');
        await connection.query(sql);
        console.log('Database setup successful');
        await connection.end();
    } catch (err) {
        console.error('Error setting up database:', err);
    }
}
setup();
