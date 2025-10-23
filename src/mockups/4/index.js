const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const insightData = [
  {
    id: 'sentiment',
    title: 'Community sentiment',
    summary: 'Disgust trending up 12% in the last cycle.',
    trend: '+12% vs yesterday',
    severity: 'high'
  },
  {
    id: 'supply',
    title: 'Supply burn rate',
    summary: 'Warehouse B drained 340 crates of batch 3A.',
    trend: 'Burn 62% of forecast',
    severity: 'medium'
  },
  {
    id: 'labs',
    title: 'Lab throughput',
    summary: '28 active experiments, 4 flagged as “accidentally tasty”.',
    trend: '4 flagged anomalies',
    severity: 'low'
  },
  {
    id: 'social',
    title: 'Social chatter',
    summary: '#YuckChallenge trending in 3 cities. 18% conversion.',
    trend: '18% conversion',
    severity: 'medium'
  },
  {
    id: 'ops',
    title: 'Ops efficiency',
    summary: 'Delivery drones completed 92% of drop-offs on time.',
    trend: '92% completion',
    severity: 'low'
  }
];

const reports = [
  {
    id: 'r1',
    title: 'Crater Bay tasting',
    body: 'Night session produced 11 immediate grimaces. Two testers asked for seconds (investigate).',
    region: 'americas',
    severity: 'critical',
    timestamp: '16 minutes ago'
  },
  {
    id: 'r2',
    title: 'Berlin microcell',
    body: 'Stability holding at 92%. Noise complaint triggered by vanishing fog machine.',
    region: 'emea',
    severity: 'warning',
    timestamp: '41 minutes ago'
  },
  {
    id: 'r3',
    title: 'Singapore pop-up',
    body: 'Sour plum sachets melted a countertop. New signage deployed warning of surface corrosion.',
    region: 'apac',
    severity: 'warning',
    timestamp: '58 minutes ago'
  },
  {
    id: 'r4',
    title: 'Detroit garage gym',
    body: 'Converted 6 new loyalists after “mystery sludge” challenge. Inventory down to 12 boxes.',
    region: 'americas',
    severity: 'info',
    timestamp: '1 hour ago'
  },
  {
    id: 'r5',
    title: 'Lisbon riverfront',
    body: 'Unexpected breeze made the scent tolerable. Sentiment dipped to 6.1 disgust — corrective batch requested.',
    region: 'emea',
    severity: 'critical',
    timestamp: '2 hours ago'
  }
];

const signals = [
  {
    id: 'sig1',
    title: 'Sentiment spike automation',
    copy: 'If disgust rating > 8.5 for 3 consecutive hours, auto-email product science and reroute shipments.',
    status: 'Armed'
  },
  {
    id: 'sig2',
    title: 'Inventory drip alert',
    copy: 'Trigger Slack alert when inventory burn > 70% with fewer than 6 restock requests open.',
    status: 'Armed'
  },
  {
    id: 'sig3',
    title: 'Cravings anomaly monitor',
    copy: 'Flag labs where testers ask for seconds. Auto-create Jira ticket tagged “Palate leak”.',
    status: 'Watching'
  },
  {
    id: 'sig4',
    title: 'Weather-based chaos mode',
    copy: 'Enable outdoor tastings when sideways rain probability > 65% to boost misery conversion.',
    status: 'Idle'
  }
];

const pinnedKey = 'yuck_field_pinned_cards';
const themeKey = 'yuck_field_theme';

function init(){
  renderInsights();
  renderReports('all');
  renderSignals();
  bindFilters();
  bindSyncButton();
  bindFlagButton();
  bindSubscribe();
  initTheme();
  updateYear();
  installPwa();
}

document.addEventListener('DOMContentLoaded', init);

