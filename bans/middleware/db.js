// db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

// Create a pooled connection to your MySQL instance
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,   // e.g. 'localhost'
  user:     process.env.DB_USER,     // e.g. 'root'
  password: process.env.DB_PASS,     // your DB password
  database: process.env.DB_NAME,     // e.g. 'myapp'
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
