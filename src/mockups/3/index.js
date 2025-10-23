const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const eventStart = new Date('2024-04-19T15:00:00Z');

const schedule = [
  {
    time: 'Hour 0-6',
    title: 'Arrival & palatability stress test',
    copy: 'Teams check in, surrender all pleasant snacks, and cycle through three Yuck tasting intensities. Points awarded for composure.'
  },
  {
    time: 'Hour 6-18',
    title: 'The grind staircase',
    copy: 'Weighted stair climbs, electrolyte puzzles, midnight swamp runs, and forced motivational speaking while drinking warm Yuck.'
  },
  {
    time: 'Hour 18-36',
    title: 'Sleep deprivation derby',
    copy: 'Participants rotate between micro-naps and high intensity sprints. Judges conduct surprise flavor blindfolds.'
  },
  {
    time: 'Hour 36-48',
    title: 'Final gauntlet & debrief',
    copy: 'A labyrinth of obstacle stations culminating in the final one-liter chug. Survivors debrief live on stage.'
  }
];

const modules = [
  {
    id: 'cold-dunks',
    title: 'Cold dunk conditioning',
    tag: 'Module 01',
    copy: 'Fill your tub with ice, drink 150ml of Yuck, and record your composure score every five minutes.',
    progress: 65
  },
  {
    id: 'flavor-hacking',
    title: 'Flavor hacking drills',
    tag: 'Module 02',
    copy: 'Practice tasting each prototype without making a face. Upload evidence to unlock the next module.',
    progress: 35
  },
  {
    id: 'midnight-intervals',
    title: 'Midnight interval runs',
    tag: 'Module 03',
    copy: 'Set alarms for 01:00 and 03:00. Run 800m, chug a Yuck packet, repeat. Log your split times.',
    progress: 48
  },
  {
    id: 'squad-strategy',
    title: 'Squad strategy sync',
    tag: 'Module 04',
    copy: 'Assign roles, designate your hydration captain, and train a backup who can stomach the sour burst series.',
    progress: 72
  }
];

const faqs = [
  {
    q: 'How brutal is the taste scale this year?',
    a: 'We extended the Yuck scale from 1-10 to 1-13. Expect acidulated grape, charcoal tonic, and kelp latte samples. Bring nothing but grit.'
  },
  {
    q: 'Do we sleep at all?',
    a: 'Power naps are permitted between hour 18 and 36, but only while wearing the hydration backpack. Fail the random wake-up drill and you lose points.'
  },
  {
    q: 'What gear is mandatory?',
    a: 'Trail shoes, thermal layers, headlamp, and a willingness to drink things that smell like old batteries. We supply the rest.'
  },
  {
    q: 'Can spectators attend?',
    a: 'Yes. They have to sign the waiver acknowledging the smell, but they cheer you on and sample the rejection batches.'
  }
];

function renderSchedule(){
  const wrap = $('#timeline');
  wrap.innerHTML = '';
  schedule.forEach(item => {
    const block = document.createElement('article');
    block.className = 'timeline-item';
    block.innerHTML = `
      <div>
        <strong>${item.time}</strong>
      </div>
      <div>
        <h3>${item.title}</h3>
        <p>${item.copy}</p>
      </div>
    `;
    wrap.appendChild(block);
  });
}

function renderModules(){
  const grid = $('#moduleGrid');
  grid.innerHTML = '';
  modules.forEach(module => {
    const card = document.createElement('article');
    card.className = 'module-card';
    card.innerHTML = `
      <header>
        <span class="badge">${module.tag}</span>
        <span>${module.progress}% ready</span>
      </header>
      <h3>${module.title}</h3>
      <p>${module.copy}</p>
      <progress max="100" value="${module.progress}"></progress>
      <button class="btn btn--ghost" type="button" data-module="${module.id}">Mark 10% complete</button>
    `;
    grid.appendChild(card);
  });
}

function renderFaq(){
  const list = $('#faqList');
  list.innerHTML = '';
  faqs.forEach(({ q, a }, index) => {
    const details = document.createElement('details');
    if(index === 0) details.open = true;
    details.innerHTML = `
      <summary>${q}</summary>
      <p>${a}</p>
    `;
    list.appendChild(details);
  });
}

