// Lightweight SPA for Yuck mockup
(function(){
  // small helper
  const el = (sel, ctx=document)=> ctx.querySelector(sel);
  const qs = (sel, ctx=document)=> Array.from((ctx||document).querySelectorAll(sel));

  // app state
  const state = {
    cart: [],
    product: {
      id: 'yuck-01',
      name: 'Yuck Natural Workout Powder',
      priceOneTime: 24.00,
      priceSub: 19.00,
      currency: 'USD'
    }
  };

  // routing
  function navigate(hash){
    const target = (hash||location.hash||'#product').replace('#','');
    renderPage(target);
  }

  function mount(){
    document.getElementById('year').textContent = new Date().getFullYear();
    window.addEventListener('hashchange', ()=>navigate(location.hash));
    qs('[data-link]').forEach(a=>a.addEventListener('click', e=>{
      // let hash change do the job
    }));
    el('#cartBtn').addEventListener('click', ()=>alert('Cart drawer placeholder — implement as needed'));
    renderPage((location.hash||'#product').replace('#',''));
  }

  // Renderers for pages
  function renderPage(name){
    const main = el('#main');
    main.innerHTML = '';
    switch(name){
      case 'community': main.appendChild(communityPage()); break;
      case 'about': main.appendChild(aboutPage()); break;
      case 'contact': main.appendChild(contactPage()); break;
      case 'privacy': main.appendChild(privacyPage()); break;
      case 'terms': main.appendChild(termsPage()); break;
      default: main.appendChild(productPage()); break;
    }
    // set active class for focus/animation
    qs('.page').forEach(p=>p.classList.remove('active'));
    const active = main.querySelector('.page'); if(active) active.classList.add('active');
  }

  // Product page
  function productPage(){
    const wrap = document.createElement('div'); wrap.className='page product';

    const grid = document.createElement('div'); grid.className='product-grid';

    const hero = document.createElement('section'); hero.className='hero product-hero';
    hero.innerHTML = `
      <div class="product-card">
        <h2>${state.product.name}</h2>
        <p class="subtle">All-natural ingredients. Marketing-forward brand. Taste: intentionally 'yuck'.</p>
        <div style="margin-top:14px" class="price" id="displayPrice">$${state.product.priceOneTime.toFixed(2)}</div>
        <div class="variant">
          <div class="option selected" data-type="one">One-time</div>
          <div class="option" data-type="sub">Subscribe & Save</div>
        </div>
        <div class="qty">
          <label class="subtle">Quantity</label>
          <input type="number" min="1" value="1" id="qty">
        </div>
        <div class="purchase-actions">
          <div style="display:flex;gap:8px">
            <button id="buyNow" class="btn">Buy now</button>
            <button id="addCart" class="btn btn-ghost">Add to cart</button>
          </div>
          <div class="helper subtle">Payments: Stripe & PayPal integration placeholders included as comments in the code.</div>
        </div>
      </div>
    `;

    const aside = document.createElement('aside'); aside.className='card';
    aside.innerHTML = `
      <h3>What's inside</h3>
      <p class="subtle">A straightforward mix of natural ingredients to support workouts. Packaging is intentionally loud.</p>
      <div style="margin-top:12px">
        <div class="pill">30 servings</div>
        <div class="pill" style="margin-left:8px">Vegan</div>
      </div>
      <div style="margin-top:14px">
        <strong>Shipping</strong>
        <div class="subtle">Flat rate available. Integrate carrier APIs in production.</div>
      </div>
    `;

    grid.appendChild(hero); grid.appendChild(aside);
    wrap.appendChild(grid);

    // events
    setTimeout(()=>{
      const opts = hero.querySelectorAll('.option');
      opts.forEach(o=>o.addEventListener('click', ()=>{
        opts.forEach(x=>x.classList.remove('selected'));
        o.classList.add('selected');
        updatePriceDisplay();
      }));
      el('#qty').addEventListener('input', updatePriceDisplay);
      el('#buyNow').addEventListener('click', ()=>handlePurchase(true));
      el('#addCart').addEventListener('click', ()=>handleAddCart());
    },8);

    return wrap;
  }

  function updatePriceDisplay(){
    const type = el('.option.selected')?.dataset.type || 'one';
    const qty = Math.max(1, parseInt(el('#qty').value||1));
    const per = (type==='sub') ? state.product.priceSub : state.product.priceOneTime;
    el('#displayPrice').textContent = `$${(per*qty).toFixed(2)} ${type==='sub'?' /mo (sub)':''}`;
  }

  function handleAddCart(){
    const type = el('.option.selected')?.dataset.type || 'one';
    const qty = Math.max(1, parseInt(el('#qty').value||1));
    state.cart.push({productId:state.product.id,type,qty});
    updateCartCount();
    alert('Added to cart — demo only');
  }

  function handlePurchase(direct=false){
    const type = el('.option.selected')?.dataset.type || 'one';
    const qty = Math.max(1, parseInt(el('#qty').value||1));
    const per = (type==='sub') ? state.product.priceSub : state.product.priceOneTime;
    const total = per*qty;
    // placeholder checkout flow
    // Try demo backend integration: POST to /create-checkout-session and redirect to session.url
    // This requires the demo backend to be running (see /backend/.env.example and README).
    fetch('/create-checkout-session', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({quantity:qty, mode: type==='sub'? 'subscription':'payment'})
    }).then(r=>r.json()).then(j=>{
      if(j.url){ window.location.href = j.url; return; }
      alert('No checkout URL returned from backend.');
    }).catch(err=>{
      console.warn('Checkout backend not reachable or failed:', err);
      alert(`Checkout placeholder — ${qty} x ${type==='sub'? 'Subscription':'One-time'} — Total: $${total.toFixed(2)}\nStart the demo backend to try a Stripe test checkout (see /backend).`);
    });
  }

  function updateCartCount(){
    el('#cartCount').textContent = state.cart.reduce((s,i)=>s+i.qty,0);
  }

  // Community / Join page
  function communityPage(){
    const page = document.createElement('div'); page.className='page community';
    page.innerHTML = `
      <div class="card">
        <h2>Join the Yuck Community</h2>
        <p class="subtle">Be part of our ambassador program. Early access, exclusive drops, and community updates.</p>
        <form id="joinForm" class="email-capture" onsubmit="return false;">
          <input id="joinEmail" type="email" placeholder="your@email.com" required />
          <button id="joinBtn" class="btn">Join</button>
        </form>
        <div class="helper muted">We recommend using Discord or Slack for community. Members will get access links after signup.</div>
      </div>
    `;

    setTimeout(()=>{
      el('#joinBtn').addEventListener('click', ()=>{
        const email = el('#joinEmail').value.trim();
        if(!email) return alert('Please enter an email');
        // anti-bot: simple honeypot could be added server-side; here we do client-side note
        // store locally as placeholder; in production POST to API with CAPTCHA or CAPTCHAless device signals
        const signups = JSON.parse(localStorage.getItem('yuck_signups')||'[]');
        signups.push({email,ts:Date.now()});
        localStorage.setItem('yuck_signups', JSON.stringify(signups));
        alert('Thanks! We saved your email locally as a demo. (Integrate real backend and email provider).');
        el('#joinEmail').value = '';
      });
    },8);

    return page;
  }

  // add community invite quicklinks (Slack/Discord) and anti-bot recommendations
  function communityExtras(){
    return `
      <div style="margin-top:12px" class="card">
        <h3>Community access</h3>
        <p class="subtle">After signup, we'll provide invite links. For demos, these are placeholders.</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <a class="btn btn-ghost" href="https://discord.com/invite/your-invite" target="_blank" rel="noopener">Discord</a>
          <a class="btn btn-ghost" href="https://join.slack.com/t/yourworkspace/signup" target="_blank" rel="noopener">Slack</a>
        </div>
        <div class="helper muted">Tip: Use invite tokens and email verification to reduce bots.</div>
      </div>
    `;
  }

  function aboutPage(){
    const page = document.createElement('div'); page.className='page about';
    page.innerHTML = `
      <div class="card">
        <h2>About Yuck</h2>
        <p class="subtle">Yuck is a marketing-first workout powder. It tastes intentionally bad to be memorable. Ingredients are natural and straightforward.</p>
        <h3 style="margin-top:12px">Brand direction</h3>
        <p class="subtle">Counter to 'super scientific' aesthetics — we favour bold, playful, and unapologetic design. Copy and creative assets coming from André.</p>
        <div style="margin-top:12px">
          <strong>Design notes</strong>
          <p class="subtle">Palette: bold accent coral and mint; typography: heavy headings, compact body. Focus on large imagery, minimal copy on product pages, with marketing-first language.</p>
        </div>
      </div>
      <div style="height:14px"></div>
      <div class="card">
        <h3>Mission</h3>
        <p class="subtle">Make a memorable product that drives strong brand affinity. Ambassadors and community are the core growth channel.</p>
      </div>
    `;
    return page;
  }

  function contactPage(){
    const page = document.createElement('div'); page.className='page contact';
    page.innerHTML = `
      <div class="card">
        <h2>Contact & Support</h2>
        <p class="subtle">Questions? Security or partnership inquiries can be sent here.</p>
        <form id="contactForm" onsubmit="return false;">
          <input type="text" id="name" placeholder="Your name" />
          <input type="email" id="email" placeholder="Email" required />
          <textarea id="message" rows="4" placeholder="How can we help?" required></textarea>
          <!-- honeypot field to trap bots -->
          <input type="text" id="hp" style="display:none" aria-hidden="true" />
          <div style="margin-top:8px;display:flex;gap:8px"><button id="sendMsg" class="btn">Send</button><button id="clearMsg" type="button" class="btn btn-ghost">Clear</button></div>
        </form>
        <div class="helper muted">This form is a front-end demo. In production, post to a backend with spam protections and email notifications.</div>
      </div>
    `;

    // add support links
    setTimeout(()=>{
      const supportCard = document.createElement('div'); supportCard.className='card';
      supportCard.innerHTML = `<h3>Support channels</h3><p class="subtle">For urgent issues: <a href="mailto:support@yuck.example">support@yuck.example</a></p><div style="margin-top:8px"><a class=\"btn btn-ghost\" href=\"https://discord.com/invite/your-invite\" target=\"_blank\">Discord Support</a></div>`;
      page.appendChild(supportCard);
    },10);

    setTimeout(()=>{
      el('#sendMsg').addEventListener('click', ()=>{
        if(el('#hp').value){alert('Spam detected');return}
        const email = el('#email').value.trim(); const msg = el('#message').value.trim();
        if(!email||!msg) return alert('Please complete the form');
        // demo: store locally
        const msgs = JSON.parse(localStorage.getItem('yuck_messages')||'[]');
        msgs.push({email,msg,ts:Date.now()});
        localStorage.setItem('yuck_messages', JSON.stringify(msgs));
        alert('Message saved locally. In production, this would send an email to support.');
      });
      el('#clearMsg').addEventListener('click', ()=>{ el('#name').value=''; el('#email').value=''; el('#message').value=''; });
    },8);

    return page;
  }

  function privacyPage(){
    const page = document.createElement('div'); page.className='page misc';
    page.innerHTML = `<div class="card"><h2>Privacy</h2><p class="subtle">Demo privacy notes: implement DMARC, SPF, and MTA-STS for production email protection. Use a dedicated transactional email provider (SendGrid/SES) and enable strict dmarc policies.</p></div>`;
    return page;
  }

  function termsPage(){
    const page = document.createElement('div'); page.className='page misc';
    page.innerHTML = `<div class="card"><h2>Terms</h2><p class="subtle">Terms placeholder. Add business terms and subscription cancellation flow details in production.</p></div>`;
    return page;
  }

  // init
  document.addEventListener('DOMContentLoaded', mount);
})();
