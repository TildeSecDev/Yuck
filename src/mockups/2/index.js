// PWA: Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

/* ===================== DATA ===================== */
const PRODUCTS = {
  'op-16': {
    id: 'op-16',
    name: 'Yuck. Original Single',
    breadcrumb: 'All products ▸ Yuck. Original Single',
    price: 40,
    salePrice: 32,
    image: '../../assets/yuck-demo-supplement/Supplement.png',
    images: [
      '../../assets/yuck-demo-supplement/Supplement.png',
      '../../assets/yuck-demo-supplement/MultipleSupplement.png',
      '../../assets/yuck-demo-supplement/SourSupplement.png'
    ],
    summary: 'All-in-one, whole-food recovery supplement.',
    detail: 'Single pouch of the original formula. Honest fuel for daily sessions.',
    badge: 'Product spotlight'
  },
  'wp-01': {
    id: 'wp-01',
    name: 'Yuck. Original Multipack x3',
    breadcrumb: 'All products ▸ Yuck. Original Multipack x3',
    price: 55,
    salePrice: null,
    image: '../../assets/yuck-demo-supplement/MultipleSupplement.png',
    images: [
      '../../assets/yuck-demo-supplement/MultipleSupplement.png',
      '../../assets/yuck-demo-supplement/Supplement.png',
      '../../assets/yuck-demo-supplement/SourSupplement.png'
    ],
    summary: 'Three-pack built for block training and small teams.',
    detail: 'Stock up with a three-pack of our flagship blend. Ideal for block training and sharing with your crew.',
    badge: 'Multipack'
  },
  'cp-01': {
    id: 'cp-01',
    name: 'Yuck. Original Sour',
    breadcrumb: 'All products ▸ Yuck. Original Sour',
    price: 40,
    salePrice: null,
    image: '../../assets/yuck-demo-supplement/SourSupplement.png',
    images: [
      '../../assets/yuck-demo-supplement/SourSupplement.png',
      '../../assets/yuck-demo-supplement/Supplement.png',
      '../../assets/yuck-demo-supplement/MultipleSupplement.png'
    ],
    summary: 'Bright citrus and berry blend for hot sessions.',
    detail: 'Citrus-forward recovery with sea salt and tart cherry to keep hydration balanced.',
    badge: 'Limited batch'
  },
  'cm-01': {
    id: 'cm-01',
    name: 'Yuck. Original Spiced',
    breadcrumb: 'All products ▸ Yuck. Original Spiced',
    price: 38,
    salePrice: null,
    image: '../../assets/images/YuckPowder.webp',
    images: [
      '../../assets/images/YuckPowder.webp',
      '../../assets/yuck-demo-supplement/Supplement.png'
    ],
    summary: 'Warm spice profile with ginger and cinnamon.',
    detail: 'Comforting spice blend for colder days. Built for evening recovery and seasonal riding.',
    badge: 'Seasonal favorite'
  }
};

function formatCurrency(value) {
  return '£' + Number(value).toFixed(2);
}

function getProductCurrentPrice(product) {
  return typeof product.salePrice === 'number' ? product.salePrice : product.price;
}

const API_BASE = determineApiBase();

