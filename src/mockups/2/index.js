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

/* ===================== INITIALISATION ===================== */
initAccountOverlay();
initSearchOverlay();
initCartOverlay();
initShopCards();
initProductDetailInteractions();
updateCurrentYear();
initAuth();

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
    trigger.setAttribute('title', authState.status === 'authenticated' ? 'View your dashboard' : 'Sign in or create account');
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
  renderDashboardSection('dashboard-orders', data.orders, order => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.style.padding = '18px';
    wrapper.innerHTML = `
      <strong>Order #${order.id}</strong>
      <div class="small">Status: ${order.status}</div>
      <div class="small">Total: ${formatCurrency(order.total)}</div>
      <div class="small">Placed ${timeAgo(order.placedAt)}</div>
    `;
    return wrapper;
  });

  renderDashboardSection('dashboard-posts', data.communityPosts, post => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.style.padding = '18px';
    wrapper.innerHTML = `
      <strong>${post.title}</strong>
      <div class="small">${post.author} • ${timeAgo(post.publishedAt)}</div>
    `;
    return wrapper;
  });

  renderDashboardSection('dashboard-events', data.events, event => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.style.padding = '18px';
    const date = new Date(event.date);
    wrapper.innerHTML = `
      <strong>${event.name}</strong>
      <div class="small">${date.toLocaleDateString()}</div>
      <div class="small">${event.location}</div>
    `;
    return wrapper;
  });

  renderDashboardSection('dashboard-activities', data.activities, activity => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.style.padding = '18px';
    wrapper.innerHTML = `
      <strong>${activity.region}</strong>
      <div class="small">${activity.summary}</div>
    `;
    return wrapper;
  });
}

function renderDashboardSection(containerId, items, renderItem) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (!items || !items.length) {
    const empty = document.createElement('div');
    empty.className = 'auth-modal__error';
    empty.style.background = 'rgba(0,0,0,0.04)';
    empty.style.color = 'rgba(0,0,0,0.6)';
    empty.textContent = 'Nothing to show yet.';
    container.append(empty);
    return;
  }
  items.forEach(item => {
    const element = renderItem(item);
    container.append(element);
  });
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
