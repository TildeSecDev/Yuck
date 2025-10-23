const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

const labState = {
  sour: 62,
  bitter: 45,
  buzz: 78,
  enhancers: new Set(['capsaicin', 'spirulina'])
};

const enhancersCopy = {
  capsaicin: 'Capsaicin drip · delayed burn guaranteed.',
  kava: 'Kava foam · numbs the cheeks in 4.2 seconds.',
  spirulina: 'Spirulina haze · algae-green sheen for the post selfie.'
};

const timelineEntries = [
  {
    id: '2-04',
    title: 'Prototype 2.04 — Shockwave Nectar',
    description: 'Shockwave Nectar',
    summary: 'An uppercut of lemon peel layered with fermented pineapple. Kept the testers buzzing for 16 hours.',
    notes: ['Batch yield: 14 bottles', 'Reported face scrunch: 97%', 'Recovery snacks required: 3']
  },
  {
    id: '2-07',
    title: 'Prototype 2.07 — Midnight Circuit',
    description: 'Midnight Circuit',
    summary: 'Molasses-black brew with electric spearmint. Emits a faint purple glow when shaken.',
    notes: ['Batch yield: 6 bottles', 'Testers who finished: 3 of 11', 'Notable side effect: neon tongue']
  },
  {
    id: '2-12',
    title: 'Prototype 2.12 — Glacier Static',
    description: 'Glacier Static',
    summary: 'Hyper-chilled concentrate. Mixes powdered dry ice with arctic berry rind for a numbing dropkick.',
    notes: ['Batch yield: 9 bottles', 'Reported brain freeze: 81%', 'Lab note: handle with cryo gloves']
  },
  {
    id: '2-18',
    title: 'Prototype 2.18 — Solar Vines',
    description: 'Solar Vines',
    summary: 'Fermented mango meets fireflower pollen. Causes audible crackling as it oxidises.',
    notes: ['Batch yield: 20 bottles', 'Heat rating: 9.2/10', 'Observation: bottles swell after 6 hours']
  }
];

function initNavToggle(){
  const toggle = $('#navToggle');
  const nav = $('#siteNav');
  if(!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', event => {
    if(event.target.matches('a')){
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function computeBlend(){
  const { sour, bitter, buzz } = labState;
  const intensity = Math.round((sour * 0.4) + (bitter * 0.25) + (buzz * 0.35));
  const enhancerTags = Array.from(labState.enhancers);
  const moodSeeds = ['Shockwave', 'Voltage', 'Glacier', 'Cinder', 'Vortex', 'Static'];
  const suffixSeeds = ['Nectar', 'Serum', 'Splice', 'Rift', 'Drip', 'Draft'];
  const seedIndex = Math.min(moodSeeds.length - 1, Math.floor(intensity / 16));
  const suffixIndex = Math.min(suffixSeeds.length - 1, Math.max(0, enhancerTags.length - 1));
  const blendName = `${moodSeeds[seedIndex]} ${suffixSeeds[suffixIndex]}`;
  const stability = Math.max(0, Math.min(100, 100 - Math.abs(50 - intensity)));
  return { intensity, blendName, stability };
}

function updateLabOutputs(){
  const { intensity, blendName, stability } = computeBlend();
  $('#labLabel').textContent = blendName;
  $('#voltage').textContent = `${intensity}%`;
  $('#heat').textContent = `${(labState.buzz / 20 + labState.sour / 40).toFixed(1)} scovilles`;
  $('#gaugeNeedle').style.transform = `rotate(${Math.round((intensity / 100) * 160 - 80)}deg)`;
  $('#labSummary').textContent = describeBlend();
  $('#beakerLiquid').style.height = `${45 + Math.round(intensity / 2)}%`;
  const enhancerList = $('#enhancerList');
  enhancerList.innerHTML = '';
  if(labState.enhancers.size === 0){
    enhancerList.innerHTML = '<li>No enhancers selected.</li>';
  }else{
    labState.enhancers.forEach(key => {
      const item = document.createElement('li');
      item.textContent = enhancersCopy[key];
      enhancerList.appendChild(item);
    });
  }
}

function describeBlend(){
  const { sour, bitter, buzz } = labState;
  const heat = buzz > 70 ? 'volcanic crackle' : buzz > 45 ? 'steady sizzle' : 'low hum';
  const tart = sour > 70 ? 'face-pinching citrus blast' : sour > 40 ? 'lean, acidic whip' : 'mildly tart undercurrent';
  const finish = bitter > 60 ? 'charred cacao finish' : bitter > 30 ? 'herbal aftertaste' : 'clean exit';
  const stacked = Array.from(labState.enhancers).map(key => key).join(', ');
  return `${tart} with a ${heat} and ${finish}. Enhancers locked: ${stacked || 'minimalist base only'}.`;
}

function bindRangeInputs(){
  $$("[data-range]").forEach(input => {
    input.addEventListener('input', () => {
      labState[input.dataset.range] = Number(input.value);
      updateLabOutputs();
    });
  });
}

function bindEnhancers(){
  $$("[data-enhancer]").forEach(box => {
    if(box.checked) labState.enhancers.add(box.dataset.enhancer);
    box.addEventListener('change', () => {
      const key = box.dataset.enhancer;
      if(box.checked) labState.enhancers.add(key);
      else labState.enhancers.delete(key);
      updateLabOutputs();
    });
  });
}

function renderTimeline(){
  const list = $('#timelineList');
  list.innerHTML = '';
  timelineEntries.forEach((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = entry.title;
    button.dataset.id = entry.id;
    if(index === 0) button.classList.add('is-active');
    button.addEventListener('click', () => updateTimeline(entry.id));
    const item = document.createElement('li');
    item.appendChild(button);
    list.appendChild(item);
  });
}

function updateTimeline(id){
  const entry = timelineEntries.find(item => item.id === id);
  if(!entry) return;
  $$('#timelineList button').forEach(btn => btn.classList.toggle('is-active', btn.dataset.id === id));
  const detail = $('#timelineDetail');
  detail.innerHTML = `
    <h3>${entry.title}</h3>
    <p class="muted">${entry.summary}</p>
    <ul class="muted">
      ${entry.notes.map(note => `<li>${note}</li>`).join('')}
    </ul>
  `;
}

function bindLabForm(){
  const form = $('#labForm');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const { blendName } = computeBlend();
    const queue = JSON.parse(localStorage.getItem('yuck_lab_logs') || '[]');
    const submission = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
      blend: blendName,
      sliders: { ...labState },
      createdAt: new Date().toISOString()
    };
    queue.push(submission);
    localStorage.setItem('yuck_lab_logs', JSON.stringify(queue.slice(-40)));
    const reviewHours = (1 + Math.round(Math.random() * 5));
    $('#labHelper').textContent = `${blendName} queued for review in ${reviewHours} hour${reviewHours === 1 ? '' : 's'}.`;
    bumpLabCount();
    showToast('Flavor logged. Lab chiefs notified.');
  });
}