function determineApiBase() {
  const meta = document.querySelector('meta[name="yuck-api-base"]');
  if (meta && meta.content) {
    return meta.content.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.__YUCK_API_ORIGIN__) {
    return String(window.__YUCK_API_ORIGIN__).trim().replace(/\/$/, '');
  }
  const { protocol, hostname, port } = window.location;
  const defaultPort = '4242';
  if (protocol === 'file:') {
    return `http://localhost:${defaultPort}`;
  }
  const normalizedHost = hostname || 'localhost';
  if ((normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') && port !== defaultPort) {
    return `${protocol}//${normalizedHost}:${defaultPort}`;
  }
  if (!port) {
    return `${protocol}//${normalizedHost}`;
  }
  return `${protocol}//${normalizedHost}:${port}`;
}

function apiFetch(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;
  return fetch(url, { credentials: 'include', ...options });
}

const SEARCH_INDEX = [
  ...Object.values(PRODUCTS).map(product => ({
    id: 'product-' + product.id,
    title: product.name,
    subtitle: 'Product - ' + formatCurrency(getProductCurrentPrice(product)),
    url: '#/product/' + product.id,
    keywords: [product.name, product.summary, product.detail].join(' ')
  })),
  {
    id: 'shop',
    title: 'Shop all products',
    subtitle: 'Page',
    url: '#/shop',
    keywords: 'shop products store all'
  },
  {
    id: 'community',
    title: 'Community',
    subtitle: 'Page',
    url: './community.html',
    keywords: 'community ambassadors discord slack events'
  },
  {
    id: 'about',
    title: 'About Yuck',
    subtitle: 'Page',
    url: './about.html',
    keywords: 'about story team sourcing transparency'
  },
  {
    id: 'account',
    title: 'Account area',
    subtitle: 'Page',
    url: '#/account',
    keywords: 'account login profile orders'
  },
  {
    id: 'contact-email',
    title: 'Contact support',
    subtitle: 'Email',
    url: 'mailto:hello@yuck.example',
    keywords: 'support email contact help'
  },
  {
    id: 'contact-phone',
    title: 'Call Yuck Labs',
    subtitle: 'Phone',
    url: 'tel:02030000000',
    keywords: 'support phone call help'
  }
];

/* ===================== ROUTER STATE ===================== */
const routes = {
  '#/home': 'page-home',
  '#/shop': 'page-shop',
  '#/account': 'page-account',
  '#/search': 'page-home',
  '#/cart': 'page-shop'
};
Object.keys(PRODUCTS).forEach(id => {
  routes['#/product/' + id] = 'page-product';
});

const pages = document.querySelectorAll('.page');
const shopCards = Array.from(document.querySelectorAll('#page-shop .card[data-product]'));

let activeProductId = 'op-16';
let purchaseMode = 'subscribe';
const cartItems = [];

const productDetailRefs = {
  title: document.getElementById('pd-title'),
  price: document.getElementById('pd-price'),
  original: document.getElementById('pd-original'),
  breadcrumb: document.getElementById('pd-breadcrumb'),
  mainImage: document.getElementById('pd-main'),
  buyPrice: document.getElementById('buyPrice'),
  addButton: document.getElementById('addToCartBtn'),
  thumbSlots: document.querySelectorAll('.pd-thumbs div'),
  subscribeButton: document.getElementById('subBtn'),
  oneTimeButton: document.getElementById('oneBtn'),
  subscribeBox: document.getElementById('subBox')
};

const shopDetailRefs = {
  section: document.getElementById('shop-detail'),
  empty: document.getElementById('shop-detail-empty'),
  content: document.getElementById('shop-detail-content'),
  image: document.getElementById('shop-detail-image'),
  title: document.getElementById('shop-detail-title'),
  copy: document.getElementById('shop-detail-copy'),
  priceOriginal: document.getElementById('shop-detail-price-original'),
  priceCurrent: document.getElementById('shop-detail-price-current'),
  badge: document.getElementById('shop-detail-badge'),
  viewLink: document.getElementById('shop-detail-view'),
  addButton: document.querySelector('#shop-detail [data-action="add-to-cart"]')
};

const searchUI = {
  overlay: null,
  input: null,
  resultsHost: null,
  emptyState: null,
  triggers: [],
  isOpen: false,
  results: [],
  activeIndex: -1,
  lastTrigger: null
};

const cartUI = {
  overlay: null,
  triggers: [],
  itemsHost: null,
  emptyMessage: null,
  totalEl: null,
  isOpen: false,
  lastTrigger: null
};

const authState = {
  status: 'unknown',
  user: null,
  overlay: null,
  form: null,
  error: null,
  submitButton: null,
  tabs: [],
  mode: 'login',
  triggers: [],
  isOpen: false,
  lastTrigger: null
};

let pendingProductId = null;
let dashboardModal = null;
let dashboardData = null;

/* ===================== INITIALISATION ===================== */
initAccountOverlay();
initSearchOverlay();
initCartOverlay();
initShopCards();
initProductDetailInteractions();
updateCurrentYear();
initAuth();
initDashboardModal();

if (pages.length) {
  applyRoute(location.hash || '#/home');
  window.addEventListener('hashchange', () => applyRoute(location.hash || '#/home'));
}

document.addEventListener('keydown', handleGlobalKeydown);
document.addEventListener('click', handleGlobalClick);

/* ===================== ROUTER ===================== */
function applyRoute(hash) {
  const targetHash = routes[hash] ? hash : '#/home';

  if (targetHash === '#/search') {
    openSearchOverlay();
  } else if (targetHash !== '#/search') {
    closeSearchOverlay();
  }

  if (targetHash === '#/cart') {
    openCartOverlay();
  } else if (targetHash !== '#/cart') {
    closeCartOverlay();
  }

  const pageId = routes[targetHash] || 'page-home';
  pages.forEach(page => {
    page.classList.toggle('active', page.id === pageId);
  });

  document.querySelectorAll('header nav a').forEach(link => {
    const linkHash = new URL(link.href, window.location.href).hash;
    link.classList.toggle('active', linkHash && linkHash === targetHash);
  });

  if (pageId === 'page-shop' && pendingProductId) {
    showShopDetail(pendingProductId);
    pendingProductId = null;
  }

  if (targetHash.startsWith('#/product/')) {
    const productId = targetHash.split('/').pop();
    const product = PRODUCTS[productId] || PRODUCTS['op-16'];
    activeProductId = product.id;
    updateProductView(product);
  }
}

/* ===================== PRODUCT VIEWS ===================== */
function updateProductView(product) {
  if (!product) return;

  if (productDetailRefs.title) {
    productDetailRefs.title.textContent = product.name;
  }
  if (productDetailRefs.price) {
    productDetailRefs.price.textContent = formatCurrency(getProductCurrentPrice(product));
  }
  if (productDetailRefs.original) {
    const showOriginal = typeof product.salePrice === 'number' && product.salePrice !== product.price;
    productDetailRefs.original.textContent = formatCurrency(product.price);
    productDetailRefs.original.style.display = showOriginal ? 'inline' : 'none';
  }
  if (productDetailRefs.breadcrumb) {
    productDetailRefs.breadcrumb.textContent = product.breadcrumb;
  }
  if (productDetailRefs.mainImage) {
    productDetailRefs.mainImage.style.backgroundImage = `url('${product.image}')`;
  }

  if (productDetailRefs.thumbSlots && productDetailRefs.thumbSlots.length) {
    product.images.forEach((src, index) => {
      const thumb = productDetailRefs.thumbSlots[index];
      if (thumb) {
        thumb.dataset.src = src;
        thumb.style.backgroundImage = `url('${src}')`;
      }
    });
  }

  setPurchaseMode('subscribe', product);

  if (shopDetailRefs.viewLink) {
    shopDetailRefs.viewLink.href = '#/product/' + product.id;
  }
}

function showShopDetail(productId) {
  if (!shopDetailRefs.section) return;
  const product = PRODUCTS[productId];
  if (!product) return;

  shopDetailRefs.section.hidden = false;
  if (shopDetailRefs.empty) {
    shopDetailRefs.empty.hidden = true;
  }
  if (shopDetailRefs.content) {
    shopDetailRefs.content.hidden = false;
  }
  if (shopDetailRefs.image) {
    shopDetailRefs.image.style.backgroundImage = `url('${product.image}')`;
    shopDetailRefs.image.setAttribute('aria-label', product.name);
  }
  if (shopDetailRefs.title) {
    shopDetailRefs.title.textContent = product.name;
  }
  if (shopDetailRefs.copy) {
    shopDetailRefs.copy.textContent = product.detail;
  }
  if (shopDetailRefs.badge) {
    shopDetailRefs.badge.textContent = product.badge || 'Product spotlight';
  }
  if (shopDetailRefs.priceCurrent) {
    shopDetailRefs.priceCurrent.textContent = formatCurrency(getProductCurrentPrice(product));
  }
  if (shopDetailRefs.priceOriginal) {
    const showOriginal = typeof product.salePrice === 'number' && product.salePrice !== product.price;
    shopDetailRefs.priceOriginal.style.display = showOriginal ? 'inline' : 'none';
    shopDetailRefs.priceOriginal.textContent = formatCurrency(product.price);
  }
  if (shopDetailRefs.viewLink) {
    shopDetailRefs.viewLink.href = '#/product/' + product.id;
  }
  if (shopDetailRefs.addButton) {
    shopDetailRefs.addButton.dataset.product = product.id;
  }

  shopCards.forEach(card => {
    card.classList.toggle('is-active', card.dataset.product === product.id);
  });

  activeProductId = product.id;
  shopDetailRefs.section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ===================== CART ===================== */
function addToCart(productId, qty = 1) {
  const product = PRODUCTS[productId];
  if (!product || qty < 1) return;

  const existing = cartItems.find(item => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cartItems.push({ id: productId, qty });
  }

  renderCartOverlay();
}

function renderCartOverlay() {
  if (!cartUI.overlay || !cartUI.itemsHost || !cartUI.totalEl || !cartUI.emptyMessage) return;

  cartUI.itemsHost.innerHTML = '';

  if (!cartItems.length) {
    cartUI.itemsHost.style.display = 'none';
    cartUI.emptyMessage.style.display = 'block';
    cartUI.totalEl.textContent = formatCurrency(0);
    return;
  }

  cartUI.itemsHost.style.display = 'grid';
  cartUI.emptyMessage.style.display = 'none';

  let total = 0;
  cartItems.forEach(item => {
    const product = PRODUCTS[item.id];
    if (!product) return;
    const priceEach = getProductCurrentPrice(product);
    total += priceEach * item.qty;

    const row = document.createElement('div');
    row.className = 'cart-dropdown__item';

    const thumb = document.createElement('div');
    thumb.className = 'cart-dropdown__thumb';
    thumb.style.backgroundImage = `url('${product.image}')`;

    const info = document.createElement('div');
    info.className = 'cart-dropdown__info';

    const title = document.createElement('div');
    title.className = 'cart-dropdown__title';
    title.textContent = product.name;

    const meta = document.createElement('div');
    meta.className = 'cart-dropdown__meta';
    meta.textContent = 'Qty ' + item.qty + ' @ ' + formatCurrency(priceEach);

    info.append(title, meta);
    row.append(thumb, info);
    cartUI.itemsHost.append(row);
  });

  cartUI.totalEl.textContent = formatCurrency(total);
}

function openCartOverlay() {
  if (!cartUI.overlay) return;
  renderCartOverlay();
  cartUI.overlay.classList.add('is-open');
  cartUI.overlay.setAttribute('aria-hidden', 'false');
  cartUI.isOpen = true;
  cartUI.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'true'));
}

