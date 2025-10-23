// ===== Service Worker registration =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

// ===== Simple SPA-ish behavior (active nav) =====
const navLinks = document.querySelectorAll('nav a');
function setActive(){
  const hash = location.hash || '#product';
  navLinks.forEach(a=>a.classList.toggle('active', a.getAttribute('href')===hash));
}
window.addEventListener('hashchange', setActive);
setActive();

// ===== Purchase logic mock =====
const priceLabel = document.getElementById('priceLabel');
const oneTimeBtn = document.getElementById('oneTimeBtn');
const subBtn = document.getElementById('subBtn');
const buyBtn = document.getElementById('buyBtn');
const quickBuy = document.getElementById('quickBuy');

function setMode(mode){
  if(mode==='one'){
    priceLabel.textContent = '£29';
    oneTimeBtn.classList.add('active');
    subBtn.classList.remove('active');
    oneTimeBtn.setAttribute('aria-selected','true');
    subBtn.setAttribute('aria-selected','false');
  }else{
    priceLabel.textContent = '£24 / mo';
    subBtn.classList.add('active');
    oneTimeBtn.classList.remove('active');
    subBtn.setAttribute('aria-selected','true');
    oneTimeBtn.setAttribute('aria-selected','false');
  }
}
oneTimeBtn?.addEventListener('click', ()=>setMode('one'));
subBtn?.addEventListener('click', ()=>setMode('sub'));
setMode('one');

function toast(msg){
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.position='fixed'; el.style.bottom='22px'; el.style.left='50%'; el.style.transform='translateX(-50%)';
  el.style.padding='12px 18px'; el.style.borderRadius='14px';
  el.style.background='linear-gradient(135deg, #48743E, #E1A863)'; el.style.color='#000'; el.style.fontWeight='900';
  el.style.boxShadow='0 8px 28px rgba(0,0,0,.35)';
  document.body.appendChild(el);
  setTimeout(()=>{ el.style.transition='opacity 300ms'; el.style.opacity='0'; setTimeout(()=>el.remove(),320) }, 1600);
}
buyBtn?.addEventListener('click', ()=>toast('Added to cart • (demo)'));
quickBuy?.addEventListener('click', ()=>toast('Quick checkout • (demo)'));

// ===== Join form (with honeypot) =====
document.getElementById('joinForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = new FormData(e.target);
  if (data.get('website')) { return; } // bot caught
  const email = (data.get('email')||'').toString().trim();
  const msg = document.getElementById('joinMsg');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    msg.textContent = 'Please enter a valid email.';
    msg.style.color = '#D95E40';
    return;
  }
  // Demo success
  msg.textContent = 'Invite requested. Check your inbox for a secure link.';
  msg.style.color = '#E1A863';
  e.target.reset();
});

// ===== Support form (mock) =====
document.getElementById('supportForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const msg = document.getElementById('supportMsg');
  msg.textContent = 'Message sent (demo). We’ll reply within 24h.';
  msg.style.color = '#E1A863';
  e.target.reset();
});

// ===== Install prompt handling =====
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.disabled = false;
});
installBtn?.addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.disabled = true;
  toast('App installed');
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();
