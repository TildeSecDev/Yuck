// Demo Express backend for Yuck — creates a Stripe Checkout Session (test mode)
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
// optional CORS so frontend served from different origin can call this backend in dev
try{ const cors = require('cors'); app.use(cors()); }catch(e){ /* cors not installed yet */ }

const STRIPE_KEY = process.env.STRIPE_SECRET || '';
if(!STRIPE_KEY){
  console.warn('WARN: STRIPE_SECRET not set. Checkout endpoint will fail until configured. See .env.example');
}
const stripe = require('stripe')(STRIPE_KEY);

app.use(express.json());

// Serve static frontend from repo (if running backend as single server)
const frontDir = path.join(__dirname, '..', 'src', 'mockups', '1');
const fs = require('fs');
if (fs.existsSync(frontDir)){
  app.use(express.static(frontDir));
  app.get('/', (req,res)=>{
    res.sendFile(path.join(frontDir,'index.html'));
  });
  console.log('Serving frontend from', frontDir);
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

const port = process.env.PORT || 4242;
app.listen(port, ()=>console.log(`Yuck backend demo listening on ${port}`));
