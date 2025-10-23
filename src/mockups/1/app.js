// PWA: Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  });
}

/* ===================== MINI ROUTER ===================== */
const routes = {
  '#/home':'page-home',
  '#/shop':'page-shop',
  '#/product/y-01':'page-product',
  '#/product/wp-01':'page-product',
  '#/product/cp-01':'page-product',
  '#/product/cm-01':'page-product',
  '#/ingredients':'page-ingredients',
  '#/research':'page-research',
  '#/learn':'page-ingredients',
  '#/about':'page-about',
  '#/search':'page-search',
  '#/account':'page-account',
  '#/cart':'page-cart',
};
function render(){
  const hash = location.hash || '#/home';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  (document.getElementById(routes[hash]) || document.getElementById('page-home')).classList.add('active');
  // nav active
  document.querySelectorAll('header nav a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href')===hash);
  });
  // seed product data
  if(routes[hash]==='page-product'){
    const map = {
      '#/product/y-01':['Y-01™ Organic Protein + Recovery','../../assets/yuck-demo-supplement/Supplement.png','£32.00','£40.00','All products ▸ Y-01'],
      '#/product/wp-01':['WP-01™ Organic Whey','../../assets/yuck-demo-supplement/MultipleSupplement.png','£55.00','£55.00','All products ▸ WP-01'],
      '#/product/cp-01':['CP-01™ Collagen Peptides','../../assets/yuck-demo-supplement/SourSupplement.png','£40.00','£40.00','All products ▸ CP-01'],
      '#/product/cm-01':['CM-01™ Creatine Monohydrate','../../assets/images/plasticbag.png','£38.00','£38.00','All products ▸ CM-01'],
    };
    const [title,img,price,cross,crumb]=map[hash]||map['#/product/y-01'];
    document.getElementById('pd-title').textContent=title;
    document.getElementById('pd-price').textContent=price;
    document.getElementById('buyPrice').textContent=price;
    document.getElementById('pd-cross').textContent=cross;
    document.getElementById('pd-crumb').textContent=crumb;
    document.getElementById('pd-main').style.backgroundImage=`url('${img}')`;
  }
}
window.addEventListener('hashchange', render); render();

/* ===================== Thumbs swap ===================== */
document.querySelectorAll('.pd-thumbs div').forEach(d=>{
  d.addEventListener('click',()=>{ document.getElementById('pd-main').style.backgroundImage=`url('${d.dataset.src}')`; });
});

/* ===================== Subscribe vs One-time ===================== */
const subBtn=document.getElementById('subBtn');
const oneBtn=document.getElementById('oneBtn');
const subBox=document.getElementById('subBox');
function setMode(m){
  if(!subBtn || !oneBtn) return;
  if(m==='sub'){ subBtn.classList.add('active'); oneBtn.classList.remove('active'); subBox.style.display='block';
    const p=document.getElementById('pd-price').textContent; document.getElementById('buyPrice').textContent=p;
  }else{ oneBtn.classList.add('active'); subBtn.classList.remove('active'); subBox.style.display='none';
    const p=parseFloat(document.getElementById('pd-price').textContent.replace('£',''))+8; document.getElementById('buyPrice').textContent='£'+p.toFixed(2);
  }
}
subBtn?.addEventListener('click',()=>setMode('sub'));
oneBtn?.addEventListener('click',()=>setMode('one'));

/* ===================== AG1-style chooser ===================== */
const nextStep=document.getElementById('nextStep');
const finish=document.getElementById('finish');
const step1=document.getElementById('step1');
const step2=document.getElementById('step2');
const prog=document.getElementById('prog');
const stepLabel=document.getElementById('stepLabel');
document.querySelectorAll('#step1 .option').forEach(o=>o.addEventListener('click',()=>{document.querySelectorAll('#step1 .option').forEach(x=>x.classList.remove('active')); o.classList.add('active');}));
document.querySelectorAll('#step2 .option').forEach(o=>o.addEventListener('click',()=>{document.querySelectorAll('#step2 .option').forEach(x=>x.classList.remove('active')); o.classList.add('active');}));
nextStep?.addEventListener('click',()=>{ step1.style.display='none'; step2.style.display='block'; prog.style.width='100%'; stepLabel.textContent='2 of 2'; });
finish?.addEventListener('click',()=>{ alert('Selection added (demo).'); });

/* ===================== Accordion ===================== */
document.querySelectorAll('.acc-head').forEach(h=>{
  h.addEventListener('click',()=>h.parentElement.classList.toggle('open'));
});

/* ===================== Forms ===================== */
document.getElementById('joinForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const email=e.target.email.value.trim(); const msg=document.getElementById('joinMsg');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ msg.textContent='Enter a valid email.'; msg.style.color='#B14D4F'; return; }
  msg.textContent='Invite requested. Check your inbox.'; msg.style.color='#358646'; e.target.reset();
});
document.getElementById('newsForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const input=e.target.querySelector('input'); const msg=document.getElementById('newsMsg');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())){ msg.textContent='Please enter a valid email.'; msg.style.color='#B14D4F'; return; }
  msg.textContent='Subscribed!'; msg.style.color='#FFFFFF'; input.value='';
});

/* ===================== Footer year ===================== */
document.getElementById('year').textContent=new Date().getFullYear();