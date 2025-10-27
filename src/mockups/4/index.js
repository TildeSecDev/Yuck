const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

let currentPlatform = null; // 'instagram' | 'youtube' | 'partners' | null

const COMMUNITY_AUTH_KEY = 'yuck:community-auth';
const COMMUNITY_DIRECTORY = [
  {
    id: 'austin-dawn-patrol',
    name: 'Austin Dawn Patrol',
    city: 'Austin',
    state: 'TX',
  meet: 'Wednesdays - 6:30 AM ride + cold plunge',
    venue: 'Eastside Trackhouse',
    summary: 'Fast sunrise laps, coffee after, and product testing on the hills.',
    tags: ['ride', 'texas', 'central']
  },
  {
    id: 'denver-summit-saturday',
    name: 'Denver Summit Saturdays',
    city: 'Denver',
    state: 'CO',
  meet: 'Saturdays - 8:00 AM strength and altitude session',
    venue: 'RiNo Strength Lab',
    summary: 'Group warm-up, heavy lifts, and altitude recovery work.',
    tags: ['lift', 'mountain', 'strength']
  },
  {
    id: 'portland-night-grinds',
    name: 'Portland Night Grinds',
    city: 'Portland',
    state: 'OR',
  meet: 'Fridays - 7:00 PM mixed terrain ride',
    venue: 'Union Station Plaza',
    summary: 'Mixed surface ride with post-session taste tests and gear swaps.',
    tags: ['ride', 'pacific', 'gravel']
  },
  {
    id: 'brooklyn-overpass',
    name: 'Brooklyn Overpass Crew',
    city: 'Brooklyn',
    state: 'NY',
  meet: 'Tuesdays - 6:30 PM intervals + stairs',
    venue: 'McCarren Park Track',
    summary: 'Speed work, stairs, and recovery shakes on the bleachers.',
    tags: ['run', 'stairs', 'intervals']
  },
  {
    id: 'virtual-strength-lab',
    name: 'Virtual Strength Lab',
    city: 'Remote',
    state: 'Online',
  meet: 'Thursdays - 5:30 PM live stream',
    venue: 'Members-only live session',
    summary: 'Coach-led strength block broadcast with Q&A and chat.',
    tags: ['virtual', 'strength', 'global']
  }
];

let communitiesModalRefs = null;
let accountModalRefs = null;

function init(){
  clearLegacyServiceWorkers();
  wireNavState();
  wirePrimaryActions();
  wireSupportTriggers();
  wireFormRedirect($('#joinForm'), $('#joinNext'));
  setupBuyModal();
  setupJoinModal();
  setupSupportModal();
  setupAccountModal();
  setupCommunitiesModal();
  setupSocialSwitcher();
  maybeShowJoinedToast();
  startIntro();
  orchestrateFadeIn();
  setupParallax();
  setupCanHover();
  updateCurrentYear();
  registerSW();
  hydrateDashboard();
}

document.addEventListener('DOMContentLoaded', init);

function wireNavState(){
  const page = document.body?.dataset?.page;
  if(!page) return;
  $$('a[data-nav]').forEach(link=>{
    const isCurrent = link.getAttribute('data-nav') === page;
    if(isCurrent){
      link.setAttribute('aria-current','page');
      link.classList.add('is-active');
    }else{
      link.removeAttribute('aria-current');
      link.classList.remove('is-active');
    }
  });
}

function wirePrimaryActions(){
  const page = document.body?.dataset?.page;
  const primary = document.querySelector('[data-action="primary"]');
  if(primary){
    primary.addEventListener('click', (e)=>{
      e.preventDefault();
      if(page === 'community'){
        openModal('#joinModal');
        return;
      }
      openModal('#buyModal');
    });
  }
  const joinPanel = document.querySelector('[data-action="join-panel"]');
  if(joinPanel){
    joinPanel.addEventListener('click', (e)=>{
      e.preventDefault();
      const form = $('#joinForm');
      if(form){
        form.scrollIntoView({behavior:'smooth', block:'center'});
        const input = form.querySelector('input,textarea,select');
        if(input){
          input.focus({preventScroll:true});
        }
        return;
      }
      openModal('#joinModal');
    });
  }
  const communitiesBtn = document.querySelector('[data-action="communities"]');
  if(communitiesBtn){
    communitiesBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      openCommunitiesModal();
    });
  }
  const accountBtn = document.querySelector('[data-open-account]');
  if(accountBtn){
    accountBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      openAccountModal();
    });
  }
}