function closeCartOverlay() {
  if (!cartUI.overlay) return;
  cartUI.overlay.classList.remove('is-open');
  cartUI.overlay.setAttribute('aria-hidden', 'true');
  cartUI.isOpen = false;
  cartUI.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
  if (cartUI.lastTrigger) {
    cartUI.lastTrigger.focus({ preventScroll: true });
    cartUI.lastTrigger = null;
  }
}

/* ===================== SEARCH OVERLAY ===================== */
function openSearchOverlay() {
  if (!searchUI.overlay) return;
  renderSearchResults('');
  searchUI.overlay.classList.add('is-open');
  searchUI.overlay.setAttribute('aria-hidden', 'false');
  searchUI.isOpen = true;
  if (searchUI.input) {
    searchUI.input.value = '';
    searchUI.input.focus({ preventScroll: true });
  }
  searchUI.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'true'));
}

function closeSearchOverlay() {
  if (!searchUI.overlay) return;
  searchUI.overlay.classList.remove('is-open');
  searchUI.overlay.setAttribute('aria-hidden', 'true');
  searchUI.isOpen = false;
  searchUI.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
  if (searchUI.lastTrigger) {
    searchUI.lastTrigger.focus({ preventScroll: true });
    searchUI.lastTrigger = null;
  }
}

function renderSearchResults(query) {
  if (!searchUI.resultsHost || !searchUI.emptyState) return;

  const value = (query || '').trim().toLowerCase();
  const matches = SEARCH_INDEX.filter(item => {
    if (!value) return true;
    return item.title.toLowerCase().includes(value) ||
      item.subtitle.toLowerCase().includes(value) ||
      item.keywords.toLowerCase().includes(value);
  }).slice(0, 8);

  searchUI.results = matches;
  searchUI.activeIndex = matches.length ? 0 : -1;

  searchUI.resultsHost.innerHTML = '';

  if (!matches.length) {
    searchUI.emptyState.hidden = false;
    return;
  }

  searchUI.emptyState.hidden = true;

  matches.forEach((result, index) => {
    const item = document.createElement('li');
    item.className = 'spotlight__item';
    item.setAttribute('role', 'option');
    item.dataset.index = String(index);
    item.setAttribute('aria-selected', index === searchUI.activeIndex ? 'true' : 'false');

    const title = document.createElement('div');
    title.className = 'spotlight__title';
    title.textContent = result.title;

    const meta = document.createElement('div');
    meta.className = 'spotlight__meta';
    meta.textContent = result.subtitle;

    item.append(title, meta);

    item.addEventListener('mouseenter', () => {
      searchUI.activeIndex = index;
      updateSearchSelection();
    });
    item.addEventListener('mousedown', event => event.preventDefault());
    item.addEventListener('click', () => goToSearchResult(index));

    searchUI.resultsHost.append(item);
  });
}

function updateSearchSelection() {
  if (!searchUI.resultsHost) return;
  const items = searchUI.resultsHost.querySelectorAll('.spotlight__item');
  items.forEach((item, index) => {
    item.setAttribute('aria-selected', index === searchUI.activeIndex ? 'true' : 'false');
    if (index === searchUI.activeIndex) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

function goToSearchResult(index) {
  const result = searchUI.results[index];
  if (!result) return;
  closeSearchOverlay();

  if (result.url.startsWith('#')) {
    window.location.hash = result.url;
    return;
  }

  window.location.href = result.url;
}

/* ===================== EVENT HANDLERS ===================== */
function handleGlobalKeydown(event) {
  const target = event.target;
  const tagName = target && target.tagName ? target.tagName.toLowerCase() : '';
  const isTyping = tagName === 'input' || tagName === 'textarea' || (target && target.isContentEditable);

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    if (!isTyping) {
      event.preventDefault();
      openSearchOverlay();
    }
    return;
  }

  if (event.key === 'Escape') {
    let handled = false;
    if (searchUI.isOpen) {
      closeSearchOverlay();
      handled = true;
    }
    if (cartUI.isOpen) {
      closeCartOverlay();
      handled = true;
    }
    if (authState.isOpen) {
      closeAccountOverlay();
      handled = true;
    }
    if (dashboardModal?.overlay?.classList.contains('is-open')) {
      closeDashboardModal();
      handled = true;
    }
    if (handled) {
      event.preventDefault();
      return;
    }
  }

  if (searchUI.isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    event.preventDefault();
    if (!searchUI.results.length) return;
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const total = searchUI.results.length;
    searchUI.activeIndex = (searchUI.activeIndex + step + total) % total;
    updateSearchSelection();
  }

  if (searchUI.isOpen && event.key === 'Enter') {
    if (searchUI.activeIndex >= 0) {
      event.preventDefault();
      goToSearchResult(searchUI.activeIndex);
    }
  }
}

function handleGlobalClick(event) {
  if (cartUI.isOpen && cartUI.overlay) {
    const clickedTrigger = cartUI.triggers.some(trigger => trigger.contains(event.target));
    if (!cartUI.overlay.contains(event.target) && !clickedTrigger) {
      closeCartOverlay();
    }
  }
  if (authState.isOpen && authState.overlay) {
    const clickedTrigger = authState.triggers.some(trigger => trigger.contains(event.target));
    if (!authState.overlay.contains(event.target) && !clickedTrigger) {
      closeAccountOverlay();
    }
  }
}

/* ===================== INITIALISERS ===================== */
function initSearchOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'searchOverlay';
  overlay.className = 'spotlight';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="spotlight__panel" role="dialog" aria-modal="true" aria-label="Search Yuck">
      <div class="spotlight__header">
        <span aria-hidden="true">🔎</span>
        <input class="spotlight__input" type="search" placeholder="Search products, pages, or help" aria-label="Search" />
        <button class="spotlight__close" type="button" data-close="search" aria-label="Close search">&#215;</button>
      </div>
      <div class="spotlight__body">
        <ul class="spotlight__list" role="listbox"></ul>
        <div class="spotlight__empty" hidden>No matches yet. Try another term.</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  searchUI.overlay = overlay;
  searchUI.input = overlay.querySelector('.spotlight__input');
  searchUI.resultsHost = overlay.querySelector('.spotlight__list');
  searchUI.emptyState = overlay.querySelector('.spotlight__empty');

  const closeBtn = overlay.querySelector('[data-close="search"]');
  closeBtn?.addEventListener('click', () => closeSearchOverlay());
  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      closeSearchOverlay();
    }
  });

  searchUI.input?.addEventListener('input', event => {
    renderSearchResults(event.target.value);
  });

  searchUI.triggers = Array.from(document.querySelectorAll('[data-overlay="search"], a[href$="#/search"]'));
  searchUI.triggers.forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', event => {
      event.preventDefault();
      searchUI.lastTrigger = trigger;
      openSearchOverlay();
    });
  });
}

function initCartOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'cartOverlay';
  overlay.className = 'cart-dropdown';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Cart summary');
  overlay.innerHTML = `
    <div class="cart-dropdown__header">
      <span>Cart</span>
      <button class="cart-dropdown__close" type="button" data-close="cart" aria-label="Close cart">&#215;</button>
    </div>
    <div class="cart-dropdown__items" role="list"></div>
    <div class="cart-dropdown__empty">Your cart is empty.</div>
    <div class="cart-dropdown__footer">
      <span>Total</span>
      <span id="cart-total">£0.00</span>
    </div>
  `;

  document.body.appendChild(overlay);

  cartUI.overlay = overlay;
  cartUI.itemsHost = overlay.querySelector('.cart-dropdown__items');
  cartUI.emptyMessage = overlay.querySelector('.cart-dropdown__empty');
  cartUI.totalEl = overlay.querySelector('#cart-total');

  const closeBtn = overlay.querySelector('[data-close="cart"]');
  closeBtn?.addEventListener('click', () => closeCartOverlay());
  overlay.addEventListener('click', event => {
    event.stopPropagation();
  });

  cartUI.triggers = Array.from(document.querySelectorAll('[data-overlay="cart"], a[href$="#/cart"]'));
  cartUI.triggers.forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', event => {
      event.preventDefault();
      cartUI.lastTrigger = trigger;
      openCartOverlay();
    });
  });

  renderCartOverlay();
}

function initShopCards() {
  const productCards = Array.from(document.querySelectorAll('.card[data-product]'));
  if (!productCards.length) return;

  productCards.forEach(card => {
    card.addEventListener('click', event => {
      const productId = card.dataset.product;
      if (!productId) return;
      const insideShop = Boolean(card.closest('#page-shop'));
      event.preventDefault();
      if (insideShop) {
        showShopDetail(productId);
      } else {
        pendingProductId = productId;
        window.location.hash = '#/shop';
        const shopPage = document.getElementById('page-shop');
        if (shopPage?.classList.contains('active')) {
          showShopDetail(productId);
          pendingProductId = null;
        }
      }
    });
  });

  if (shopDetailRefs.addButton) {
    shopDetailRefs.addButton.addEventListener('click', () => {
      const productId = shopDetailRefs.addButton.dataset.product || activeProductId;
      addToCart(productId);
      openCartOverlay();
    });
  }
}

function initProductDetailInteractions() {
  productDetailRefs.thumbSlots.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.src;
      if (src && productDetailRefs.mainImage) {
        productDetailRefs.mainImage.style.backgroundImage = `url('${src}')`;
      }
    });
  });

  if (productDetailRefs.subscribeButton && productDetailRefs.oneTimeButton) {
    productDetailRefs.subscribeButton.addEventListener('click', () => setPurchaseMode('subscribe'));
    productDetailRefs.oneTimeButton.addEventListener('click', () => setPurchaseMode('one-time'));
  }

  if (productDetailRefs.addButton) {
    productDetailRefs.addButton.addEventListener('click', () => {
      addToCart(activeProductId);
      openCartOverlay();
    });
  }
}

function updateCurrentYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/* ===================== PURCHASE MODE ===================== */
function setPurchaseMode(mode, product = PRODUCTS[activeProductId]) {
  purchaseMode = mode;
  if (productDetailRefs.subscribeButton && productDetailRefs.oneTimeButton) {
    productDetailRefs.subscribeButton.classList.toggle('active', mode === 'subscribe');
    productDetailRefs.oneTimeButton.classList.toggle('active', mode === 'one-time');
  }
  if (productDetailRefs.subscribeBox) {
    productDetailRefs.subscribeBox.style.display = mode === 'subscribe' ? 'block' : 'none';
  }
  updateBuyPrice(product);
}

function updateBuyPrice(product = PRODUCTS[activeProductId]) {
  if (!productDetailRefs.buyPrice || !product) return;
  const basePrice = getProductCurrentPrice(product);
  const total = purchaseMode === 'subscribe' ? basePrice : basePrice + 8;
  productDetailRefs.buyPrice.textContent = formatCurrency(total);
}

/* ===================== AUTHENTICATION ===================== */
function initAccountOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'accountOverlay';
  overlay.className = 'auth-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="auth-modal" role="dialog" aria-modal="true" aria-label="Account access">
      <div class="auth-modal__header">
        <h2>Account access</h2>
        <button class="auth-modal__close" type="button" data-close="account" aria-label="Close account modal">&#215;</button>
      </div>
      <div class="auth-modal__tabs" role="tablist">
        <button class="auth-modal__tab" type="button" data-mode="login" aria-selected="true" role="tab">Sign in</button>
        <button class="auth-modal__tab" type="button" data-mode="signup" aria-selected="false" role="tab">Create account</button>
      </div>
      <form class="auth-modal__body" novalidate>
        <div class="auth-modal__error" hidden></div>
        <label>
          Email
          <input type="email" name="email" autocomplete="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autocomplete="current-password" required minlength="8" />
        </label>
        <button class="auth-modal__submit" type="submit">Sign in</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  authState.overlay = overlay;
  authState.form = overlay.querySelector('form');
  authState.error = overlay.querySelector('.auth-modal__error');
  authState.submitButton = overlay.querySelector('.auth-modal__submit');
  authState.tabs = Array.from(overlay.querySelectorAll('.auth-modal__tab'));

  const closeBtn = overlay.querySelector('[data-close="account"]');
  closeBtn?.addEventListener('click', () => closeAccountOverlay());

  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      closeAccountOverlay();
    }
  });

  authState.form?.addEventListener('submit', submitAuthForm);
  authState.tabs.forEach(tab => {
    tab.addEventListener('click', () => setAuthMode(tab.dataset.mode));
  });

  authState.triggers = Array.from(document.querySelectorAll('[data-action="account"]'));
  authState.triggers.forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
    if (!trigger.dataset.defaultLabel) {
      trigger.dataset.defaultLabel = trigger.textContent.trim();
    }
    trigger.addEventListener('click', handleAccountClick);
  });
}

