// Demo Express backend for Yuck — creates a Stripe Checkout Session (test mode)
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
require('dotenv').config();
// optional CORS so frontend served from different origin can call this backend in dev
try{ const cors = require('cors'); app.use(cors()); }catch(e){ /* cors not installed yet */ }

const STRIPE_KEY = process.env.STRIPE_SECRET || '';
if(!STRIPE_KEY){
  console.warn('WARN: STRIPE_SECRET not set. Checkout endpoint will fail until configured. See .env.example');
}
const stripe = require('stripe')(STRIPE_KEY);

app.use(express.json());

function parseFlag(name){
  const long = `--${name}`;
  const args = process.argv.slice(2);
  for(let i=0;i<args.length;i++){
    const current = args[i];
    if(current === long){
      const next = args[i+1];
      if(next && !next.startsWith('--')) return next;
    }
    if(current.startsWith(`${long}=`)){
      return current.slice(long.length + 1);
    }
  }
  return null;
}

function resolveFrontendDir(){
  const repoRoot = path.join(__dirname, '..');
  const directFlag = parseFlag('frontend-dir') || parseFlag('frontend');
  const manual = process.env.FRONTEND_DIR || directFlag;
  if(manual){
    const candidate = path.isAbsolute(manual) ? manual : path.join(repoRoot, manual);
    if(fs.existsSync(candidate)) return candidate;
    console.warn('Requested frontend directory not found:', candidate);
  }
  const mockupCandidate = parseFlag('mockup') || process.env.MOCKUP || process.env.MOCKUP_ID;
  if(mockupCandidate){
    const safeName = String(mockupCandidate).replace(/[^a-zA-Z0-9_-]/g, '');
    const candidate = path.join(repoRoot, 'src', 'mockups', safeName);
    if(fs.existsSync(candidate)) return candidate;
    console.warn(`Mockup directory "${safeName}" was not found at ${candidate}. Falling back to default.`);
  }
  const fallback = path.join(repoRoot, 'src', 'mockups', '1');
  if(fs.existsSync(fallback)) return fallback;
  return null;
}

// Serve static frontend from repo (if running backend as single server)
const frontDir = resolveFrontendDir();
if (frontDir){
  app.use(express.static(frontDir));
  // serve background assets (videos/posters)
  const assetsDir = path.join(__dirname, '..', 'src', 'assets');
  if(fs.existsSync(assetsDir)){
    app.use('/assets', express.static(assetsDir, {fallthrough:true, maxAge: '7d'}));
  }
  // serve docs for content population
  const docsDir = path.join(__dirname, '..', 'docs');
  if(fs.existsSync(docsDir)){
    app.use('/docs', express.static(docsDir, {fallthrough:true, maxAge: '1h'}));
  }
  app.get('/', (req,res)=>{
    res.sendFile(path.join(frontDir,'index.html'));
  });
  console.log('Serving frontend from', frontDir);
}else{
  console.warn('No frontend directory configured; static mockup assets will not be served.');
}

app.post('/create-checkout-session', async (req, res) => {
  try{
    const {quantity=1, mode='payment'} = req.body;
    // For demo, create a simple line item. In production use Price IDs and create recurring prices for subscriptions.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: mode, // 'payment' or 'subscription'
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {name: 'Yuck Natural Workout Powder (demo)'},
          unit_amount: 2400,
        },
        quantity: quantity,
      }],
      success_url: (req.headers.origin || 'http://localhost:4242') + '/?success=1',
      cancel_url: (req.headers.origin || 'http://localhost:4242') + '/?canceled=1'
    });
    res.json({url: session.url});
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message});
  }
});

app.get('/health', (req,res)=>res.json({ok:true}));

// use sqlite3 for storage
const sqlite3 = require('sqlite3').verbose();
const DB_DIR = path.join(__dirname,'database');
if(!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, {recursive:true});
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR,'yuck.db');
const db = new sqlite3.Database(DB_PATH);

// init schema
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
});

// simple in-memory rate limiter per IP
const recent = new Map();
function checkRate(ip){
  const now = Date.now();
  const window = 60_000; // 1 min
  const max = 8;
  const entry = recent.get(ip) || [];
  const filtered = entry.filter(ts=> now-ts < window);
  filtered.push(now);
  recent.set(ip, filtered);
  return filtered.length <= max;
}

app.post('/api/signup', (req,res)=>{
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  if(!checkRate(ip)) return res.status(429).json({error:'rate_limited'});
  const {email, hp} = req.body || {};
  if(hp) return res.status(400).json({error:'bot_detected'});
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({error:'invalid_email'});
  const ts = Date.now();
  db.run('INSERT INTO signups (email, ip, ts) VALUES (?,?,?)', [email, ip, ts], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({ok:true, id:this.lastID});
  });
});
// session store for admin auth
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
app.use(session({
  store: new SQLiteStore({db: 'sessions.sqlite', dir: DB_DIR}),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false} // set true under HTTPS in production
}));

// admin login route (session-based)
app.post('/admin/login', (req,res)=>{
  const {user, pass} = req.body || {};
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'change-me';
  if(user === ADMIN_USER && pass === ADMIN_PASS){
    req.session.admin = {user};
    return res.json({ok:true});
  }
  return res.status(401).json({error:'invalid_credentials'});
});

app.post('/admin/logout', (req,res)=>{
  req.session.destroy(()=>res.json({ok:true}));
});

function requireAdmin(req,res,next){
  if(req.session && req.session.admin) return next();
  return res.status(401).json({error:'unauthorized'});
}

app.get('/admin/signups', requireAdmin, (req,res)=>{
  db.all('SELECT id,email,ip,ts FROM signups ORDER BY ts DESC LIMIT 1000', [], (err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

// list invites (admin)
app.get('/admin/invites', requireAdmin, (req,res)=>{
  db.all('SELECT id,email,token,issued_ts,used FROM invites ORDER BY issued_ts DESC LIMIT 1000', [], (err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

// Stripe webhook endpoint to handle post-checkout events and issue invite tokens
// Use webhook signing secret in STRIPE_WEBHOOK_SECRET for verification in production
const rawBodyBuffer = (req, res, buf, encoding) => { if (buf && buf.length) req.rawBody = buf.toString(encoding || 'utf8'); };
// need raw body for signature verification; mount a separate route with raw body parsing
app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event = null;
  try{
    if(webhookSecret){
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // when no secret is configured (dev), parse body directly
      event = req.body;
    }
  }catch(err){
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event types
  if(event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded'){
    const session = event.data?.object || event;
    // try to get customer email
    const email = session.customer_details?.email || session.customer_email || session.metadata?.email || null;
    const issued_ts = Date.now();
    const token = 'invite_' + Math.random().toString(36).slice(2,10);
    db.run('INSERT INTO invites (email,token,issued_ts) VALUES (?,?,?)', [email, token, issued_ts], function(err){
      if(err) console.error('Failed to insert invite', err.message);
      else console.log('Issued invite', token, 'for', email);
    });
  }

  res.json({received:true});
});

const port = process.env.PORT || 4242;
app.listen(port, ()=>console.log(`Yuck backend demo listening on ${port}`));
