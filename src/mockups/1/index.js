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
    },
    content: null
  };

  let navToggleEl = null;
  let navEl = null;
  const mobileQuery = window.matchMedia('(max-width:680px)');

  // lightweight content loader parsing docs/raw.txt into a usable object
  async function loadContent(){
    try{
      const res = await fetch('/docs/raw.txt');
      if(!res.ok) throw new Error('docs not served');
      const raw = await res.text();
      state.content = parseDocs(raw);
    }catch(err){
      // leave content as null; renderers will fallback to inline copy
      console.warn('Content docs unavailable, using defaults:', err.message||err);
    }
  }

  function getSection(raw, header){
    const idx = raw.indexOf(header);
    if(idx === -1) return '';
    const rest = raw.slice(idx + header.length);
    const cut = rest.indexOf('\u2e3b'); // ⸻ divider
    return rest.slice(0, cut === -1 ? rest.length : cut).trim();
  }

  function getField(block, label){
    const re = new RegExp(`^${label}\\:\\s*\\n?([\\s\\S]*?)\\n(?=[A-Z][A-Za-z ]+\\:|$)`, 'm');
    const m = block.match(re);
    return m ? m[1].trim() : '';
  }

  function parseDocs(raw){
    const productBlock = getSection(raw, 'HOME / PRODUCT PAGE');
    const communityBlock = getSection(raw, 'COMMUNITY / JOIN PAGE');
    const aboutBlock = getSection(raw, 'ABOUT PAGE');
    const contactBlock = getSection(raw, 'CONTACT / SUPPORT PAGE');
    const socials = [];
    const socialSec = getField(communityBlock, 'Social Section');
    if(socialSec){
      // find [Name] tokens
      const re = /\[([^\]]+)\]/g; let sm;
      while((sm = re.exec(socialSec))) socials.push(sm[1]);
    }
    const socialLinks = {};
    const socialLinksBlock = getField(communityBlock, 'Social Links');
    if(socialLinksBlock){
      socialLinksBlock.split(/\n+/).forEach(line=>{
        const m = line.match(/^([^:]+):\s*(https?:\/\/[^\s]+)\s*$/);
        if(m) socialLinks[m[1].trim()] = m[2].trim();
      });
    }
    // parse FAQ from contact
    const faq = [];
    const faqSec = getField(contactBlock, 'FAQ Section');
    if(faqSec){
      const qas = faqSec.split(/\n\n+/).map(s=>s.trim()).filter(Boolean);
      qas.forEach(chunk=>{
        const q = chunk.match(/^Q\:\s*(.*)$/m);
        const a = chunk.match(/^A\:\s*(.*)$/m);
        if(q && a) faq.push({q:q[1].trim(), a:a[1].trim()});
      });
    }
    // support footer
    const supportFooter = getField(contactBlock, 'Support Footer');
    const support = { email: '', line: '' };
    if(supportFooter){
      const lines = supportFooter.split(/\n+/).map(s=>s.trim()).filter(Boolean);
      support.email = lines[0] || '';
      support.line = lines[1] || '';
    }
    return {
      product: {
        headline: getField(productBlock, 'Headline'),
        subheadline: getField(productBlock, 'Subheadline'),
        body: getField(productBlock, 'Body Copy'),
        why: getField(productBlock, 'Section 2 — “Why Yuck?”') || getField(productBlock, 'Section 2 — "Why Yuck?"'),
        how: getField(productBlock, 'Section 3 — “How to Use”') || getField(productBlock, 'Section 3 — "How to Use"'),
        tagline: getField(productBlock, 'Tagline Footer')
      },
      community: {
        headline: getField(communityBlock, 'Headline'),
        subheadline: getField(communityBlock, 'Subheadline'),
        body: getField(communityBlock, 'Body Copy'),
        cta: getField(communityBlock, 'Email Capture CTA'),
        counter: getField(communityBlock, 'Dynamic Counter Placeholder'),
        socials,
        socialLinks,
        tagline: getField(communityBlock, 'Footer Tagline')
      },
      about: {
        headline: getField(aboutBlock, 'Headline'),
        body: getField(aboutBlock, 'Body Copy'),
        section: getField(aboutBlock, 'Section Header'),
        team: getField(aboutBlock, 'Team Line'),
        closing: getField(aboutBlock, 'Closing Line')
      },
      contact: {
        headline: getField(contactBlock, 'Headline'),
        subheadline: getField(contactBlock, 'Subheadline'),
        labels: {
          name: 'Name',
          email: 'Email',
          message: 'Message',
          send: 'Send'
        },
        faq,
        support
      }
    };
  }

  // FormSubmit helper
  const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/tildesec@proton.me';
  async function sendViaFormSubmit(payload){
    try{
      const res = await fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json','Accept':'application/json'},
        body: JSON.stringify({
          ...payload,
          _captcha:'false',
          _template:'table',
          _honey:'',
          _next: (location.origin + location.pathname + '?thanks=1')
        })
      });
      const j = await res.json().catch(()=>({}));
      if(res.ok) return {ok:true, data:j};
      return {ok:false, error: j?.message || res.statusText};
    }catch(err){ return {ok:false, error: err.message||String(err)} }
  }

  function closeMobileNav(){
    if(navEl){
      navEl.classList.remove('is-open');
      if(mobileQuery.matches) navEl.setAttribute('aria-hidden','true');
      else navEl.removeAttribute('aria-hidden');
    }
    if(navToggleEl) navToggleEl.setAttribute('aria-expanded','false');
  }

  // routing
  function navigate(hash){
    const target = (hash||location.hash||'#product').replace('#','');
    renderPage(target);
    closeMobileNav();
  }

  async function mount(){
    document.getElementById('year').textContent = new Date().getFullYear();
    navEl = el('#mainNav');
    navToggleEl = el('#navToggle');
    if(navToggleEl && navEl){
      navToggleEl.addEventListener('click', ()=>{
        const isOpen = navEl.classList.toggle('is-open');
        navToggleEl.setAttribute('aria-expanded', isOpen ? 'true':'false');
        if(mobileQuery.matches) navEl.setAttribute('aria-hidden', isOpen ? 'false':'true');
        else navEl.removeAttribute('aria-hidden');
        if(isOpen){
          const firstLink = navEl.querySelector('a, button');
          if(firstLink) firstLink.focus();
        }
      });
      navEl.addEventListener('keydown', (event)=>{
        if(event.key === 'Escape' && navEl.classList.contains('is-open')){
          closeMobileNav();
          navToggleEl.focus();
        }
      });
      const mqHandler = ()=>{
        if(mobileQuery.matches){
          navEl.setAttribute('aria-hidden', navEl.classList.contains('is-open') ? 'false':'true');
        }else{
          navEl.removeAttribute('aria-hidden');
        }
        if(!mobileQuery.matches) closeMobileNav();
      };
      if(typeof mobileQuery.addEventListener === 'function') mobileQuery.addEventListener('change', mqHandler);
      else if(typeof mobileQuery.addListener === 'function') mobileQuery.addListener(mqHandler);
      mqHandler();
    }
    window.addEventListener('hashchange', ()=>navigate(location.hash));
    qs('[data-link]').forEach(a=>a.addEventListener('click', ()=>closeMobileNav()));
    el('#cartBtn').addEventListener('click', ()=>alert('Cart drawer placeholder - implement as needed'));
    const initial = (location.hash||'#product').replace('#','');
    await loadContent();
    renderPage(initial);
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
      case 'admin': main.appendChild(adminPage()); break;
      default: main.appendChild(productPage()); break;
    }
    // set active class for focus/animation
    qs('.page').forEach(p=>p.classList.remove('active'));
    const active = main.querySelector('.page'); if(active) active.classList.add('active');
    setActiveLink(name);
    requestAnimationFrame(()=>main.focus());
  }

  function setActiveLink(route){
    qs('[data-link]').forEach(link=>{
      const href = (link.getAttribute('href')||'').replace('#','');
      link.classList.toggle('active', href === route);
    });
  }

  // Product page
  function productPage(){
    const wrap = document.createElement('div'); wrap.className='page product';

    const grid = document.createElement('div'); grid.className='product-grid';

    const hero = document.createElement('section'); hero.className='hero product-hero';
    const c = state.content?.product;
    hero.innerHTML = `
      <div class="product-card">
        <div class="product-media">
          <img src="/assets/yuck-demo-supplement/Supplement.png" alt="Yuck supplement container" loading="lazy" />
        </div>
        <h2>${c?.headline || state.product.name}</h2>
        <p class="subtle">${c?.subheadline || "All-natural ingredients. Marketing-forward brand. Taste: intentionally 'yuck'."}</p>
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
      <p class="subtle">${c?.body || 'A straightforward mix of natural ingredients to support workouts. Packaging is intentionally loud.'}</p>
      <div style="margin-top:12px">
        <div class="pill">30 servings</div>
        <div class="pill" style="margin-left:8px">Vegan</div>
      </div>
      <div style="margin-top:14px">
        <strong>${c?.why ? 'Why Yuck?' : 'Shipping'}</strong>
        <div class="subtle">${c?.why || 'Flat rate available. Integrate carrier APIs in production.'}</div>
      </div>
    `;

    if(c?.how || c?.tagline){
      const extra = document.createElement('div'); extra.className='card'; extra.style.marginTop='12px';
      extra.innerHTML = `
        ${c?.how ? `<h3>How to Use</h3><p class="subtle">${c.how}</p>`:''}
        ${c?.tagline ? `<div class="helper muted" style="margin-top:8px">${c.tagline}</div>`:''}
      `;
      wrap.appendChild(extra);
    }

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
    alert('Added to cart - demo only');
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
      // Fallback: send a mock purchase order via FormSubmit
      sendViaFormSubmit({
        _subject: 'Yuck Mock Purchase Order',
        form: 'purchase-order',
        productId: state.product.id,
        quantity: qty,
        mode: type==='sub'? 'subscription':'payment',
        total: `$${total.toFixed(2)} ${state.product.currency}`,
        ts: new Date().toISOString(),
        page: location.href
      }).then(res=>{
        if(res.ok){
          alert(`Checkout fallback sent. ${qty} x ${type==='sub'? 'Subscription':'One-time'} - Total: $${total.toFixed(2)}. We'll email a confirmation.`);
        }else{
          alert(`Checkout placeholder - ${qty} x ${type==='sub'? 'Subscription':'One-time'} - Total: $${total.toFixed(2)}\nStart the demo backend to try a Stripe test checkout (see /backend).`);
        }
      });
    });
  }

  function updateCartCount(){
    const badge = el('#cartCount');
    if(!badge) return;
    badge.textContent = state.cart.reduce((s,i)=>s+i.qty,0);
  }

  // Community / Join page
  function communityPage(){
    const page = document.createElement('div'); page.className='page community';
    const c = state.content?.community;
    const baseCount = 4327;
    const localCount = (JSON.parse(localStorage.getItem('yuck_signups')||'[]')||[]).length;
    const counterText = c?.counter || `Brave souls converted: ${baseCount.toLocaleString()} and counting.`;
    page.innerHTML = `
      <div class="card">
        <h2>${c?.headline || 'Join the Yuck Community'}</h2>
        <p class="subtle">${c?.subheadline || 'Be part of our ambassador program. Early access, exclusive drops, and community updates.'}</p>
        <form id="joinForm" class="email-capture" onsubmit="return false;">
          <input id="joinEmail" type="email" placeholder="you@email.com" required />
          <button id="joinBtn" class="btn">${c?.cta || 'Join'}</button>
        </form>
        <div class="helper muted">${counterText.replace(/4,327/, (baseCount+localCount).toLocaleString())}</div>
      </div>
      ${communityExtras(c)}
    `;

    setTimeout(()=>{
      el('#joinBtn').addEventListener('click', async ()=>{
        const email = el('#joinEmail').value.trim();
        if(!email) return alert('Please enter an email');
        const payload = {email, hp: ''}; // hp honeypot left blank
        try{
          const res = await fetch('/api/signup', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
          const j = await res.json();
          if(res.ok && j.ok){ alert('Thanks - signup recorded.'); el('#joinEmail').value=''; return; }
          // try FormSubmit fallback
          const fs = await sendViaFormSubmit({_subject:'Yuck Community Signup', form:'community-signup', email, ts:new Date().toISOString(), page: location.href});
          if(fs.ok){ alert('Thanks - signup received. Please check your email.'); el('#joinEmail').value=''; return; }
          alert('Signup failed: '+(j.error||res.statusText||fs.error));
        }catch(e){
          // final fallback to local storage
          const signups = JSON.parse(localStorage.getItem('yuck_signups')||'[]');
          signups.push({email,ts:Date.now(),fallback:true});
          localStorage.setItem('yuck_signups', JSON.stringify(signups));
          alert('Offline - saved locally as demo.');
          el('#joinEmail').value='';
        }
      });
    },8);

    return page;
  }

  // add community invite quicklinks (Slack/Discord) and anti-bot recommendations
  function communityExtras(c){
    const socials = (c?.socials||[]).map(name=>{
      const hrefFromConfig = c?.socialLinks?.[name];
      const key = name.toLowerCase();
      const fallback = key.includes('discord')? 'https://discord.com/invite/your-invite'
        : key.includes('tiktok')? 'https://tiktok.com/@yuck'
        : key.includes('instagram')? 'https://instagram.com/yuck'
        : '#';
      const href = hrefFromConfig || fallback;
      return `<a class="btn btn-ghost" href="${href}" target="_blank" rel="noopener">${name}</a>`;
    }).join('');
    return `
      <div style="margin-top:12px" class="card">
        <h3>Community access</h3>
        <p class="subtle">After signup, we'll provide invite links. For demos, these are placeholders.</p>
        <div style="display:flex;gap:8px;margin-top:8px">${socials || `
          <a class="btn btn-ghost" href="https://discord.com/invite/your-invite" target="_blank" rel="noopener">Discord</a>
          <a class="btn btn-ghost" href="https://join.slack.com/t/yourworkspace/signup" target="_blank" rel="noopener">Slack</a>`}
        </div>
        <div class="helper muted">${c?.tagline || 'Tip: Use invite tokens and email verification to reduce bots.'}</div>
      </div>
    `;
  }

  function aboutPage(){
    const page = document.createElement('div'); page.className='page about';
    const c = state.content?.about;
    page.innerHTML = `
      <div class="card">
        <h2>${c?.headline || 'About Yuck'}</h2>
        <p class="subtle">${c?.body || 'Yuck is a marketing-first workout powder. It tastes intentionally bad to be memorable. Ingredients are natural and straightforward.'}</p>
        ${c?.section ? `<h3 style="margin-top:12px">${c.section}</h3>`:''}
        ${c?.team ? `<p class="subtle">${c.team}</p>`:''}
        ${c?.closing ? `<div class="helper muted" style="margin-top:12px">${c.closing}</div>`:''}
      </div>
    `;
    return page;
  }

  function contactPage(){
    const page = document.createElement('div'); page.className='page contact';
    const c = state.content?.contact;
    page.innerHTML = `
      <div class="card">
        <h2>${c?.headline || 'Contact & Support'}</h2>
        <p class="subtle">${c?.subheadline || 'Questions? Security or partnership inquiries can be sent here.'}</p>
        <form id="contactForm" onsubmit="return false;">
          <input type="text" id="name" placeholder="${c?.labels?.name || 'Your name'}" />
          <input type="email" id="email" placeholder="${c?.labels?.email || 'Email'}" required />
          <textarea id="message" rows="4" placeholder="${c?.labels?.message || 'How can we help?'}" required></textarea>
          <!-- honeypot field to trap bots -->
          <input type="text" id="hp" style="display:none" aria-hidden="true" />
          <div style="margin-top:8px;display:flex;gap:8px"><button id="sendMsg" class="btn">${c?.labels?.send || 'Send'}</button><button id="clearMsg" type="button" class="btn btn-ghost">Clear</button></div>
        </form>
        ${renderFaq(c)}
        <div class="helper muted">This form is a front-end demo. It uses a zero-config email backend for prototypes.</div>
      </div>
    `;

    // add support links
    setTimeout(()=>{
      const supportCard = document.createElement('div'); supportCard.className='card';
      const email = c?.support?.email || 'support@yuck.com';
      const line = c?.support?.line || 'We reply within 24 hours (we don\'t sleep much).';
      supportCard.innerHTML = `<h3>Support channels</h3><p class="subtle">For urgent issues: <a href="mailto:${email}">${email}</a></p><p class="subtle">${line}</p><div style="margin-top:8px"><a class=\"btn btn-ghost\" href=\"https://discord.com/invite/your-invite\" target=\"_blank\">Discord Support</a></div>`;
      page.appendChild(supportCard);
    },10);

    setTimeout(()=>{
      el('#sendMsg').addEventListener('click', async ()=>{
        if(el('#hp').value){alert('Spam detected');return}
        const email = el('#email').value.trim(); const msg = el('#message').value.trim();
        if(!email||!msg) return alert('Please complete the form');
        const name = el('#name').value.trim();
        const fs = await sendViaFormSubmit({_subject:'Yuck Contact', form:'contact', name, email, message: msg, ts:new Date().toISOString(), page: location.href});
        if(fs.ok){ el('#name').value=''; el('#email').value=''; el('#message').value=''; alert('Thanks - your message has been sent.'); return; }
        // fallback: local save
        const msgs = JSON.parse(localStorage.getItem('yuck_messages')||'[]');
        msgs.push({email,msg,ts:Date.now(), fallback:true});
        localStorage.setItem('yuck_messages', JSON.stringify(msgs));
        alert('Offline - message saved locally.');
      });
      el('#clearMsg').addEventListener('click', ()=>{ el('#name').value=''; el('#email').value=''; el('#message').value=''; });
    },8);

    return page;
  }

  function renderFaq(c){
    const faq = c?.faq||[];
    if(!faq.length) return '';
    const items = faq.map(qa=>`<details style="margin-top:8px"><summary><strong>Q:</strong> ${qa.q}</summary><div style="margin-top:6px" class="subtle"><strong>A:</strong> ${qa.a}</div></details>`).join('');
    return `<div style="margin-top:12px" class="card"><h3>FAQ</h3>${items}</div>`;
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

  function adminPage(){
    const page = document.createElement('div'); page.className='page admin';
    const wrap = document.createElement('div'); wrap.className='card';
    wrap.innerHTML = `<h2>Admin Panel</h2><div id="adminBody" class="subtle">Loading…</div>`;
    page.appendChild(wrap);

    const renderLogin = (msg='')=>{
      const html = `
        ${msg ? `<div class="helper muted" style="margin-bottom:8px">${msg}</div>`:''}
        <form id="adminLogin" onsubmit="return false;" style="display:grid;gap:8px;max-width:360px;margin-top:8px">
          <input id="adminUser" type="text" placeholder="Username" />
          <input id="adminPass" type="password" placeholder="Password" />
          <button id="adminLoginBtn" class="btn">Login</button>
        </form>`;
      el('#adminBody', wrap).innerHTML = html;
      setTimeout(()=>{
        el('#adminLoginBtn', wrap)?.addEventListener('click', async ()=>{
          const user = el('#adminUser', wrap).value.trim();
          const pass = el('#adminPass', wrap).value.trim();
          if(!user||!pass) return alert('Enter credentials');
          try{
            const res = await fetch('/admin/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({user, pass})});
            if(res.ok){ loadSignups(); }
            else renderLogin('Login failed');
          }catch(e){ renderLogin('Network error'); }
        });
      },0);
    };

    const renderSignups = (rows)=>{
      const tbody = rows.map(r=>`
        <tr>
          <td>${r.id}</td>
          <td>${r.email}</td>
          <td class="muted">${r.ip||''}</td>
          <td class="muted">${new Date(r.ts).toLocaleString()}</td>
        </tr>`).join('');
      el('#adminBody', wrap).innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 12px 0">
          <div class="subtle">Recent signups (${rows.length})</div>
          <div style="display:flex;gap:8px">
            <button id="refreshSignups" class="btn btn-ghost">Refresh</button>
            <button id="adminLogout" class="btn btn-ghost">Logout</button>
          </div>
        </div>
        <div style="overflow:auto">
          <table class="table" style="width:100%;min-width:520px">
            <thead><tr><th>ID</th><th>Email</th><th>IP</th><th>Timestamp</th></tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>`;
      setTimeout(()=>{
        el('#adminLogout', wrap)?.addEventListener('click', async ()=>{
          try{ await fetch('/admin/logout', {method:'POST'}); }catch(_){}
          renderLogin('Logged out');
        });
        el('#refreshSignups', wrap)?.addEventListener('click', ()=>loadSignups());
      },0);
    };

    const loadSignups = async ()=>{
      el('#adminBody', wrap).textContent = 'Loading…';
      try{
        const res = await fetch('/admin/signups');
        if(res.status === 401){ renderLogin(); return; }
        if(!res.ok){ el('#adminBody', wrap).textContent = 'Failed to load signups'; return; }
        const rows = await res.json();
        renderSignups(rows);
      }catch(e){ el('#adminBody', wrap).textContent = 'Network error'; }
    };

    loadSignups();
    return page;
  }

  // init
  document.addEventListener('DOMContentLoaded', mount);
})();

// Background media controller (separate from SPA closure for simplicity)
(function(){
  const palette = [
    ['#ff6b6b','#ffd166'],
    ['#6bffb8','#00b894'],
    ['#7f5af0','#2cb1bc'],
    ['#ff00a8','#ff6b6b'],
    ['#3a86ff','#8338ec'],
    ['#0beef9','#48cae4'],
    ['#f6a560','#ffbf69'],
    ['#05dfd7','#1b9aaa'],
    ['#ff6f91','#ff9671']
  ];

  const manifest = [
    {src:'istockphoto-1135987522-640_adpp_is.mp4', label:'Coral Motion'},
    {src:'istockphoto-1326710142-640_adpp_is.mp4', label:'Mint Energy'},
    {src:'istockphoto-1395689671-640_adpp_is.mp4', label:'Lift Session'},
    {src:'istockphoto-1433818982-640_adpp_is.mp4', label:'Night Run'},
    {src:'istockphoto-1459799539-640_adpp_is.mp4', label:'Studio Grit'},
    {src:'istockphoto-173046678-640_adpp_is.mp4', label:'Iron Focus'},
    {src:'istockphoto-2164753090-640_adpp_is.mp4', label:'Outdoor Sprint'},
    {src:'istockphoto-2188877484-640_adpp_is.mp4', label:'Form Practice'},
    {src:'istockphoto-863864540-640_adpp_is.mp4', label:'Core Training'}
  ].map((item, idx)=>({
    ...item,
    poster: makePoster(idx)
  }));

  function makePoster(idx){
    const colors = palette[idx % palette.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stop-color="${colors[0]}"/><stop offset="100%" stop-color="${colors[1]}"/></linearGradient></defs><rect fill="url(#g)" width="320" height="180" rx="14"/><text x="50%" y="52%" text-anchor="middle" fill="rgba(0,0,0,0.35)" font-size="26" font-family="'Inter','Arial',sans-serif">Yuck</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  const video = document.getElementById('bgVideo');
  const overlay = document.getElementById('bgOverlay');
  const STATIC_BG = '/assets/images/background-image.png';

  if(!video) return;

  const mobile = window.matchMedia('(max-width:680px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = -1;
  let currentSrc = null;

  function chooseDefaultIndex(){
    return mobile.matches ? Math.max(0, Math.floor(manifest.length/2)) : 0;
  }

  function selectByIndex(index){
    const asset = manifest[index];
    if(!asset) return;
    setActiveThumb(index);
    loadVideo(asset, index);
  }

  function setActiveThumb(index){ /* no-op: controls removed */ }

  function updateToggleLabel(){ /* no-op: controls removed */ }

  function loadVideo(asset, index){
    const src = '/assets/' + asset.src;
    if(currentSrc === src){
      if(!mobile.matches && !reduceMotion.matches) video.play().catch(()=>{});
      updateToggleLabel();
      return;
    }
    currentSrc = src;
    currentIndex = index;
    while(video.firstChild) video.removeChild(video.firstChild);
    const source = document.createElement('source'); source.src = src; source.type='video/mp4';
    video.appendChild(source);
    video.setAttribute('poster', asset.poster);
    video.preload = mobile.matches ? 'metadata' : 'auto';
    const shouldAutoplay = !(mobile.matches || reduceMotion.matches);
    if(shouldAutoplay){ video.play().catch(()=>{}); }
    else { video.pause(); }
    updateToggleLabel();
  }

  function hideBackground(){
    const wrap = document.querySelector('.bg-wrap');
    if(!wrap) return;
    wrap.style.display = 'none';
    video.pause();
  }

  function init(){
    // set a default poster so the static image shows until video loads
    if(STATIC_BG) video.setAttribute('poster', STATIC_BG);

    // select default and schedule an automatic change after 3 seconds
    selectByIndex(chooseDefaultIndex());
    setTimeout(()=>{
      const next = (currentIndex + 1 + manifest.length) % manifest.length;
      selectByIndex(next);
    }, 3000);

    // after looping twice, hide the background automatically
    let loops = 0;
    video.addEventListener('ended', ()=>{
      loops += 1;
      if(loops >= 2){ hideBackground(); }
    });

    if(overlay){ overlay.style.pointerEvents = 'none'; }
    if(mobile.matches || reduceMotion.matches){ video.pause(); }

    const mqHandler = ()=>{
      if(mobile.matches){ video.pause(); }
      else if(currentSrc){ video.play().catch(()=>{}); }
    };
    if(typeof mobile.addEventListener === 'function') mobile.addEventListener('change', mqHandler);
    else if(typeof mobile.addListener === 'function') mobile.addListener(mqHandler);

    const motionHandler = ()=>{
      if(reduceMotion.matches){ video.pause(); }
      else if(currentSrc && !mobile.matches){ video.play().catch(()=>{}); }
    };
    if(typeof reduceMotion.addEventListener === 'function') reduceMotion.addEventListener('change', motionHandler);
    else if(typeof reduceMotion.addListener === 'function') reduceMotion.addListener(motionHandler);
  }

  document.addEventListener('DOMContentLoaded', init);
})();

// Progressive enhancement: register service worker if available
(function(){
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('service-worker.js').catch(err=>{
        console.warn('Service worker registration failed', err);
      });
    });
  }
})();
