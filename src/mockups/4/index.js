// Minimal tab switcher for single-view layout
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

let currentPlatform = null; // 'instagram' | 'youtube' | 'handshake' | null

function setView(view){
  const app = $('#app');
  if(!app) return;
  app.dataset.view = view;
  // Update hero content inline to mimic single-hero layout switching
  const title = $('#hero-title');
  const sub = $('.hero .sub');
  const kicker = $('.kicker');
  const ctaAlt = $('[data-action="cart"]');
  const ctaBuy = $('[data-action="buy"]');
  if(view === 'product'){
    title.textContent = 'Yuck Natural Workout Fuel';
    sub.textContent = 'All‑natural workout fuel that tells your body “you’re welcome” and your taste buds “sorry”.';
    if(kicker) kicker.textContent = 'PRODUCT';
    if(ctaBuy) ctaBuy.textContent = 'Get Yuck';
    // Hide community switcher/content when leaving community
  const ss = document.querySelector('.social-switcher');
  if(ss){ ss.hidden = true; }
    hideSocialContent();
  }else if(view === 'community'){
    title.textContent = 'Yuck Community';
    sub.textContent = 'Join for early drops, challenges, and questionable flavor experiments.';
    if(kicker) kicker.textContent = 'COMMUNITY';
    if(ctaBuy) ctaBuy.textContent = 'Join now';
  const ss = document.querySelector('.social-switcher');
  if(ss){ ss.hidden = false; }
    hideSocialContent();
  }else if(view === 'about'){
    title.textContent = 'About Yuck';
    sub.textContent = 'Marketing‑first workout powder with a memorable bite. Clean inputs, bold attitude.';
    if(kicker) kicker.textContent = 'ABOUT';
    if(ctaBuy) ctaBuy.textContent = 'Contact / Support';
    const ss = document.querySelector('.social-switcher');
    if(ss){ ss.hidden = true; }
    const ac = document.querySelector('.about-content');
    if(ac){ ac.hidden = false; requestAnimationFrame(()=> ac.classList.add('is-open')); }
    hideSocialContent();
  }
  $$('.tab').forEach(t=>t.classList.toggle('is-active', t.dataset.view === view));
}

function init(){
  clearLegacyServiceWorkers();
  // Support the new tabbar buttons
  $$('.tab').forEach(btn=> btn.addEventListener('click', ()=> setView(btn.dataset.view)));
  // Wire FormSubmit _next to redirect back here with a flag
  const join = $('#joinForm');
  const next = $('#joinNext');
  if(join && next){
    try{
      const url = new URL(window.location.href);
      url.searchParams.set('joined','1');
      next.value = url.toString();
    }catch{ /* no-op */ }
  }
  // Open buy modal on product 'Get Yuck'
  const buyBtn = document.querySelector('[data-action="buy"]');
  if(buyBtn){
    buyBtn.addEventListener('click', (e)=>{
      const view = $('#app')?.dataset.view;
      if(view === 'product'){
        e.preventDefault();
        openModal('#buyModal');
        return;
      }
      if(view === 'community'){
        e.preventDefault();
        openModal('#joinModal');
        return;
      }
      if(view === 'about'){
        e.preventDefault();
        openModal('#supportModal');
        return;
      }
      e.preventDefault();
    });
  }
  // About: open support from the about content button
  document.addEventListener('click', (e)=>{
    const t = e.target;
    if(t && t.matches && t.matches('[data-action="open-support"]')){
      e.preventDefault();
      openModal('#supportModal');
    }
  });
  setupBuyModal();
  setupJoinModal();
  setupSupportModal();
  setupSocialSwitcher();
  // If returned from FormSubmit, show a small thank-you toast
  maybeShowJoinedToast();
  startIntro();
  orchestrateFadeIn();
  setupParallax();
  setupCanHover();
  registerSW();
}

document.addEventListener('DOMContentLoaded', init);

