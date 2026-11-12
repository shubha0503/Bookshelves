const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('--- Initializing Margins Database Schema ---');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    multipleStatements: true
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    await connection.query(schemaSql);
    console.log(' Schema applied successfully!');
  } catch (err) {
    console.error(' Error initializing database:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
