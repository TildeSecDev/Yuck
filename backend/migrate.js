const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_DIR = path.join(__dirname,'database');
if(!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, {recursive:true});
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR,'yuck.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    ip TEXT,
    ts INTEGER NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    token TEXT NOT NULL,
    issued_ts INTEGER NOT NULL,
    used INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
  console.log('Migration complete. DB at', DB_PATH);
  db.close();
});
