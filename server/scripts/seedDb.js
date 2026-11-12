const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('--- Loading the curated read shelf ---');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'margins_db',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    multipleStatements: true
  });

  try {
    const seedSql = fs.readFileSync(path.join(__dirname, '../seed.sql'), 'utf8');
    await connection.query(seedSql);
    console.log(' Curated shelf updated successfully.');
  } catch (err) {
    console.error(' Error seeding database:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