function renderInsights(){
  const grid = $('#insightGrid');
  const pinned = getPinned();
  const sorted = [...insightData].sort((a, b) => {
    const aPinned = pinned.includes(a.id) ? 1 : 0;
    const bPinned = pinned.includes(b.id) ? 1 : 0;
    if(aPinned !== bPinned) return bPinned - aPinned;
    return 0;
  });
  grid.innerHTML = '';
  sorted.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    if(pinned.includes(item.id)) card.classList.add('is-pinned');
    card.setAttribute('tabindex', '0');
    card.dataset.id = item.id;
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <span class="trend">${item.trend}</span>
    `;
    card.addEventListener('click', () => togglePin(item.id));
    card.addEventListener('keypress', event => {
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        togglePin(item.id);
      }
    });
    grid.appendChild(card);
  });
}

function togglePin(id){
  const pinned = new Set(getPinned());
  if(pinned.has(id)) pinned.delete(id);
  else pinned.add(id);
  localStorage.setItem(pinnedKey, JSON.stringify(Array.from(pinned)));
  renderInsights();
  showToast(pinned.has(id) ? 'Card pinned for leadership review.' : 'Card unpinned.');
}

function getPinned(){
  try {
    return JSON.parse(localStorage.getItem(pinnedKey) || '[]');
  } catch(err){
    return [];
  }
}

function renderReports(region){
  const feed = $('#reportFeed');
  const filtered = region === 'all' ? reports : reports.filter(report => report.region === region);
  feed.innerHTML = '';
  filtered.forEach(report => {
    const article = document.createElement('article');
    article.className = 'report';
    article.innerHTML = `
      <div>
        <h3>${report.title}</h3>
        <p>${report.body}</p>
      </div>
      <div class="report__meta">
        <span class="report__severity">${report.severity}</span>
        <span>${report.timestamp}</span>
        <span>${report.region.toUpperCase()}</span>
      </div>
    `;
    feed.appendChild(article);
  });
  if(filtered.length === 0){
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No field reports available for this region yet.';
    feed.appendChild(empty);
  }
  $$('.chip').forEach(button => button.classList.toggle('is-active', button.dataset.region === region));
}

function renderSignals(){
  const grid = $('#signalGrid');
  grid.innerHTML = '';
  signals.forEach(signal => {
    const card = document.createElement('article');
    card.className = 'signal-card';
    card.innerHTML = `
      <strong>${signal.title}</strong>
      <p class="muted">${signal.copy}</p>
      <span>Status: ${signal.status}</span>
    `;
    grid.appendChild(card);
  });
}

function bindFilters(){
  $$('.chip').forEach(button => {
    button.addEventListener('click', () => {
      const region = button.dataset.region;
      renderReports(region);
      showToast(`Filtered reports: ${region.toUpperCase()}`);
    });
  });
}

function bindSyncButton(){
  $('#syncBtn').addEventListener('click', () => {
    const experiments = 24 + Math.floor(Math.random() * 8);
    $('#metricExperiments').textContent = experiments;
    const disgust = (8.2 + Math.random() * 0.9).toFixed(1);
    $('#metricDisgust').textContent = disgust;
    const inventory = `${55 + Math.floor(Math.random() * 20)}%`;
    $('#metricInventory').textContent = inventory;
    $('#anomaly').textContent = pickAnomaly();
    showToast('Telemetry synced. Data may still smell weird.');
  });
}

function bindFlagButton(){
  $('#flagBtn').addEventListener('click', () => {
    showToast('Anomaly escalated to command. Expect a swarm of analysts.');
  });
}

function bindSubscribe(){
  $('#subscribeForm').addEventListener('submit', event => {
    event.preventDefault();
    const email = $('#email').value.trim();
    if(!email) return;
    const stored = JSON.parse(localStorage.getItem('yuck_field_subscribers') || '[]');
    stored.push({ email, ts: new Date().toISOString() });
    localStorage.setItem('yuck_field_subscribers', JSON.stringify(stored.slice(-50)));
    $('#email').value = '';
    $('#subscribeNote').textContent = 'Subscribed. Alerts will arrive at the worst possible time.';
    showToast('Subscription saved. Enjoy the chaos.');
  });
}

function pickAnomaly(){
  const anomalies = [
    'Fermented rhubarb blend caused unexpected cravings in 12% of testers. Investigate palatability leak.',
    'Citrus asphalt prototype turned neon purple under blacklight. Marketing intrigued.',
    'Protein sludge batch 9B is dangerously pleasant. Reassign to sabotage unit.',
    'Heat index sensors misfiring after exposure to ghost pepper vapor. Replace hardware.'
  ];
  return anomalies[Math.floor(Math.random() * anomalies.length)];
}

function updateYear(){
  $('#year').textContent = new Date().getFullYear();
}

function showToast(message){
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function initTheme(){
  const saved = localStorage.getItem(themeKey);
  const initial = saved === 'light' ? 'light' : 'dark';
  setTheme(initial);
  const toggle = $('#themeToggle');
  toggle.setAttribute('aria-pressed', initial === 'light' ? 'true' : 'false');
  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    toggle.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
    showToast(`Theme set to ${next}.`);
  });
}

function setTheme(mode){
  document.documentElement.dataset.theme = mode;
  localStorage.setItem(themeKey, mode);
}

function installPwa(){
  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('SW registration failed', err));
    });
  }
  window.addEventListener('appinstalled', () => {
    showToast('Field dashboard installed. Offline briefs ready.');
  });
}
