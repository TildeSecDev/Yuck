// PWA: Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  });
}

/* ===================== MINI ROUTER ===================== */
const routes = {
  '#/home': 'page-home',
  '#/shop': 'page-shop',
  '#/product/op-16': 'page-product',
  '#/product/wp-01': 'page-product',
  '#/product/cp-01': 'page-product',
  '#/product/cm-01': 'page-product',
  '#/search': 'page-search',
  '#/account': 'page-account',
  '#/cart': 'page-cart'
};

const pages = document.querySelectorAll('.page');

function render() {
  const hash = location.hash || '#/home';
  pages.forEach(p => p.classList.remove('active'));
  const pageId = routes[hash] || 'page-home';
  const pageEl = document.getElementById(pageId);
  if (pageEl) {
    pageEl.classList.add('active');
  }

  document.querySelectorAll('header nav a').forEach(a => {
    const linkHash = new URL(a.href, window.location.href).hash;
    a.classList.toggle('active', linkHash && linkHash === hash);
  });

  if (pageId === 'page-product') {
    const map = {
      '#/product/op-16': ['Yuck. Original Single', '../../assets/yuck-demo-supplement/Supplement.png', '£32.00', 'All products ▸ Yuck. Original Single'],
      '#/product/wp-01': ['Yuck. Original Multipack x3', '../../assets/yuck-demo-supplement/MultipleSupplement.png', '£55.00', 'All products ▸ Yuck. Original Multipack x3'],
      '#/product/cp-01': ['Yuck. Original Sour', '../../assets/yuck-demo-supplement/SourSupplement.png', '£40.00', 'All products ▸ Yuck. Original Sour'],
      '#/product/cm-01': ['Yuck. Original Spiced', '../../assets/images/YuckPowder.webp', '£38.00', 'All products ▸ Yuck. Original Spiced']
    };
    const [title, img, price, crumb] = map[hash] || map['#/product/op-16'];
    const titleEl = document.getElementById('pd-title');
    const priceEl = document.getElementById('pd-price');
    const buyPriceEl = document.getElementById('buyPrice');
    const crumbEl = document.getElementById('pd-breadcrumb');
    const mainImage = document.getElementById('pd-main');
    if (titleEl) titleEl.textContent = title;
    if (priceEl) priceEl.textContent = price;
    if (buyPriceEl) buyPriceEl.textContent = price;
    if (crumbEl) crumbEl.textContent = crumb;
    if (mainImage) mainImage.style.backgroundImage = `url('${img}')`;
  }
}

if (pages.length) {
  window.addEventListener('hashchange', render);
  render();
}

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