function openAccountOverlay(mode = authState.mode) {
  if (!authState.overlay) return;
  setAuthMode(mode);
  authState.overlay.classList.add('is-open');
  authState.overlay.setAttribute('aria-hidden', 'false');
  authState.isOpen = true;
  authState.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'true'));
  clearAuthError();
  authState.form?.reset();
  const emailInput = authState.form?.querySelector('input[name="email"]');
  emailInput?.focus({ preventScroll: true });
}

function closeAccountOverlay() {
  if (!authState.overlay) return;
  authState.overlay.classList.remove('is-open');
  authState.overlay.setAttribute('aria-hidden', 'true');
  authState.isOpen = false;
  authState.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
  if (authState.lastTrigger) {
    authState.lastTrigger.focus({ preventScroll: true });
    authState.lastTrigger = null;
  }
}

function initDashboardModal() {
  let overlay = document.getElementById('dashboardModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'dashboardModal';
    overlay.className = 'dashboard-modal';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="dashboard-modal__dialog" role="dialog" aria-modal="true" aria-label="Order details">
  <button class="dashboard-modal__close" type="button" data-close="dashboard" aria-label="Close order details">&times;</button>
        <div class="dashboard-modal__content"></div>
      </div>
    `;
    document.body.append(overlay);
  }
  const dialog = overlay.querySelector('.dashboard-modal__dialog');
  const content = overlay.querySelector('.dashboard-modal__content');
  dashboardModal = { overlay, content, dialog, lastActive: null };
  overlay.addEventListener('click', event => {
    if (event.target === overlay || event.target.closest('[data-close="dashboard"]')) {
      closeDashboardModal();
    }
  });
}

function openDashboardModal(content, options = {}) {
  if (!dashboardModal?.overlay || !dashboardModal?.content) return;
  const activeElement = document.activeElement;
  dashboardModal.lastActive = activeElement instanceof HTMLElement ? activeElement : null;
  dashboardModal.content.innerHTML = '';
  if (typeof content === 'string') {
    dashboardModal.content.innerHTML = content;
  } else if (content instanceof Node) {
    dashboardModal.content.append(content);
  }
  dashboardModal.overlay.classList.add('is-open');
  dashboardModal.overlay.setAttribute('aria-hidden', 'false');
  if (options.label && dashboardModal.dialog) {
    dashboardModal.dialog.setAttribute('aria-label', options.label);
  }
  document.body.classList.add('modal-open');
  const focusSelector = options.focusSelector || '[data-focus-initial]';
  let focusTarget = null;
  if (focusSelector) {
    focusTarget = dashboardModal.overlay.querySelector(focusSelector);
  }
  if (!focusTarget) {
    focusTarget = dashboardModal.overlay.querySelector('[data-action]');
  }
  if (!focusTarget) {
    focusTarget = dashboardModal.overlay.querySelector('.dashboard-modal__close');
  }
  focusTarget?.focus({ preventScroll: true });
}

function closeDashboardModal() {
  if (!dashboardModal?.overlay) return;
  dashboardModal.overlay.classList.remove('is-open');
  dashboardModal.overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (dashboardModal.lastActive) {
    dashboardModal.lastActive.focus({ preventScroll: true });
  }
  dashboardModal.lastActive = null;
}

function setAuthMode(mode = 'login') {
  authState.mode = mode === 'signup' ? 'signup' : 'login';
  if (authState.submitButton) {
    authState.submitButton.textContent = authState.mode === 'signup' ? 'Create account' : 'Sign in';
  }
  if (authState.form) {
    const passwordInput = authState.form.querySelector('input[name="password"]');
    if (passwordInput) {
      passwordInput.setAttribute('autocomplete', authState.mode === 'signup' ? 'new-password' : 'current-password');
    }
  }
  authState.tabs.forEach(tab => {
    tab.setAttribute('aria-selected', tab.dataset.mode === authState.mode ? 'true' : 'false');
  });
  clearAuthError();
}

function showAuthError(message) {
  if (!authState.error) return;
  authState.error.textContent = message;
  authState.error.hidden = !message;
}

function clearAuthError() {
  if (!authState.error) return;
  authState.error.hidden = true;
  authState.error.textContent = '';
}

async function submitAuthForm(event) {
  event.preventDefault();
  if (!authState.form) return;
  const formData = new FormData(authState.form);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();
  if (!email || !password) {
    showAuthError('Please provide both email and password.');
    return;
  }
  clearAuthError();

  const endpoint = authState.mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
  try {
    const response = await apiFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.error || 'Unable to process request.';
      showAuthError(formatAuthError(message));
      return;
    }
    await refreshAuthState();
    closeAccountOverlay();
    window.location.href = './dashboard.html';
  } catch (err) {
    showAuthError('Network error. Please try again.');
  }
}

function formatAuthError(code) {
  switch (code) {
    case 'email_in_use': return 'That email already has an account.';
    case 'invalid_credentials': return 'Email or password does not match.';
    case 'weak_password': return 'Choose a password with at least 8 characters.';
    case 'missing_fields': return 'Please fill in all required fields.';
    case 'server_error': return 'Server error. Please try again shortly.';
    default: return 'There was a problem signing you in. Please try again.';
  }
}

async function initAuth() {
  await refreshAuthState();
  if (document.body.classList.contains('page-dashboard')) {
    if (authState.status !== 'authenticated') {
      window.location.href = './index.html';
      return;
    }
    await hydrateDashboard();
  }
}

async function refreshAuthState() {
  try {
  const response = await apiFetch('/api/auth/me');
    if (!response.ok) throw new Error('not_authenticated');
    const user = await response.json();
    authState.status = 'authenticated';
    authState.user = user;
  } catch (err) {
    authState.status = 'anonymous';
    authState.user = null;
  }
  updateAccountTriggers();
  updateDashboardGreeting();
}

function updateAccountTriggers() {
  authState.triggers.forEach(trigger => {
    trigger.dataset.state = authState.status;
    const defaultLabel = trigger.dataset.defaultLabel || '👤';
    if (authState.status === 'authenticated' && authState.user) {
      const username = (authState.user.email || '').split('@')[0] || 'your';
      const label = `${username}'s dashboard`;
      trigger.textContent = label;
      trigger.classList.add('icon--text');
      trigger.setAttribute('title', 'Go to your dashboard');
      trigger.setAttribute('aria-haspopup', 'false');
    } else {
      trigger.textContent = defaultLabel;
      trigger.classList.remove('icon--text');
      trigger.setAttribute('title', 'Sign in or create account');
      trigger.setAttribute('aria-haspopup', 'dialog');
    }
  });
}