function wireSupportTriggers(){
  document.addEventListener('click', (e)=>{
    const el = e.target instanceof Element ? e.target.closest('[data-open-support]') : null;
    if(!el) return;
    e.preventDefault();
    openModal('#supportModal');
  });
}

function wireFormRedirect(form, field){
  if(!form || !field) return;
  try{
    const url = new URL(window.location.href);
    url.searchParams.set('joined','1');
    field.value = url.toString();
  }catch{ /* ignore */ }
}

function updateCurrentYear(){
  const slot = document.getElementById('year');
  if(!slot) return;
  slot.textContent = String(new Date().getFullYear());
}

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
    wireFormRedirect(form, next);
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
    wireFormRedirect(form, next);
  }
}

function setupAccountModal(){
  const modal = document.querySelector('#accountModal');
  if(!modal) return;
  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-modal-close]')) closeModal(modal);
  });

  const tabs = Array.from(modal.querySelectorAll('[data-account-tab]'));
  const views = Array.from(modal.querySelectorAll('[data-account-view]'));
  const forms = Array.from(modal.querySelectorAll('[data-account-form]'));
  const errorEl = modal.querySelector('#accountError');
  const loginForm = modal.querySelector('[data-account-form="login"]');
  const signupForm = modal.querySelector('[data-account-form="signup"]');

  const validModes = tabs.map(tab=> tab.getAttribute('data-account-tab'));

  const setActiveTab = (mode)=>{
    const targetMode = validModes.includes(mode) ? mode : 'login';
    tabs.forEach(tab=>{
      const isActive = tab.getAttribute('data-account-tab') === targetMode;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
    views.forEach(view=>{
      const match = view.getAttribute('data-account-view') === targetMode;
      view.hidden = !match;
      if(match){
        view.removeAttribute('aria-hidden');
      }else{
        view.setAttribute('aria-hidden','true');
      }
    });
    forms.forEach(form=>{
      const match = form.getAttribute('data-account-form') === targetMode;
      form.hidden = !match;
    });
    if(errorEl){
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    return targetMode;
  };

  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      const mode = tab.getAttribute('data-account-tab');
      const activeMode = setActiveTab(mode);
      const view = views.find(v=> v.getAttribute('data-account-view') === activeMode);
      const target = view?.querySelector('input');
      if(target){
        setTimeout(()=> target.focus({preventScroll:true}), 60);
      }
    });
  });

  const setBusy = (busy)=>{
    modal.querySelector('.account-modal')?.setAttribute('data-busy', busy ? '1' : '0');
  };

  async function handleSubmit(form, endpoint){
    if(!form) return;
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const formData = new FormData(form);
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '').trim();
      if(!email || !password){
        if(errorEl){
          errorEl.hidden = false;
          errorEl.textContent = 'Enter your email and password to continue.';
        }
        return;
      }
      setBusy(true);
      if(errorEl){
        errorEl.hidden = true;
        errorEl.textContent = '';
      }
      try{
        const res = await fetch(`/api/auth/${endpoint}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          credentials: 'include',
          body: JSON.stringify({email, password})
        });
        if(res.ok){
          await res.json().catch(()=>({}));
          closeModal(modal);
          window.location.href = 'dashboard.html';
          return;
        }
        if(res.status === 401 || res.status === 400){
          const data = await res.json().catch(()=>({}));
          const err = data?.error || 'Check your email and password and try again.';
          if(errorEl){
            errorEl.hidden = false;
            errorEl.textContent = formatAccountError(err);
          }
        }else if(res.status === 409){
          if(errorEl){
            errorEl.hidden = false;
            errorEl.textContent = 'That email is already registered. Try logging in instead.';
          }
        }else{
          await fallbackFormSubmit(form);
        }
      }catch(err){
        console.error('Account request failed', err);
        await fallbackFormSubmit(form);
      }finally{
        setBusy(false);
      }
    });
  }

  handleSubmit(loginForm, 'login');
  handleSubmit(signupForm, 'signup');

  accountModalRefs = {modal, setActiveTab};
}

async function fallbackFormSubmit(form){
  if(!form) return;
  const action = 'https://formsubmit.co/hello@yuck.example';
  const payload = new FormData(form);
  payload.set('_next', `${window.location.origin}/dashboard.html`);
  try{
    await fetch(action, {method:'POST', body: payload});
  }catch{
    /* ignore */
  }
  window.location.href = 'dashboard.html';
}

function openAccountModal(){
  const modal = document.querySelector('#accountModal');
  if(!modal) return;
  openModal(modal);
  let activeMode = 'login';
  if(accountModalRefs?.setActiveTab){
    activeMode = accountModalRefs.setActiveTab('login') || 'login';
  }
  const firstField = modal.querySelector(`[data-account-view="${activeMode}"] input`);
  if(firstField){
    setTimeout(()=> firstField.focus({preventScroll:true}), 80);
  }
}

function formatAccountError(code){
  switch(code){
    case 'invalid_email':
      return 'Enter a valid email address to continue.';
    case 'weak_password':
      return 'Password must be at least 8 characters.';
    case 'email_in_use':
      return 'That email already has an account. Try logging in.';
    case 'invalid_credentials':
      return 'We could not find that email and password combo.';
    default:
      return typeof code === 'string' ? code : 'Something went wrong. Try again in a moment.';
  }
}

function hydrateDashboard(){
  const page = document.body?.dataset?.page;
  if(page !== 'dashboard') return;
  fetchDashboardData();
  wireDashboardActions();
}

function wireDashboardActions(){
  const refresh = document.querySelector('[data-dashboard-action="refresh"]');
  if(refresh){
    refresh.addEventListener('click', ()=> fetchDashboardData(true));
  }
  const logout = document.querySelector('[data-dashboard-action="logout"]');
  if(logout){
    logout.addEventListener('click', async ()=>{
      try{
        await fetch('/api/auth/logout', {method:'POST', credentials:'include'});
      }catch{
        /* ignore */
      }
      window.location.href = 'index.html';
    });
  }
}

async function fetchDashboardData(force=false){
  const status = document.getElementById('dashboardStatus');
  if(status){
    status.textContent = force ? 'Refreshing your account...' : 'Loading your account...';
  }
  try{
    const res = await fetch('/api/dashboard', {credentials:'include'});
    if(!res.ok){
      if(res.status === 401){
        status.textContent = 'You need to log in again to view your dashboard.';
        return;
      }
      status.textContent = 'Could not load your dashboard just now.';
      return;
    }
    const data = await res.json();
    status.textContent = `Signed in as ${data?.user?.email || 'Yuck athlete'}.`;
    renderDashboardSection('dashboardOrders', data?.orders, renderOrderItem, 'No orders yet. Place your first order to see it here.');
    renderDashboardSection('dashboardCommunities', data?.activities, renderCommunityItem, 'Join a crew to see it in your dashboard.');
    renderDashboardSection('dashboardEvents', data?.events, renderEventItem, 'We will drop upcoming sessions once you join a crew.');
    renderDashboardSection('dashboardActivity', data?.communityPosts, renderActivityItem, 'No activity logged yet. Check back soon.');
  }catch(err){
    console.error('Dashboard fetch failed', err);
    if(status){
      status.textContent = 'Network issue loading your dashboard. Try again in a bit.';
    }
  }
}

function renderDashboardSection(id, items, renderer, emptyMessage){
  const host = document.getElementById(id);
  if(!host) return;
  const empty = host.querySelector('.dashboard-empty');
  const list = host.querySelector('.dashboard-list');
  if(!list){
    if(empty) empty.textContent = emptyMessage;
    return;
  }
  list.innerHTML = '';
  if(!items || !items.length){
    list.hidden = true;
    if(empty) empty.textContent = emptyMessage;
    return;
  }
  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = renderer(item);
    frag.appendChild(li);
  });
  list.appendChild(frag);
  list.hidden = false;
  if(empty) empty.textContent = '';
}

function renderOrderItem(order){
  if(!order) return '';
  const total = typeof order.total === 'number' ? `$${order.total.toFixed(2)}` : '$—';
  const date = order.placedAt ? new Date(order.placedAt).toLocaleDateString() : 'Pending';
  return `
    <strong>Order ${order.id || ''}</strong>
    <div class="dashboard-list__meta">
      <span>Status: ${order.status || 'Unknown'}</span>
      <span>Total: ${total}</span>
      <span>Placed: ${date}</span>
    </div>`;
}

function renderCommunityItem(activity){
  if(!activity) return '';
  return `
    <strong>${activity.region || 'Community'}</strong>
    <div class="dashboard-list__meta">
      <span>${activity.summary || ''}</span>
    </div>`;
}

function renderEventItem(event){
  if(!event) return '';
  const date = event.date ? new Date(event.date).toLocaleString() : 'TBD';
  return `
    <strong>${event.name || 'Event'}</strong>
    <div class="dashboard-list__meta">
      <span>When: ${date}</span>
      <span>Where: ${event.location || 'TBD'}</span>
    </div>`;
}

function renderActivityItem(post){
  if(!post) return '';
  const when = post.publishedAt ? new Date(post.publishedAt).toLocaleString() : '';
  return `
    <strong>${post.title || 'Update'}</strong>
    <div class="dashboard-list__meta">
      <span>By ${post.author || 'Yuck Team'}</span>
      <span>${when}</span>
    </div>`;
}

function setupCommunitiesModal(){
  const modal = document.querySelector('#communitiesModal');
  if(!modal) return;

  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-modal-close]')) closeModal(modal);
  });

  const loginView = modal.querySelector('[data-view="login"]');
  const directoryView = modal.querySelector('[data-view="directory"]');
  const loginForm = modal.querySelector('#communityLogin');
  const loginError = modal.querySelector('#communityLoginError');
  const searchInput = modal.querySelector('#communitySearch');
  const list = modal.querySelector('#communityList');
  const emptyState = modal.querySelector('#communityListEmpty');
  const result = modal.querySelector('#communityActionResult');
  const logoutBtn = modal.querySelector('[data-community-logout]');

  const showError = (message)=>{
    if(!loginError) return;
    if(!message){
      loginError.hidden = true;
      loginError.textContent = '';
    }else{
      loginError.hidden = false;
      loginError.textContent = message;
    }
  };

  communitiesModalRefs = {
    modal,
    loginView,
    directoryView,
    loginForm,
    loginError,
    searchInput,
    list,
    emptyState,
    result,
    showError
  };

  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const emailField = loginForm.querySelector('input[type="email"]');
      const passField = loginForm.querySelector('input[type="password"]');
      const email = emailField ? emailField.value.trim() : '';
      const password = passField ? passField.value.trim() : '';
      showError('');
      if(!email || !password){
        showError('Enter your email and password to continue.');
        return;
      }
      if(password.length < 6){
        showError('Password must be at least 6 characters.');
        return;
      }
      setCommunityAccount(email);
      loginForm.reset();
      syncCommunityModal();
      if(result){
        result.textContent = `Welcome back! Local crews are now unlocked for ${email}.`;
      }
    });
  }

  if(searchInput){
    searchInput.addEventListener('input', ()=>{
      renderCommunityList(searchInput.value);
    });
  }

  if(list){
    list.addEventListener('click', (e)=>{
      const btn = e.target instanceof Element ? e.target.closest('[data-community-action]') : null;
      if(!btn) return;
      e.preventDefault();
      const action = btn.getAttribute('data-community-action');
      const id = btn.getAttribute('data-community-id');
      handleCommunityAction(action, id);
    });
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=>{
      clearCommunityAccount();
      if(result){
        result.textContent = '';
      }
      syncCommunityModal(true);
    });
  }

  syncCommunityModal();
}

function openCommunitiesModal(){
  if(!communitiesModalRefs || !communitiesModalRefs.modal){
    setupCommunitiesModal();
  }
  const modal = communitiesModalRefs?.modal || document.querySelector('#communitiesModal');
  if(!modal) return;
  openModal(modal);
  syncCommunityModal();
}

function syncCommunityModal(focusLogin=false){
  if(!communitiesModalRefs) return;
  const {
    modal,
    loginView,
    directoryView,
    loginForm,
    loginError,
    searchInput,
    list,
    emptyState,
    result
  } = communitiesModalRefs;

  const account = getCommunityAccount();
  const loggedIn = Boolean(account);

  if(loginView) loginView.hidden = loggedIn;
  if(directoryView) directoryView.hidden = !loggedIn;
  if(modal){
    modal.setAttribute('aria-labelledby', loggedIn ? 'communitiesDirectoryTitle' : 'communitiesTitle');
  }

  if(loggedIn){
    if(loginError){
      loginError.hidden = true;
      loginError.textContent = '';
    }
    renderCommunityList(searchInput ? searchInput.value : '');
    if(searchInput){
      setTimeout(()=> searchInput.focus({preventScroll:true}), 80);
    }
  }else{
    if(searchInput){
      searchInput.value = '';
    }
    if(list){
      list.innerHTML = '';
    }
    if(emptyState){
      emptyState.hidden = true;
    }
    if(result){
      result.textContent = '';
    }
    if(loginError){
      loginError.hidden = true;
      loginError.textContent = '';
    }
    if(loginForm && focusLogin){
      const firstField = loginForm.querySelector('input');
      if(firstField){
        setTimeout(()=> firstField.focus({preventScroll:true}), 80);
      }
    }
  }
}

function renderCommunityList(query=''){
  if(!communitiesModalRefs) return;
  const {list, emptyState} = communitiesModalRefs;
  const account = getCommunityAccount();
  if(!list) return;

  list.innerHTML = '';
  if(emptyState){
    emptyState.hidden = true;
  }

  if(!account){
    return;
  }

  const normalized = (query || '').trim().toLowerCase();
  const matches = COMMUNITY_DIRECTORY.filter((comm)=>{
    if(!normalized) return true;
    const haystack = [comm.name, comm.city, comm.state, comm.summary, comm.meet, ...(comm.tags||[])].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });

  if(!matches.length){
    if(emptyState){
      emptyState.hidden = false;
    }
    return;
  }

  const frag = document.createDocumentFragment();
  matches.forEach((comm)=>{
    const li = document.createElement('li');
    li.className = 'community-list__item';
    li.innerHTML = `
      <article class="community-card">
        <div class="community-card__header">
          <h3>${comm.name}</h3>
          <span class="community-card__location">${comm.city}, ${comm.state}</span>
        </div>
        <p class="community-card__summary">${comm.summary}</p>
        <dl class="community-card__meta">
          <div><dt>Meet</dt><dd>${comm.meet}</dd></div>
          <div><dt>Venue</dt><dd>${comm.venue}</dd></div>
        </dl>
        <div class="community-card__actions">
          <button class="btn btn--small" data-community-action="join" data-community-id="${comm.id}">Join this crew</button>
          <button class="btn btn--ghost btn--small" data-community-action="details" data-community-id="${comm.id}">View details</button>
        </div>
      </article>`;
    frag.appendChild(li);
  });
  list.appendChild(frag);
}

function handleCommunityAction(action, id){
  if(!action || !id) return;
  const account = getCommunityAccount();
  if(!account){
    if(communitiesModalRefs?.showError){
      communitiesModalRefs.showError('Log in to join or view community details.');
    }
    syncCommunityModal(true);
    return;
  }
  const community = COMMUNITY_DIRECTORY.find((comm)=> comm.id === id);
  if(!community) return;
  const result = communitiesModalRefs?.result;
  if(!result) return;
  if(action === 'join'){
    result.textContent = `We saved you a spot with ${community.name}. Keep an eye on ${account.email} for next steps.`;
  }else{
    result.textContent = `${community.name} meets at ${community.venue}. Next meetup: ${community.meet}. ${community.summary}`;
  }
}

function getCommunityAccount(){
  if(typeof window === 'undefined' || !('localStorage' in window)) return null;
  try{
    const raw = window.localStorage.getItem(COMMUNITY_AUTH_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    if(parsed && typeof parsed.email === 'string'){
      return parsed;
    }
  }catch{
    return null;
  }
  return null;
}

function setCommunityAccount(email){
  if(typeof window === 'undefined' || !('localStorage' in window)) return;
  try{
    window.localStorage.setItem(COMMUNITY_AUTH_KEY, JSON.stringify({email, ts: Date.now()}));
  }catch{
    /* ignore */
  }
}

function clearCommunityAccount(){
  if(typeof window === 'undefined' || !('localStorage' in window)) return;
  try{
    window.localStorage.removeItem(COMMUNITY_AUTH_KEY);
  }catch{
    /* ignore */
  }
}

// Social switcher logic (Community)
function setupSocialSwitcher(){
  const tablist = document.querySelector('.social-switcher');
  if(!tablist) return;
  tablist.setAttribute('role','tablist');
  const tabs = $$('.social-icon', tablist);
  if(!tabs.length) return;
  const content = document.querySelector('.social-content');
  const panes = content ? $$('.social-pane', content) : [];
  const paneByPlatform = panes.reduce((acc, pane)=>{
    const platform = pane.getAttribute('data-platform');
    if(platform){
      if(!pane.id){
        pane.id = `social-pane-${platform}`;
      }
      acc[platform] = pane;
    }
    return acc;
  }, {});
  tabs.forEach(tab=>{
    const platform = tab.getAttribute('data-platform');
    if(platform && paneByPlatform[platform]){
      tab.setAttribute('aria-controls', paneByPlatform[platform].id);
    }
  });

  const show = (platform, initial=false)=>{
    if(!platform) return;
    if(currentPlatform === platform && !initial) return;
    if(content){
      content.hidden = false;
      requestAnimationFrame(()=> content.classList.add('is-open'));
    }
    panes.forEach(pane=>{
      const match = pane.getAttribute('data-platform') === platform;
      pane.hidden = !match;
      pane.classList.toggle('is-visible', match);
    });
    tabs.forEach(tab=>{
      const match = tab.getAttribute('data-platform') === platform;
      tab.classList.toggle('is-active', match);
      tab.setAttribute('aria-selected', match ? 'true' : 'false');
      tab.setAttribute('tabindex', match ? '0' : '-1');
      if(match && !initial){
        tab.focus({preventScroll:true});
      }
    });
    currentPlatform = platform;
    if(platform === 'instagram'){
      setTimeout(processInstagramEmbeds, 50);
    }
    if(platform === 'youtube'){
      setTimeout(ensureYouTubeEmbeds, 10);
    }
  };

  const focusByOffset = (fromIndex, delta)=>{
    const nextIndex = (fromIndex + delta + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    if(nextTab){
      show(nextTab.getAttribute('data-platform'));
    }
  };

  tabs.forEach((tab)=>{
    tab.setAttribute('role','tab');
    tab.setAttribute('tabindex', '-1');
    tab.addEventListener('click', ()=>{
      show(tab.getAttribute('data-platform'));
    });
    tab.addEventListener('keydown', (event)=>{
      const index = tabs.indexOf(tab);
      if(event.key === 'ArrowRight' || event.key === 'ArrowDown'){
        event.preventDefault();
        focusByOffset(index, 1);
      }
      if(event.key === 'ArrowLeft' || event.key === 'ArrowUp'){
        event.preventDefault();
        focusByOffset(index, -1);
      }
    });
  });

  const initial = tabs.find(tab=> tab.classList.contains('is-active'))?.getAttribute('data-platform')
    || panes.find(pane=> pane.classList.contains('is-visible'))?.getAttribute('data-platform')
    || tabs[0].getAttribute('data-platform');
  show(initial, true);
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