function startCountdown(){
  const out = $('#countdown');
  function update(){
    const now = new Date();
    const diff = eventStart - now;
    if(diff <= 0){
      out.textContent = 'LIVE';
      return;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const formatted = `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    out.textContent = formatted;
  }
  update();
  setInterval(update, 1000);
}

function updateYear(){
  $('#year').textContent = new Date().getFullYear();
}

function initNav(){
  const nav = $('#mainNav');
  const trigger = $('#navTrigger');
  trigger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', event => {
    if(event.target.tagName === 'A'){
      nav.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

function telemetryFeed(){
  const feed = $('#telemetry');
  const events = [
    'Team Acidic Owls completed Module 02 without flinching.',
    'Prototype batch #221 leaked neon foam during testing.',
    'Weather alert: sideways rain forecast for hour 17.',
    'Survivor Coach D announced a bonus midnight stair race.',
    'Packet flavor "Tar Pit Plum" approved for final gauntlet.'
  ];
  const history = [];
  function pushEntry(message){
    const stamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    history.unshift({ stamp, message });
    while(history.length > 6) history.pop();
    feed.innerHTML = history.map(item => `<li><strong>${item.stamp}</strong><span>${item.message}</span></li>`).join('');
  }
  events.forEach((message, index) => {
    setTimeout(() => pushEntry(message), 500 * index);
  });
  setInterval(() => {
    const next = events[Math.floor(Math.random() * events.length)];
    pushEntry(next);
  }, 8000);
}

function bindModules(){
  $('#moduleGrid').addEventListener('click', event => {
    const button = event.target.closest('button[data-module]');
    if(!button) return;
    const id = button.dataset.module;
    const module = modules.find(item => item.id === id);
    if(!module) return;
    module.progress = Math.min(100, module.progress + 10);
    button.parentElement.querySelector('progress').value = module.progress;
    button.parentElement.querySelector('header span:last-of-type').textContent = `${module.progress}% ready`;
    if(module.progress >= 100){
      button.disabled = true;
      button.textContent = 'Module complete';
      showToast(`${module.title} complete! Unlocking next suffering tier.`);
    } else {
      showToast(`${module.title} progress logged. Keep going.`);
    }
  });
}

function bindRegisterForm(){
  const form = $('#registerForm');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const entry = Object.fromEntries(formData.entries());
    entry.submittedAt = new Date().toISOString();
    const stored = JSON.parse(localStorage.getItem('yuck_trials_registrations') || '[]');
    stored.push(entry);
    localStorage.setItem('yuck_trials_registrations', JSON.stringify(stored.slice(-30)));
    form.reset();
    $('#registerNote').textContent = 'Application received. Expect a smell-based interview soon.';
    decrementSlot();
    showToast('Application submitted. Council reviewing your questionable judgment.');
  });
}

function decrementSlot(){
  const el = $('#slotsRemaining');
  const current = Number(el.textContent);
  if(current > 0){
    el.textContent = String(current - 1);
  }
}

function updateTeamsReady(){
  const el = $('#teamsReady');
  setInterval(() => {
    const base = Number(el.textContent);
    const bump = Math.random() > 0.6 ? 1 : 0;
    el.textContent = String(base + bump);
  }, 7000);
}

function bindTrailer(){
  const button = $('#watchTrailer');
  button.addEventListener('click', () => {
    showToast('Imagine a montage of grimacing athletes in the rain. Trailer coming soon.');
  });
}

function showToast(message){
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3400);
}

function installPwa(){
  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('SW failed', err));
    });
  }
  window.addEventListener('appinstalled', () => {
    showToast('Yuck Trials installed. Offline suffering unlocked.');
  });
}

function init(){
  renderSchedule();
  renderModules();
  renderFaq();
  startCountdown();
  updateYear();
  initNav();
  telemetryFeed();
  bindModules();
  bindRegisterForm();
  updateTeamsReady();
  bindTrailer();
  installPwa();
}

document.addEventListener('DOMContentLoaded', init);