function updateDashboardGreeting() {
  if (!document.body.classList.contains('page-dashboard')) return;
  const greeting = document.getElementById('dashboard-greeting');
  if (!greeting) return;
  if (authState.status === 'authenticated' && authState.user) {
    const email = authState.user.email || 'there';
    greeting.textContent = `Good to see you, ${email.split('@')[0] || 'athlete'}.`;
  } else {
    greeting.textContent = 'Please sign in to view your dashboard.';
  }
}

async function hydrateDashboard() {
  try {
  const response = await apiFetch('/api/dashboard');
    if (!response.ok) throw new Error('failed');
    const data = await response.json();
    renderDashboard(data);
  } catch (err) {
    console.error('Failed to load dashboard', err);
  }
}

function renderDashboard(data) {
  dashboardData = data;
  renderProfileCards(data.user);
  renderOrders(data.orders);
  renderCommunityPosts(data.communityPosts);
  renderEventsAndActivities(data.events, data.activities);
}

function renderProfileCards(user) {
  const container = document.getElementById('dashboard-profile');
  if (!container) return;
  container.innerHTML = '';
  const handle = (user?.email || '').split('@')[0] || 'athlete';

  const profileCard = document.createElement('article');
  profileCard.className = 'profile-card';
  profileCard.innerHTML = `
    <h3>Make it yours</h3>
    <p>Update your display name, training focus, and preferences so drops feel personal.</p>
    <form class="profile-form" novalidate>
      <label>
        Display name
        <input type="text" name="displayName" value="${handle}" />
      </label>
      <label>
        Primary discipline
        <select name="discipline">
          <option value="endurance">Endurance</option>
          <option value="strength">Strength</option>
          <option value="climb">Climb</option>
          <option value="mixed">Mixed training</option>
        </select>
      </label>
      <label>
        Home base
        <input type="text" name="location" placeholder="City or region" />
      </label>
      <button type="submit">Save profile</button>
    </form>
  `;
  const profileForm = profileCard.querySelector('form');
  profileForm?.addEventListener('submit', event => {
    event.preventDefault();
    notifyUser('Profile preferences saved. Personalised recommendations coming soon.');
  });
  container.append(profileCard);

  const communityCard = document.createElement('article');
  communityCard.className = 'profile-card accent';
  communityCard.innerHTML = `
    <h3>Plug into your crew</h3>
    <p>Share your latest “Yuck.” session and link up with locals pushing the same pace.</p>
    <ul class="profile-card__list">
      <li>Upload a short ride/run recap and tag @yucklabs</li>
      <li>Join the verified crew channel for meetups and beta drops</li>
      <li>Nominate a teammate for next month’s ambassador spotlight</li>
    </ul>
    <div class="profile-card__actions">
      <button type="button" data-profile-action="find-crew">Find nearby community</button>
      <button type="button" data-profile-action="upload-story">Upload Yuck. experience</button>
    </div>
  `;
  communityCard.querySelectorAll('[data-profile-action]').forEach(btn => {
    btn.addEventListener('click', event => {
      const action = event.currentTarget.dataset.profileAction;
      handleProfileAction(action);
    });
  });
  container.append(communityCard);
}

function renderOrders(orders = []) {
  const container = document.getElementById('dashboard-orders');
  if (!container) return;
  container.innerHTML = '';
  if (!orders.length) {
  container.append(createDashboardEmptyMessage('No orders yet - grab your first pack to unlock this space.'));
    return;
  }

  orders.forEach(order => {
    const card = document.createElement('article');
    card.className = 'card order-card';
    card.setAttribute('tabindex', '0');
    const placedDate = order?.placedAt ? new Date(order.placedAt) : null;
    const placedLabel = placedDate && !Number.isNaN(placedDate.valueOf()) ? placedDate.toLocaleDateString() : 'Recently';
    card.innerHTML = `
      <div class="order-card__header">
        <strong>Order #${order.id}</strong>
        <span class="badge soft">${order.status}</span>
      </div>
      <div class="order-card__meta">
        <span>Total: ${formatCurrency(order.total)}</span>
        <span>Placed ${placedLabel} · ${timeAgo(order.placedAt)}</span>
      </div>
      <div class="order-card__actions">
        <button type="button" data-action="details">View details</button>
        <button type="button" data-action="reorder">Re-order</button>
        <button type="button" data-action="subscription">Manage subscription</button>
        <button type="button" data-action="payment">Account on file</button>
      </div>
    `;
    card.addEventListener('click', () => handleOrderAction('details', order));
    card.addEventListener('keypress', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOrderAction('details', order);
      }
    });
    card.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        const action = event.currentTarget.dataset.action;
        handleOrderAction(action, order);
      });
    });
    container.append(card);
  });
}

function renderCommunityPosts(posts = []) {
  const container = document.getElementById('dashboard-posts');
  if (!container) return;
  container.innerHTML = '';
  if (!posts.length) {
    container.append(createDashboardEmptyMessage('No community stories yet. Share yours to kick things off.'));
    return;
  }

  posts.forEach(post => {
    const card = document.createElement('article');
    card.className = 'card dashboard-feed-card';
    card.setAttribute('tabindex', '0');
    card.dataset.postId = post.id;
    card.innerHTML = `
      <div class="dashboard-tag">Community</div>
      <strong>${post.title}</strong>
      <div class="small">${post.author} • ${timeAgo(post.publishedAt)}</div>
    `;
    card.addEventListener('click', () => showCommunityPostDetails(post));
    card.addEventListener('keypress', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showCommunityPostDetails(post);
      }
    });
    container.append(card);
  });
}

function renderEventsAndActivities(events = [], activities = []) {
  const container = document.getElementById('dashboard-events');
  if (!container) return;
  container.innerHTML = '';
  const combined = [
    ...(events || []).map(event => ({ type: 'event', ...event })),
    ...(activities || []).map(activity => ({ type: 'activity', ...activity }))
  ];

  if (!combined.length) {
    container.append(createDashboardEmptyMessage('No upcoming drops yet. Check back after the next launch window.'));
    return;
  }

  combined.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card dashboard-feed-card';
    const isEvent = item.type === 'event';
    const regionLabel = item.region || 'Community';
    const tagLabel = isEvent ? 'Event' : `Crew · ${regionLabel}`;
    card.setAttribute('tabindex', '0');
    card.dataset.entryType = item.type;
    card.dataset.entryId = item.id || regionLabel;
    const eventDate = isEvent && item.date ? new Date(item.date) : null;
    const dateLabel = eventDate && !Number.isNaN(eventDate.valueOf()) ? eventDate.toLocaleDateString() : 'TBA';
    const details = isEvent
      ? `<div class="small">${dateLabel}${item.location ? ` • ${item.location}` : ''}</div>`
      : `<div class="small">${item.summary}</div>`;
    card.innerHTML = `
      <div class="dashboard-tag">${tagLabel}</div>
      <strong>${isEvent ? item.name : regionLabel}</strong>
      ${details}
    `;
    card.addEventListener('click', () => showEventDetails(item));
    card.addEventListener('keypress', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showEventDetails(item);
      }
    });
    container.append(card);
  });
}