// Tiny parallax for wordmark and can, respects reduced motion
function setupParallax(){
  const wm = document.querySelector('.wordmark');
  const can = document.querySelector('.can');
  if(!wm || !can) return;
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  let target = {x:0,y:0};
  let current = {x:0,y:0};
  let rafId = 0;

  const onMove = (x, y)=>{
    const rx = (x / window.innerWidth) - 0.5;
    const ry = (y / window.innerHeight) - 0.5;
    target.x = rx; target.y = ry;
    tick();
  };

  const pointerHandler = (e)=>{
    if(rm.matches) return; // disabled
    if(e.touches && e.touches[0]){
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }else{
      onMove(e.clientX, e.clientY);
    }
  };

  function apply(){
    // Small offsets in px
    const canX = current.x * 12;
    const canY = current.y * 8;
    const wmX = current.x * 6;
    const wmY = current.y * 4;
    can.style.transform = `translate3d(${canX}px, ${canY}px, 0)`;
    wm.style.transform = `translate3d(${wmX}px, ${wmY}px, 0)`;
  }

  function tick(){
    if(rafId) return;
    rafId = requestAnimationFrame(()=>{
      rafId = 0;
      // Ease toward target
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      apply();
    });
  }

  function enable(){
    window.addEventListener('mousemove', pointerHandler, {passive:true});
    window.addEventListener('touchmove', pointerHandler, {passive:true});
  }
  function disable(){
    window.removeEventListener('mousemove', pointerHandler);
    window.removeEventListener('touchmove', pointerHandler);
    target.x = target.y = current.x = current.y = 0;
    wm.style.transform = 'none';
    can.style.transform = 'none';
  }

  if(!rm.matches) enable(); else disable();
  if(typeof rm.addEventListener === 'function'){
    rm.addEventListener('change', ()=>{ rm.matches ? disable() : enable(); });
  }else if(typeof rm.addListener === 'function'){
    rm.addListener(() => { rm.matches ? disable() : enable(); });
  }
}

// Nuke any old SW and caches from previous mockup 4 versions that might serve stale CSS/JS
function clearLegacyServiceWorkers(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(regs=>{
      regs.forEach(r=>{
        // Unregister older SWs that may still be controlling this scope
        if(r && r.active) r.update();
        r.unregister();
      });
    });
  }
  if('caches' in window){
    caches.keys().then(keys=>{
      keys.forEach(key=>{
        if(/yuck-field-shell-|yuck-single-shell-/.test(key)){
          caches.delete(key);
        }
      });
    });
  }
}

function registerSW(){
  if(!('serviceWorker' in navigator)) return;
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}

function maybeShowJoinedToast(){
  const sp = new URLSearchParams(window.location.search);
  if(sp.get('joined') !== '1') return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = "You're in. Check your email for a confirmation.";
  document.body.appendChild(toast);
  setTimeout(()=> toast.classList.add('show'), 10);
  setTimeout(()=> toast.classList.remove('show'), 4200);
  setTimeout(()=> toast.remove(), 4800);
}

function startIntro(){
  const intro = document.querySelector('.intro');
  if(!intro) return;
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const end = ()=> intro.remove();
  if(rm.matches){
    // Skip animation for reduced motion users
    end();
    return;
  }
  // Fade out after a brief moment to ensure first paint
  window.addEventListener('load', ()=>{
    setTimeout(()=>{
      intro.classList.add('hide');
      intro.addEventListener('transitionend', end, {once:true});
    }, 250);
  });
}

function orchestrateFadeIn(){
  const app = document.getElementById('app');
  if(!app) return;
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if(rm.matches){
    app.classList.add('is-ready');
    return;
  }
  const cutout = document.querySelector('.bg-cutout');
  if(cutout){
    const done = ()=>{
      app.classList.add('is-ready');
    };
    cutout.addEventListener('animationend', done, {once:true});
    // Safety timeout in case animation doesn't fire (cap at 2s)
    setTimeout(()=> app.classList.add('is-ready'), 2100);
  }else{
    // No cutout present; reveal immediately after load
    if(document.readyState === 'complete') app.classList.add('is-ready');
    else window.addEventListener('load', ()=> app.classList.add('is-ready'));
  }
}

