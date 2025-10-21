#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_DIR = path.join(__dirname,'database');
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR,'yuck.db');
const db = new sqlite3.Database(DB_PATH);

const cmd = process.argv[2];
if(!cmd || cmd==='help') return console.log('Usage: node cli.js export|import [file]');

if(cmd==='export'){
  const what = process.argv[3] || 'signups';
  const file = process.argv[4] || `${what}_export.csv`;
  if(what==='signups'){
    db.all('SELECT id,email,ip,ts FROM signups ORDER BY ts ASC', [], (err,rows)=>{
      if(err) return console.error(err);
      const csv = ['id,email,ip,ts', ...rows.map(r=>`${r.id},${r.email},${r.ip||''},${r.ts}`)].join('\n');
      fs.writeFileSync(file, csv);
      console.log('Exported', rows.length, 'rows to', file);
      db.close();
    });
  } else if(what==='invites'){
    db.all('SELECT id,email,token,issued_ts,used FROM invites ORDER BY issued_ts ASC', [], (err,rows)=>{
      if(err) return console.error(err);
      const csv = ['id,email,token,issued_ts,used', ...rows.map(r=>`${r.id},${r.email||''},${r.token},${r.issued_ts},${r.used}`)].join('\n');
      fs.writeFileSync(file, csv);
      console.log('Exported', rows.length, 'rows to', file);
      db.close();
    });
  }
} else if(cmd==='import'){
  const file = process.argv[3];
  if(!file || !fs.existsSync(file)) return console.error('Provide existing CSV file path');
  const text = fs.readFileSync(file,'utf8');
  const lines = text.split(/\r?\n/).slice(1).filter(Boolean);
  const items = lines.map(l=>{ const [id,email,ip,ts] = l.split(','); return {email,ip,ts:parseInt(ts||Date.now())}; });
  const stmt = db.prepare('INSERT INTO signups (email,ip,ts) VALUES (?,?,?)');
  items.forEach(it=>stmt.run(it.email,it.ip,it.ts));
  stmt.finalize(()=>{ console.log('Imported', items.length, 'rows'); db.close(); });
} else console.log('Unknown command',cmd);