function createDashboardEmptyMessage(text) {
  const element = document.createElement('div');
  element.className = 'dashboard-empty';
  element.textContent = text;
  return element;
}

function showOrderDetails(order) {
  if (!order) return;
  const detail = document.createElement('div');
  detail.className = 'dashboard-order-detail';
  const placedDate = order?.placedAt ? new Date(order.placedAt) : null;
  const placedLabel = placedDate && !Number.isNaN(placedDate.valueOf()) ? placedDate.toLocaleString() : 'Recently';
  detail.innerHTML = `
    <header class="dashboard-order-detail__header">
      <div>
        <span class="dashboard-tag">Order</span>
        <h3>Order #${order.id}</h3>
      </div>
      <span class="badge soft">${order.status}</span>
    </header>
    <section class="dashboard-order-detail__meta">
      <div>
        <span class="label">Placed</span>
        <strong>${placedLabel}</strong>
      </div>
      <div>
        <span class="label">Total</span>
        <strong>${formatCurrency(order.total)}</strong>
      </div>
      <div>
        <span class="label">Delivery status</span>
        <strong>${order.status}</strong>
      </div>
    </section>
    <section class="dashboard-order-detail__actions">
      <button type="button" data-action="reorder">Re-order this pack</button>
      <button type="button" data-action="subscription">Manage subscription</button>
      <button type="button" data-action="support">Contact support</button>
    </section>
    <section class="dashboard-order-detail__summary">
      <h4>What's inside</h4>
      <p>This quick view shows demo content. Itemised receipts, tracking links, and subscription edits will appear here once live.</p>
      <ul>
        <li>Yuck. Original Recovery Blend - 1 x £32.00</li>
        <li>Shipping - Included for subscribers</li>
        <li>VAT - £3.20</li>
      </ul>
    </section>
  `;
  detail.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', event => {
      const followUp = event.currentTarget.dataset.action;
      handleOrderAction(followUp, order);
    });
  });
  openDashboardModal(detail, { label: `Order ${order.id} details` });
}

function handleOrderAction(action, order) {
  const messages = {
    reorder: `We’ll prep a new cart with the items from order ${order.id}.`,
    subscription: 'Subscription manager opens here in the full release.',
    payment: 'Stored payment methods will appear here when the billing portal is live.',
    support: 'A support thread will open here in the production release.'
  };
  if (action === 'details') {
    showOrderDetails(order);
    return;
  }
  const message = messages[action] || 'Feature coming soon.';
  notifyUser(message);
}

function showCommunityPostDetails(post) {
  if (!post) return;
  openCommunityModal({ post, mode: 'post' });
}

function openCommunityModal({ post = null, mode = 'discover' } = {}) {
  const posts = Array.isArray(dashboardData?.communityPosts) ? dashboardData.communityPosts : [];
  const events = Array.isArray(dashboardData?.events) ? dashboardData.events : [];
  const activities = Array.isArray(dashboardData?.activities) ? dashboardData.activities : [];
  const headerTag = post ? 'Community post' : mode === 'share' ? 'Share experience' : 'Discover crew';
  const titleText = post ? post.title : mode === 'share' ? 'Upload your Yuck experience' : 'Find your Yuck community';
  const descriptionText = post
    ? `See what ${post.author} has been logging and jump into the thread.`
    : mode === 'share'
      ? 'Drop a recap, attach media, and share it with the crew without leaving the dashboard.'
      : 'Search crews, threads, and events to stay in sync with your people.';
  const postedAgo = post?.publishedAt ? timeAgo(post.publishedAt) : null;
  const searchId = `community-search-${Date.now()}`;
  const postDetailMarkup = post ? `
    <section class="community-modal__detail">
      <h4>${post.title}</h4>
      <div class="community-modal__detail-meta">
        <span>Posted by ${post.author}</span>
        <span>${postedAgo || 'just now'}</span>
      </div>
      <p>${post.author} shared this session to break down fueling, pacing, and recovery lessons for the crew.</p>
      <ul class="community-modal__detail-highlights">
        <li>Fuel plan: Yuck Original with citrus add-ons midway.</li>
        <li>Session notes: Negative split with focus on climbing tempo.</li>
        <li>Recovery stack: Mobility plus 8 hours sleep targeted.</li>
      </ul>
    </section>
  ` : '';
  const shareMarkup = mode === 'share' ? `
    <section class="community-modal__composer">
      <h4>Share your latest effort</h4>
      <form data-community-composer>
        <label>
          Title
          <input type="text" name="title" placeholder="Give your session a headline" required />
        </label>
        <label>
          Recap
          <textarea name="story" rows="4" placeholder="What did you test, learn, or adjust?" required></textarea>
        </label>
        <div class="community-modal__composer-actions">
          <label class="community-modal__file">
            <span>Attach media</span>
            <input type="file" name="media" accept="image/*,video/*" />
          </label>
          <button type="submit">Share with community</button>
        </div>
      </form>
    </section>
  ` : '';
  const wrapper = document.createElement('div');
  wrapper.className = 'community-modal';
  wrapper.innerHTML = `
    <header class="community-modal__header">
      <div>
        <span class="dashboard-tag">${headerTag}</span>
        <h3>${titleText}</h3>
        <p>${descriptionText}</p>
      </div>
    </header>
    <section class="community-modal__search">
      <label class="community-modal__label" for="${searchId}">Search crew and threads</label>
      <input id="${searchId}" type="search" name="communitySearch" placeholder="Search posts, crews, or handles" data-community-search data-focus-initial />
      <div class="community-modal__results" data-community-results></div>
    </section>
    ${postDetailMarkup}
    ${shareMarkup}
    <section class="community-modal__quick-actions">
      <h4>Quick actions</h4>
      <div class="community-modal__actions">
        <button type="button" data-community-action="add-friend">Add friend</button>
        <button type="button" data-community-action="send-message">Send message</button>
        <button type="button" data-community-action="start-thread">Start crew thread</button>
      </div>
    </section>
  `;

  const searchInput = wrapper.querySelector('[data-community-search]');
  const resultsHost = wrapper.querySelector('[data-community-results]');

  const searchItems = [
    ...posts.map(item => ({
      key: `post:${item.id}`,
      type: 'post',
      title: item.title,
      meta: `${item.author} - ${timeAgo(item.publishedAt)}`,
      data: { ...item, type: 'post' }
    })),
    ...events.map(item => ({
      key: `event:${item.id}`,
      type: 'event',
      title: item.name,
      meta: `${new Date(item.date).toLocaleDateString()}${item.location ? ` - ${item.location}` : ''}`,
      data: { ...item, type: 'event' }
    })),
    ...activities.map((item, index) => ({
      key: `crew:${item.region || index}`,
      type: 'activity',
      title: `${item.region || 'Crew'} meetup`,
      meta: item.summary || 'Updates landing soon.',
      data: { ...item, id: item.region || `crew-${index}`, type: 'activity' }
    }))
  ];
  const itemLookup = new Map(searchItems.map(entry => [entry.key, entry]));

  function renderSearchResults(termText = '') {
    if (!resultsHost) return;
    const normalized = termText.trim().toLowerCase();
    const matches = !normalized
      ? searchItems.slice(0, 6)
      : searchItems.filter(entry =>
          entry.title.toLowerCase().includes(normalized) || entry.meta.toLowerCase().includes(normalized)
        );
    resultsHost.innerHTML = '';
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'community-modal__empty';
      empty.textContent = 'No matches yet. Try a different crew or topic.';
      resultsHost.append(empty);
      return;
    }
    matches.forEach(match => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'community-modal__result';
      button.dataset.communityTarget = match.key;
      button.innerHTML = `
        <span class="community-modal__result-title">${match.title}</span>
        <span class="community-modal__result-meta">${match.meta}</span>
      `;
      resultsHost.append(button);
    });
  }

  if (searchInput) {
    if (post) {
      searchInput.value = post.title;
    }
    renderSearchResults(searchInput.value || '');
    searchInput.addEventListener('input', event => {
      renderSearchResults(event.target.value);
    });
  } else {
    renderSearchResults('');
  }

  resultsHost?.addEventListener('click', event => {
    const trigger = event.target.closest('[data-community-target]');
    if (!trigger) return;
    const item = itemLookup.get(trigger.dataset.communityTarget);
    if (!item) return;
    if (item.type === 'post') {
      showCommunityPostDetails(item.data);
      return;
    }
    showEventDetails(item.data);
  });

  wrapper.querySelectorAll('[data-community-action]').forEach(button => {
    button.addEventListener('click', event => {
      const action = event.currentTarget.dataset.communityAction;
      handleCommunityAction(action, { post, mode });
    });
  });

  const composer = wrapper.querySelector('[data-community-composer]');
  composer?.addEventListener('submit', event => {
    event.preventDefault();
    notifyUser('Experience queued for the community feed.');
    closeDashboardModal();
  });

  const focusSelector = mode === 'share'
    ? '[data-community-composer] input[name="title"]'
    : `#${searchId}`;
  const labelText = post
    ? `Community post ${post.title}`
    : mode === 'share'
      ? 'Upload Yuck experience'
      : 'Find your Yuck community';
  openDashboardModal(wrapper, { label: labelText, focusSelector });
}