function setupCanHover(){
  const el = document.querySelector('.can');
  if(!el) return;
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Preload gif to reduce flicker
  const gifSrc = el.getAttribute('data-gif');
  if(gifSrc){ const img = new Image(); img.src = gifSrc; }
  const stillSrc = el.getAttribute('data-still') || el.getAttribute('src');
  const toGif = ()=>{ if(!rm.matches && gifSrc) el.src = gifSrc; };
  const toStill = ()=>{ if(stillSrc) el.src = stillSrc; };
  el.addEventListener('mouseenter', toGif);
  el.addEventListener('mouseleave', toStill);
  // For touch interaction: toggle on tap
  el.addEventListener('touchstart', toGif, {passive:true});
  el.addEventListener('touchend', toStill, {passive:true});
}

function openModal(sel){
  const m = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if(!m) return;
  m.hidden = false;
  m.dataset.open = '1';
  const onKey = (e)=>{
    if(e.key === 'Escape') closeModal(m);
  };
  m._esc = onKey;
  document.addEventListener('keydown', onKey);
}

function closeModal(m){
  if(!m) return;
  m.hidden = true;
  if(m._esc){ document.removeEventListener('keydown', m._esc); delete m._esc; }
}

function setupBuyModal(){
  const modal = document.querySelector('#buyModal');
  if(!modal) return;
  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-modal-close]')) closeModal(modal);
  });
  const pack = modal.querySelector('#pack');
  const flavor = modal.querySelector('#flavor');
  const qty = modal.querySelector('#qty');
  const total = modal.querySelector('#total');
  const preview = modal.querySelector('#buyPreview');
  const priceFromPack = ()=>{
    const opt = pack.options[pack.selectedIndex];
    const p = parseFloat(opt.getAttribute('data-price')||'0');
    return isNaN(p) ? 0 : p;
  };
  const updatePreview = ()=>{
    if(!preview) return;
    const packVal = pack.value;
    const flavorVal = flavor ? flavor.value : 'original';
    const q = Math.max(1, parseInt(qty.value||'1', 10));
    const single = packVal === 'single' && q === 1;
    const isSour = flavorVal === 'sour';
    let src = '';
    if(single){
      src = isSour ? '/assets/yuck-demo-supplement/SourSupplement.png' : '/assets/yuck-demo-supplement/Supplement.png';
    }else{
      src = isSour ? '/assets/yuck-demo-supplement/SourMultipleSupplement.png' : '/assets/yuck-demo-supplement/MultipleSupplement.png';
    }
    const alt = single
      ? (isSour ? 'Single Yuck sour supplement can' : 'Single Yuck supplement can')
      : (isSour ? 'Multiple Yuck sour supplement cans' : 'Multiple Yuck supplement cans');
    if(preview.getAttribute('src') !== src){ preview.setAttribute('src', src); }
    preview.setAttribute('alt', alt);
  };
  const update = ()=>{
    const base = priceFromPack();
    const q = Math.max(1, parseInt(qty.value||'1', 10));
    const t = base * q;
    total.textContent = `$${t.toFixed(2).replace(/\.00$/, '')}`;
    updatePreview();
  };
  pack.addEventListener('change', update);
  if(flavor) flavor.addEventListener('change', update);
  qty.addEventListener('input', update);
  modal.querySelectorAll('.qty__btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      const delta = parseInt(b.dataset.qty,10)||0;
      const val = Math.max(1, (parseInt(qty.value||'1',10) + delta));
      qty.value = String(val);
      update();
    });
  });
  update();
}

function setupJoinModal(){
  const modal = document.querySelector('#joinModal');
  if(!modal) return;
  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-modal-close]')) closeModal(modal);
  });
  // Wire FormSubmit _next to redirect back here with a flag
  const form = modal.querySelector('#joinModalForm');
  const next = modal.querySelector('#joinModalNext');
  if(form && next){
    try{
      const url = new URL(window.location.href);
      url.searchParams.set('joined','1');
      next.value = url.toString();
    }catch{ /* no-op */ }
    const submit = modal.querySelector('#joinSubmit');
    if(submit){
      submit.addEventListener('click', ()=>{
        form.submit();
      });
    }
  }
}