function bumpLabCount(){
  const el = $('#labCount');
  const next = Number(el.textContent.replace(/,/g, '')) + 1;
  el.textContent = next.toLocaleString();
}

function bindJoinForm(){
  const form = $('#joinForm');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const entry = Object.fromEntries(formData.entries());
    entry.timestamp = new Date().toISOString();
    const stored = JSON.parse(localStorage.getItem('yuck_guild_applications') || '[]');
    stored.push(entry);
    localStorage.setItem('yuck_guild_applications', JSON.stringify(stored.slice(-25)));
    form.reset();
    $('#joinNote').textContent = 'Submission received. Expect a rejection letter within 72 hours.';
    showToast('Dossier received. Your bravery is noted.');
  });
}

function bindAudioDemo(){
  const button = $('#playDemo');
  if(!button) return;
  let ctx = null;
  button.addEventListener('click', async () => {
    try {
      if(!ctx){
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 90 + Math.random() * 60;
      gain.gain.value = 0.0015;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 2.4);
      osc.stop(ctx.currentTime + 2.5);
      button.disabled = true;
      button.textContent = 'Tasting audio playing...';
      setTimeout(() => {
        button.disabled = false;
        button.textContent = 'Play the tasting audio';
      }, 2600);
    } catch(err){
      console.warn('Audio context blocked', err);
      showToast('Audio blocked. Allow sound to hear the tasting log.');
    }
  });
}

function showToast(message){
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

function updateYear(){
  $('#year').textContent = new Date().getFullYear();
}

function installPWA(){
  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(err => {
        console.warn('SW registration failed', err);
      });
    });
  }

  window.addEventListener('appinstalled', () => {
    showToast('Installed! You now have offline access to the lab.');
  });
}

function setup(){
  initNavToggle();
  bindRangeInputs();
  bindEnhancers();
  bindLabForm();
  bindJoinForm();
  bindAudioDemo();
  renderTimeline();
  updateTimeline(timelineEntries[0].id);
  updateLabOutputs();
  updateYear();
  installPWA();
  tickLabClock();
}

document.addEventListener('DOMContentLoaded', setup);

function tickLabClock(){
  const stat = $('#labTime');
  const base = 42;
  let offset = 0;
  setInterval(() => {
    offset = (offset + 1) % 12;
    const value = base + (offset % 3 === 0 ? 6 : 0);
    stat.textContent = `${value}h`;
  }, 4000);
}