function handleCommunityAction(action, context = {}) {
  const target = context.post?.author || 'your crew';
  const messages = {
    'add-friend': `Friend request ready to send to ${target}. Full invites unlock soon.`,
    'send-message': `Draft message to ${target} saved. We will deliver it once messaging goes live.`,
    'start-thread': 'Crew thread stub created. It will publish once the community tools ship.'
  };
  notifyUser(messages[action] || 'Feature coming soon.');
}

function showEventDetails(entry) {
  if (!entry) return;
  const type = entry.type === 'activity' ? 'activity' : 'event';
  const title = type === 'event' ? entry.name : `${entry.region || 'Community'} meetup`;
  const date = type === 'event' && entry.date ? new Date(entry.date) : null;
  const dateLabel = date && !Number.isNaN(date.valueOf()) ? date.toLocaleString() : 'Date to be announced';
  const attendees = Array.isArray(entry.attendees) && entry.attendees.length
    ? entry.attendees
    : ['Andre', 'Rae', 'Nia', 'Coach Simu'];
  const metaMarkup = type === 'event'
    ? `
      <div>
        <span class="label">Date</span>
        <strong>${dateLabel}</strong>
      </div>
      <div>
        <span class="label">Location</span>
        <strong>${entry.location || 'To be confirmed'}</strong>
      </div>
    `
    : `
      <div>
        <span class="label">Region</span>
        <strong>${entry.region || 'Community'}</strong>
      </div>
      <div>
        <span class="label">Focus</span>
        <strong>${entry.summary || 'Crew plans coming soon.'}</strong>
      </div>
    `;
  const introCopy = type === 'event'
    ? 'Lock in your RSVP, see who else is rolling up, and broadcast invites.'
    : 'Crew check in details and the next drop of shared plans.';

  const detail = document.createElement('div');
  detail.className = 'event-modal';
  detail.innerHTML = `
    <header class="event-modal__header">
      <span class="dashboard-tag">${type === 'event' ? 'Event' : 'Crew drop'}</span>
      <h3>${title}</h3>
      <p>${introCopy}</p>
    </header>
    <section class="event-modal__meta">
      ${metaMarkup}
    </section>
    <section class="event-modal__actions">
      <button type="button" data-event-action="rsvp">RSVP</button>
      <button type="button" data-event-action="checkin">Check in</button>
      <button type="button" data-event-action="invite">Invite friends</button>
      <button type="button" data-event-action="attendees">See attendees</button>
    </section>
    <section class="event-modal__attendees">
      <h4>Attending</h4>
      <ul>
        ${attendees.map(name => `<li>${name}</li>`).join('')}
      </ul>
    </section>
  `;

  const attendeesSection = detail.querySelector('.event-modal__attendees');
  detail.querySelectorAll('[data-event-action]').forEach(button => {
    button.addEventListener('click', event => {
      const action = event.currentTarget.dataset.eventAction;
      if (action === 'attendees') {
        attendeesSection?.classList.add('is-highlighted');
        attendeesSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
          attendeesSection?.classList.remove('is-highlighted');
        }, 1200);
        return;
      }
      handleEventAction(action, entry);
    });
  });

  openDashboardModal(detail, { label: `${type === 'event' ? 'Event' : 'Crew'} details for ${title}`, focusSelector: '[data-event-action]' });
}

function handleEventAction(action, entry) {
  const label = entry?.name || entry?.region || 'this session';
  const messages = {
    rsvp: `RSVP saved for ${label}. We will remind you before it starts.`,
    checkin: `Check in recorded for ${label}. Have a strong session.`,
    invite: 'Invite flow opens in the live release. We flagged this for your crew lead.'
  };
  notifyUser(messages[action] || 'Feature coming soon.');
}

function handleProfileAction(action) {
  if (action === 'find-crew') {
    openCommunityModal({ mode: 'discover' });
    return;
  }
  if (action === 'upload-story') {
    openCommunityModal({ mode: 'share' });
    return;
  }
  notifyUser('Feature coming soon.');
}

function notifyUser(message) {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
  } else {
    console.log(message);
  }
}

function timeAgo(timestamp) {
  if (!timestamp) return 'just now';
  const delta = Date.now() - timestamp;
  const minutes = Math.round(delta / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

async function handleAccountClick(event) {
  event.preventDefault();
  authState.lastTrigger = event.currentTarget;
  if (authState.status === 'unknown') {
    await refreshAuthState();
  }
  if (authState.status === 'authenticated') {
    window.location.href = './dashboard.html';
  } else {
    openAccountOverlay();
  }
}