// When switching to community, ensure Instagram embeds initialize
function processInstagramEmbeds(){
  if(window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function'){
    try{ window.instgrm.Embeds.process(); }catch{ /* ignore */ }
  }
}

function setupSupportModal(){
  const modal = document.querySelector('#supportModal');
  if(!modal) return;
  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-modal-close]')) closeModal(modal);
  });
  const form = modal.querySelector('#supportForm');
  const next = modal.querySelector('#supportNext');
  if(form && next){
    try{
      const url = new URL(window.location.href);
      url.searchParams.set('joined','1');
      next.value = url.toString();
    }catch{ /* no-op */ }
    const submit = modal.querySelector('#supportSubmit');
    if(submit){ submit.addEventListener('click', ()=> form.submit()); }
  }
}

// Social switcher logic (Community)
function setupSocialSwitcher(){
  const ss = document.querySelector('.social-switcher');
  if(!ss) return;
  const icons = $$('.social-icon', ss);
  icons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const platform = btn.getAttribute('data-platform');
      if(!platform) return;
      if(currentPlatform === platform){
        // toggle off
        hideSocialContent();
        return;
      }
      // open/switch
      showSocialPlatform(platform);
    });
  });
}

function hideSocialContent(){
  const content = document.querySelector('.social-content');
  if(content){
    content.classList.remove('is-open');
    content.hidden = true;
    $$('.social-pane', content).forEach(p=> p.hidden = true);
  }
  $$('.social-icon').forEach(i=>{ i.classList.remove('is-active'); i.setAttribute('aria-pressed','false'); });
  currentPlatform = null;
}

function showSocialPlatform(platform){
  const content = document.querySelector('.social-content');
  if(!content) return;
  content.hidden = false;
  // animate slight slide/opacity on open
  requestAnimationFrame(()=> content.classList.add('is-open'));
  $$('.social-pane', content).forEach(p=>{
    p.hidden = p.getAttribute('data-platform') !== platform;
  });
  $$('.social-icon').forEach(i=>{
    const match = i.getAttribute('data-platform') === platform;
    i.classList.toggle('is-active', match);
    i.setAttribute('aria-pressed', match ? 'true' : 'false');
  });
  currentPlatform = platform;
  if(platform === 'instagram'){
    setTimeout(processInstagramEmbeds, 50);
  }
  if(platform === 'youtube'){
    setTimeout(ensureYouTubeEmbeds, 10);
  }
}

function parseYouTubeId(input){
  if(!input) return '';
  // Accept raw ID or full URL (watch, youtu.be, shorts)
  if(/^[a-zA-Z0-9_-]{6,}$/.test(input)) return input;
  try{
    const url = new URL(input);
    if(url.hostname.includes('youtu.be')){
      return url.pathname.replace('/','').split('/')[0];
    }
    if(url.pathname.startsWith('/shorts/')){
      return url.pathname.split('/')[2] || '';
    }
    if(url.searchParams.get('v')){
      return url.searchParams.get('v') || '';
    }
  }catch{/* ignore */}
  return '';
}

function ensureYouTubeEmbeds(){
  const pane = document.querySelector('.social-pane[data-platform="youtube"]');
  if(!pane) return;
  const frames = $$('.yt-frame', pane);
  frames.forEach(holder=>{
    if(holder.dataset.loaded === '1') return;
    // Prefer data-yt attribute; else try placeholder text
    let raw = holder.getAttribute('data-yt') || '';
    if(!raw){
      const ph = $('.placeholder', holder);
      if(ph) raw = ph.textContent.trim();
    }
    let id = parseYouTubeId(raw);
    if(!id){
      // Fallback demo ID if unspecified
      id = 'M7lc1UVf-VE';
    }
    const src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'YouTube video';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.setAttribute('allowfullscreen','');
    // Clear and append
    holder.innerHTML = '';
    holder.appendChild(iframe);
    holder.dataset.loaded = '1';
  });
}
