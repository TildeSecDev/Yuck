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
  '#/about':'page-about',
  '#/community':'page-community',
  '#/product/op-16':'page-product',
  '#/product/wp-01':'page-product',
  '#/product/cp-01':'page-product',
  '#/product/cm-01':'page-product',
  '#/search':'page-search',
  '#/account':'page-account',
  '#/cart':'page-cart',
};

function render(){
  const hash = location.hash || '#/home';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pageId = routes[hash] || 'page-home';
  document.getElementById(pageId).classList.add('active');

  // nav active
  document.querySelectorAll('header nav a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href')===hash);
  });

  // seed product detail title based on route
  if (pageId==='page-product'){
    const map = {
      '#/product/op-16': ['Y-01™ Organic Protein + Recovery Blend', '../../assets/yuck-demo-supplement/Supplement.png', '£32.00','All products ▸ Y-01'],
      '#/product/wp-01': ['WP-01™ Organic Whey Protein', '../../assets/yuck-demo-supplement/MultipleSupplement.png', '£55.00','All products ▸ WP-01'],
      '#/product/cp-01': ['CP-01™ Collagen Peptides', '../../assets/yuck-demo-supplement/SourSupplement.png', '£40.00','All products ▸ CP-01'],
      '#/product/cm-01': ['CM-01™ Creatine Monohydrate', '../../assets/images/plasticbag.png', '£38.00','All products ▸ CM-01']
    };
    const [title,img,price,crumb] = map[hash] || map['#/product/op-16'];
    document.getElementById('pd-title').textContent = title;
    document.getElementById('pd-price').textContent = price;
    document.getElementById('buyPrice').textContent = price;
    document.getElementById('pd-breadcrumb').textContent = crumb;
    document.getElementById('pd-main').style.backgroundImage = `url('${img}')`;
  }
}
window.addEventListener('hashchange', render);
render();

/* ===================== PRODUCT DETAIL INTERACTIONS ===================== */
document.querySelectorAll('.pd-thumbs div').forEach(t=>{
  t.addEventListener('click', ()=>{
    const src = t.dataset.src;
    document.getElementById('pd-main').style.backgroundImage = `url('${src}')`;
  });
});
const subBtn = document.getElementById('subBtn');
const oneBtn = document.getElementById('oneBtn');
const subBox = document.getElementById('subBox');
subBtn?.addEventListener('click', ()=>{
  subBtn.classList.add('active'); oneBtn.classList.remove('active'); subBox.style.display='block';
  document.getElementById('buyPrice').textContent = document.getElementById('pd-price').textContent;
});
oneBtn?.addEventListener('click', ()=>{
  oneBtn.classList.add('active'); subBtn.classList.remove('active'); subBox.style.display='none';
  // naive example of toggled price display
  const p = document.getElementById('pd-price').textContent.replace('£','');
  const one = (Number(p) + 8).toFixed(2);
  document.getElementById('buyPrice').textContent = '£'+one;
});
document.getElementById('year').textContent = new Date().getFullYear();
