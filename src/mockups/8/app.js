const plans = {
  subscription: {
    title: "Subscription",
    price: "$54 / month",
    amount: 54,
    currency: "USD",
    perks: [
      "Two tubs delivered every 30 days",
      "Exclusive access to The Lab training sessions",
      "Pause or cancel anytime"
    ],
    stripe: {
      mode: "subscription",
      priceId: "price_SUBSCRIPTION_PLACEHOLDER",
      paymentLink: "",
      description: "Subscription delivery",
      image: "../../assets/images/Trolley/trolley%20item.png"
    }
  },
  "one-time": {
    title: "One-time purchase",
    price: "$62",
    amount: 62,
    currency: "USD",
    perks: [
      "Single tub shipped immediately",
      "Free shaker on your first order",
      "Refill reminders at your pace"
    ],
    stripe: {
      mode: "payment",
      priceId: "price_ONETIME_PLACEHOLDER",
      paymentLink: "",
      description: "One-time purchase",
      image: "../../assets/images/YuckPowder.webp"
    }
  }
};

const planDetails = document.querySelector(".plan-details");
const planButtons = document.querySelectorAll(".toggle-btn");
const purchaseButton = document.querySelector("[data-action='purchase']");

function renderPlan(plan = "subscription") {
  if (!planDetails || !purchaseButton) return;
  const { title, price, perks } = plans[plan];
  planDetails.innerHTML = `
    <h3>${title}</h3>
    <p class="price">${price}</p>
    <ul>${perks.map((perk) => `<li>${perk}</li>`).join("")}</ul>
  `;
  purchaseButton.textContent = plan === "subscription" ? "Subscribe" : "Add to cart";
  purchaseButton.dataset.plan = plan;
}

if (planDetails && purchaseButton) {
  planButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      planButtons.forEach((button) => button.classList.remove("active"));
      btn.classList.add("active");
      const plan = btn.dataset.plan;
      renderPlan(plan);
    });
  });

  renderPlan();
}

// Intersection Observer for reveal animations
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.25 }
);

document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));

// Parallax depth effect
const parallaxElements = document.querySelectorAll("[data-depth]");

function applyDepthEffect() {
  const scrollY = window.scrollY;
  parallaxElements.forEach((el) => {
    const depth = parseFloat(el.dataset.depth || 1);
    const translateY = scrollY * (1 - 1 / depth) * 0.1;
    el.style.transform = `translateY(${translateY}px)`;
  });
}

window.addEventListener("scroll", applyDepthEffect, { passive: true });
applyDepthEffect();

// Story parallax layers
const storySection = document.querySelector("#story");
const storyLayers = storySection ? storySection.querySelectorAll(".story-layer") : [];

function parallaxStory() {
  if (!storySection || !storyLayers.length) return;
  const rect = storySection.getBoundingClientRect();
  storyLayers.forEach((layer) => {
    const depth = parseFloat(layer.dataset.depth || 1);
    const translate = rect.top * -0.2 * (1 / depth);
    layer.style.transform = `translateY(${translate}px)`;
  });
}

if (storySection && storyLayers.length) {
  window.addEventListener("scroll", parallaxStory, { passive: true });
  parallaxStory();
}

// Community form submission
const communityForm = document.querySelector(".community-form");
const confirmation = document.querySelector(".form-confirmation");

if (communityForm) {
  communityForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = communityForm.email.value.trim();
    if (email) {
      confirmation.textContent = "Invite requested. Watch your inbox for Lab access.";
      confirmation.classList.add("visible");
      communityForm.reset();
    } else {
      confirmation.textContent = "Please add a valid email address.";
    }
  });
}

// Community feed lazy loading simulation
const feedData = [
  {
    handle: "@circuitcarlos",
    quote: "“My legs hate me, my stats love me.”",
    image: "../../assets/images/background-image-title-cutout.png",
    alt: "Athlete packing the Yuck. tote with supplements and ritual card"
  },
  {
    handle: "@gritgrind",
    quote: "“No fairy dust, just results. Stay uncomfortable.”",
    image: "../../assets/images/Trolley/trolley%20plain.svg",
    alt: "Minimal line illustration of the Yuck. trolley kit"
  },
  {
    handle: "@liftyliz",
    quote: "“Yuck. tastes like success metabolized.”",
    image: "../../assets/images/powder-explosion.png",
    alt: "Powder suspended mid-air from a Yuck. scoop"
  },
  {
    handle: "@runclubron",
    quote: "“Mile repeats hit harder with a little bitterness.”",
    image: "../../assets/images/Models.png",
    alt: "Relay team cooling down with Yuck. shakers"
  }
];

const feedContainer = document.querySelector(".community-feed");
const loadMoreButton = document.querySelector("[data-action='load-more']");
let feedIndex = 0;

function createFeedCard({ handle, quote, image, alt }) {
  const article = document.createElement("article");
  article.className = "feed-card";
  article.dataset.animate = "";
  const fallbackAlt = alt || `${handle} sharing their Yuck. ritual`;
  article.innerHTML = `
    <img src="${image}" alt="${fallbackAlt}" loading="lazy" />
    <div>
      <h3>${handle}</h3>
      <p>${quote}</p>
    </div>
  `;
  observer.observe(article);
  return article;
}

function loadMoreFeed(count = 2) {
  if (!feedContainer) return;
  const slice = feedData.slice(feedIndex, feedIndex + count);
  slice.forEach((entry) => feedContainer.appendChild(createFeedCard(entry)));
  feedIndex += slice.length;
  if (loadMoreButton && feedIndex >= feedData.length) {
    loadMoreButton.disabled = true;
    loadMoreButton.textContent = "All moments loaded";
  }
}

if (loadMoreButton) {
  loadMoreButton.addEventListener("click", () => loadMoreFeed(2));
}

// Preload initial feed
loadMoreFeed(2);

// Footer year
const yearTarget = document.querySelector("[data-year]");
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

// Register service worker for PWA shell
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((error) => console.warn("Service worker registration failed", error));
  });
}

// -------- Modal infrastructure --------

const modalOverlay = document.querySelector("[data-modal-overlay]");
const searchModal = document.getElementById("search-modal");
const authModal = document.getElementById("auth-modal");
const cartModal = document.getElementById("cart-modal");

const navSearchTrigger = document.querySelector("[data-trigger='search']");
const navCartTrigger = document.querySelector("[data-trigger='cart']");
const navAuthTrigger = document.querySelector("[data-trigger='auth']");

const modalCloseButtons = document.querySelectorAll("[data-close-modal]");
const toast = document.querySelector(".toast");

let activeModal = null;
let activeTrigger = null;
let toastTimeout = null;

function setTriggerExpanded(trigger, expanded) {
  if (trigger) {
    trigger.setAttribute("aria-expanded", String(expanded));
  }
}

function toggleBodyScroll(lock) {
  document.body.classList.toggle("modal-open", lock);
}

function showOverlay() {
  if (!modalOverlay) return;
  modalOverlay.removeAttribute("hidden");
  modalOverlay.setAttribute("aria-hidden", "false");
}

function hideOverlay() {
  if (!modalOverlay) return;
  modalOverlay.setAttribute("aria-hidden", "true");
  modalOverlay.setAttribute("hidden", "");
}

function focusFirstElement(modal) {
  const focusableSelectors = [
    "[data-focus]",
    "input",
    "button",
    "select",
    "textarea",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])"
  ];
  const focusTarget = modal.querySelector(focusableSelectors.join(","));
  if (focusTarget) {
    focusTarget.focus({ preventScroll: true });
  }
}

function openModal(modal, trigger = null) {
  if (!modal) return;
  if (activeModal && activeModal !== modal) {
    closeModal(activeModal, activeTrigger);
  }
  activeModal = modal;
  activeTrigger = trigger;
  modal.removeAttribute("hidden");
  modal.setAttribute("aria-hidden", "false");
  showOverlay();
  toggleBodyScroll(true);
  window.setTimeout(() => focusFirstElement(modal), 50);
}

function closeModal(modal = activeModal, trigger = activeTrigger) {
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("hidden", "");
  setTriggerExpanded(trigger, false);
  activeModal = null;
  activeTrigger = null;
  // Only hide overlay if no other modal is open
  const remaining = [...document.querySelectorAll(".modal, .cart-modal")].some(
    (element) => !element.hasAttribute("hidden")
  );
  if (!remaining) {
    hideOverlay();
    toggleBodyScroll(false);
  }
}

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const parentModal = button.closest(".modal, .cart-modal");
    closeModal(parentModal, activeTrigger);
  });
});

if (modalOverlay) {
  modalOverlay.addEventListener("click", () => closeModal());
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeModal) {
    closeModal();
  }
});

function showToast(message) {
  if (!toast) return;
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.removeAttribute("hidden");
  toast.classList.add("visible");
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("visible");
    toastTimeout = window.setTimeout(() => toast.setAttribute("hidden", ""), 250);
  }, 3200);
}

// -------- Search modal --------

const searchInput = document.getElementById("site-search");
const searchResultsContainer = document.querySelector(".search-results");
const searchEmptyMessage = document.querySelector(".search-empty");

const searchIndex = [
  {
    title: "The ritual formula",
    description: "Deep dive into ingredients, sourcing, and sensory science.",
    href: "index.html#product",
    category: "Product"
  },
  {
    title: "Join a community pod",
    description: "Find accountability squads and weekly live sessions.",
    href: "community.html",
    category: "Community"
  },
  {
    title: "Brand timeline",
    description: "Explore milestones from garage batches to global labs.",
    href: "about.html#timeline",
    category: "About"
  },
  {
    title: "Support & FAQ",
    description: "Access bitter science insights, shipping help, and more.",
    href: "about.html#support",
    category: "Support"
  },
  {
    title: "Frequently asked questions",
    description: "Learn why the ritual stays bitter and how to pause deliveries.",
    href: "about.html#faq",
    category: "Support"
  },
  {
    title: "Purchase options",
    description: "Compare subscriptions with one-off drops for your ritual kit.",
    href: "index.html#purchase-options",
    category: "Checkout"
  }
];

function clearSearchResults() {
  if (searchResultsContainer) {
    searchResultsContainer.innerHTML = "";
  }
  if (searchEmptyMessage) {
    searchEmptyMessage.hidden = true;
  }
}

function renderSearchResults(results, query) {
  if (!searchResultsContainer || !searchEmptyMessage) return;
  searchResultsContainer.innerHTML = "";
  if (!query) {
    searchEmptyMessage.hidden = false;
    searchEmptyMessage.textContent = "Keep typing—results appear as you search.";
    return;
  }
  if (!results.length) {
    searchEmptyMessage.hidden = false;
    searchEmptyMessage.textContent = "Nothing yet. Try another ritual keyword.";
    return;
  }
  searchEmptyMessage.hidden = true;
  const fragment = document.createDocumentFragment();
  results.forEach((result) => {
    const link = document.createElement("a");
    link.className = "search-result";
    link.href = result.href;
    link.innerHTML = `
      <span>${result.category}</span>
      <strong>${result.title}</strong>
      <p>${result.description}</p>
    `;
    link.addEventListener("click", () => closeModal(searchModal, navSearchTrigger));
    fragment.appendChild(link);
  });
  searchResultsContainer.appendChild(fragment);
}

function handleSearchInput(event) {
  const query = event.target.value.trim().toLowerCase();
  if (query.length < 2) {
    renderSearchResults([], query);
    return;
  }
  const matches = searchIndex.filter((item) => {
    const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
    return haystack.includes(query);
  });
  renderSearchResults(matches, query);
}

if (searchInput) {
  searchInput.addEventListener("input", handleSearchInput);
}

if (navSearchTrigger) {
  navSearchTrigger.addEventListener("click", () => {
    clearSearchResults();
    if (searchInput) {
      searchInput.value = "";
    }
    openModal(searchModal, navSearchTrigger);
    setTriggerExpanded(navSearchTrigger, true);
    window.setTimeout(() => searchInput?.focus({ preventScroll: true }), 60);
  });
}

// -------- Authentication --------

const authToggle = document.querySelector(".auth-toggle");
const authToggleButtons = document.querySelectorAll(".auth-toggle-btn");
const authForms = document.querySelectorAll("[data-auth-form]");
const loginForm = document.querySelector("[data-auth-form='login']");
const signupForm = document.querySelector("[data-auth-form='signup']");
const accountView = document.querySelector("[data-auth-form='account']");
const authTitle = document.querySelector("[data-auth-target='title']");
const authSubtitle = document.querySelector("[data-auth-target='subtitle']");
const authNameTarget = document.querySelector("[data-auth-name]");
const authOnlyElements = document.querySelectorAll("[data-auth-only]");
const dashboardNameTargets = document.querySelectorAll("[data-dashboard-name]");
const dashboardEmailTargets = document.querySelectorAll("[data-dashboard-email]");
const authGuardTarget = document.querySelector("[data-auth-guard]");

const AUTH_REDIRECT_KEY = "yuckAuthRedirect";
let pendingRedirectIntent = null;

const STORAGE_KEYS = {
  ACCOUNT: "yuckAccount",
  CART: "yuckCart"
};

const state = {
  account: null,
  cart: []
};

function loadAccountFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && parsed.email) {
      return parsed;
    }
  } catch (error) {
    console.warn("Unable to parse stored account", error);
  }
  return null;
}

function persistAccount(account) {
  try {
    if (account) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACCOUNT);
    }
  } catch (error) {
    console.warn("Unable to persist account", error);
  }
}

function setRedirectIntent(intent) {
  try {
    if (intent) {
      sessionStorage.setItem(AUTH_REDIRECT_KEY, intent);
    } else {
      sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    }
  } catch (error) {
    console.warn("Unable to persist auth redirect intent", error);
  }
}

function getRedirectIntent() {
  try {
    return sessionStorage.getItem(AUTH_REDIRECT_KEY);
  } catch (error) {
    console.warn("Unable to read auth redirect intent", error);
    return null;
  }
}

let currentAuthView = "login";

function switchAuthView(view) {
  currentAuthView = view;
  authToggleButtons.forEach((btn) => {
    const isActive = btn.dataset.authView === view;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  authForms.forEach((form) => {
    if (form.dataset.authForm === view) {
      form.removeAttribute("hidden");
    } else if (form.dataset.authForm !== "account") {
      form.setAttribute("hidden", "");
    }
  });
  if (authTitle) {
    authTitle.textContent = view === "signup" ? "Join the Lab." : "Welcome back to Yuck.";
  }
  if (authSubtitle) {
    authSubtitle.textContent =
      view === "signup"
        ? "Create an account to manage subscriptions, pods, and bitter rituals."
        : "Log in to manage subscriptions, pods, and ritual reminders.";
  }
}

function toggleAuthOnlyElements(isAuthenticated) {
  authOnlyElements.forEach((element) => {
    if (isAuthenticated) {
      element.removeAttribute("hidden");
    } else {
      element.setAttribute("hidden", "");
    }
  });
}

function updateDashboardIdentity(displayName, shortName, email) {
  dashboardNameTargets.forEach((target) => {
    target.textContent = shortName;
    if (displayName) {
      target.dataset.fullName = displayName;
    }
  });
  dashboardEmailTargets.forEach((target) => {
    target.textContent = email;
  });
}

authToggleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchAuthView(btn.dataset.authView);
    if (btn.dataset.authView === "login") {
      loginForm?.querySelector("input")?.focus({ preventScroll: true });
    } else {
      signupForm?.querySelector("input")?.focus({ preventScroll: true });
    }
  });
});

function updateAuthUI() {
  const nameValue = state.account?.name?.trim() || "";
  const emailValue = state.account?.email || "";
  const displayName = nameValue || emailValue || "Athlete";
  const shortName = nameValue ? nameValue.split(/\s+/)[0] : displayName;
  const emailForDisplay = emailValue || "athlete@yuck.com";

  toggleAuthOnlyElements(Boolean(state.account));
  updateDashboardIdentity(displayName, shortName, emailForDisplay);
  if (document.body) {
    document.body.dataset.authenticated = state.account ? "true" : "false";
  }

  if (state.account) {
    authToggle?.setAttribute("hidden", "");
    loginForm?.setAttribute("hidden", "");
    signupForm?.setAttribute("hidden", "");
    accountView?.removeAttribute("hidden");
    if (authTitle) {
      authTitle.textContent = `Ritual ready, ${shortName}.`;
    }
    if (authSubtitle) {
      authSubtitle.textContent = "Manage your Lab access below.";
    }
    if (authNameTarget) {
      authNameTarget.textContent = displayName;
    }
    if (navAuthTrigger) {
      navAuthTrigger.textContent = "Account";
    }
  } else {
    authToggle?.removeAttribute("hidden");
    accountView?.setAttribute("hidden", "");
    switchAuthView(currentAuthView);
    if (navAuthTrigger) {
      navAuthTrigger.textContent = "Sign in";
    }
  }
}

function handleSignup(event) {
  event.preventDefault();
  const formData = new FormData(signupForm);
  const name = formData.get("name").trim();
  const email = formData.get("email").trim().toLowerCase();
  const password = formData.get("password");
  if (!name || !email || !password) {
    showToast("Fill in every field to join the Lab.");
    return;
  }
  state.account = { name, email, password };
  persistAccount(state.account);
  signupForm.reset();
  showToast("Account created. You're wired in.");
  updateAuthUI();
  const redirectTarget = pendingRedirectIntent;
  pendingRedirectIntent = null;
  setRedirectIntent(null);
  if (redirectTarget === "dashboard") {
    window.location.href = "dashboard.html";
    return;
  }
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get("email").trim().toLowerCase();
  const password = formData.get("password");
  if (!state.account) {
    showToast("No account yet. Create one to access the Lab.");
    return;
  }
  if (state.account.email === email && state.account.password === password) {
    showToast("Logged in. The ritual is ready.");
    loginForm.reset();
    updateAuthUI();
    const redirectTarget = pendingRedirectIntent;
    pendingRedirectIntent = null;
    setRedirectIntent(null);
    if (redirectTarget === "dashboard") {
      window.location.href = "dashboard.html";
      return;
    }
  } else {
    showToast("Credentials mismatch. Try again or sign up.");
  }
}

function handleLogout() {
  state.account = null;
  persistAccount(null);
  updateAuthUI();
  setRedirectIntent(null);
  showToast("Logged out. We'll be ready when you are.");
  pendingRedirectIntent = null;
  if (authGuardTarget) {
    authGuardTarget.setAttribute("hidden", "");
    window.setTimeout(() => {
      window.location.replace("index.html");
    }, 250);
  }
}

function handleManageSubscription() {
  showToast("Coming soon: Manage billing and pods from your dashboard.");
}

loginForm?.addEventListener("submit", handleLogin);
signupForm?.addEventListener("submit", handleSignup);

document.querySelectorAll("[data-action='logout']").forEach((button) => {
  button.addEventListener("click", handleLogout);
});

document.querySelectorAll("[data-action='manage-subscription']").forEach((button) => {
  button.addEventListener("click", handleManageSubscription);
});

function enforceAuthGuard() {
  if (!authGuardTarget) return;
  if (state.account) {
    authGuardTarget.removeAttribute("hidden");
    return;
  }
  pendingRedirectIntent = null;
  setRedirectIntent("dashboard");
  window.location.replace("index.html");
}

function handleAuthRedirectPrompt() {
  if (!navAuthTrigger) return;
  const redirectIntent = getRedirectIntent();
  if (!redirectIntent || state.account) return;
  if (authGuardTarget && !state.account) return;
  pendingRedirectIntent = redirectIntent;
  setRedirectIntent(null);
  updateAuthUI();
  openModal(authModal, navAuthTrigger);
  setTriggerExpanded(navAuthTrigger, true);
  const promptMessage = redirectIntent === "dashboard" ? "Log in to access the dashboard." : "Log in to continue.";
  showToast(promptMessage);
}

if (navAuthTrigger) {
  navAuthTrigger.addEventListener("click", () => {
    updateAuthUI();
    openModal(authModal, navAuthTrigger);
    setTriggerExpanded(navAuthTrigger, true);
  });
}

state.account = loadAccountFromStorage();
updateAuthUI();
enforceAuthGuard();
handleAuthRedirectPrompt();

// -------- Cart + checkout --------

const cartItemsContainer = document.querySelector("[data-cart-items]");
const cartTotal = document.querySelector("[data-cart-total]");
const checkoutButton = document.querySelector("[data-action='checkout']");
const cartEmptyTemplate = `<p class="cart-empty">No rituals in the kit yet. Add a plan to begin.</p>`;

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CART);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => Boolean(plans[item.planKey]));
    }
  } catch (error) {
    console.warn("Unable to parse stored cart", error);
  }
  return [];
}

function persistCart() {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
  } catch (error) {
    console.warn("Unable to persist cart", error);
  }
}

function updateCartCount() {
  const badge = document.querySelector(".cart-count");
  if (!badge) return;
  const totalQuantity = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = String(totalQuantity);
  badge.hidden = totalQuantity === 0;
}

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

function renderCart() {
  if (!cartItemsContainer) return;
  if (!state.cart.length) {
    cartItemsContainer.innerHTML = cartEmptyTemplate;
    if (cartTotal) {
      cartTotal.textContent = formatCurrency(0);
    }
    updateCartCount();
    return;
  }

  const fragment = document.createDocumentFragment();
  state.cart.forEach((item) => {
    const plan = plans[item.planKey];
    const container = document.createElement("article");
    container.className = "cart-item";
    const planPrice = plan.price;
    container.innerHTML = `
      <header>
        <div>
          <h4>${plan.title}</h4>
          <p>${planPrice}</p>
        </div>
        <button type="button" class="cart-remove" data-action="remove" data-id="${item.planKey}">Remove</button>
      </header>
      <div class="cart-item-actions">
        <div class="quantity-control">
          <button type="button" data-action="decrement" data-id="${item.planKey}">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increment" data-id="${item.planKey}">+</button>
        </div>
        <strong>${formatCurrency((plan.amount || 0) * item.quantity, plan.currency)}</strong>
      </div>
    `;
    fragment.appendChild(container);
  });
  cartItemsContainer.innerHTML = "";
  cartItemsContainer.appendChild(fragment);

  const uniqueModes = new Set(state.cart.map((entry) => plans[entry.planKey]?.stripe?.mode));
  const currency = plans[state.cart[0].planKey]?.currency || "USD";
  const total = state.cart.reduce((sum, entry) => {
    const plan = plans[entry.planKey];
    return sum + (plan.amount || 0) * entry.quantity;
  }, 0);
  if (cartTotal) {
    const suffix = uniqueModes.size === 1 && uniqueModes.has("subscription") ? " / month" : "";
    cartTotal.textContent = `${formatCurrency(total, currency)}${suffix}`;
  }
  updateCartCount();
}

function addToCart(planKey) {
  const plan = plans[planKey];
  if (!plan) {
    showToast("Plan not found. Try refreshing the page.");
    return;
  }
  const existing = state.cart.find((item) => item.planKey === planKey);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ planKey, quantity: 1 });
  }
  persistCart();
  renderCart();
  showToast(`${plan.title} added to your ritual kit.`);
}

function updateCartItem(planKey, delta) {
  const target = state.cart.find((item) => item.planKey === planKey);
  if (!target) return;
  target.quantity += delta;
  if (target.quantity <= 0) {
    state.cart = state.cart.filter((item) => item.planKey !== planKey);
  }
  persistCart();
  renderCart();
}

function removeCartItem(planKey) {
  state.cart = state.cart.filter((item) => item.planKey !== planKey);
  persistCart();
  renderCart();
}

cartItemsContainer?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (!id) return;
  if (action === "increment") {
    updateCartItem(id, 1);
  } else if (action === "decrement") {
    updateCartItem(id, -1);
  } else if (action === "remove") {
    removeCartItem(id);
    showToast("Removed from your kit.");
  }
});

if (navCartTrigger) {
  navCartTrigger.addEventListener("click", () => {
    renderCart();
    openModal(cartModal, navCartTrigger);
    setTriggerExpanded(navCartTrigger, true);
  });
}

function ensureStripeConfigured() {
  const key = window.STRIPE_PUBLIC_KEY || window.__STRIPE_PUBLIC_KEY__ || "";
  if (!key) {
    showToast("Stripe public key missing. Set window.STRIPE_PUBLIC_KEY to enable checkout.");
    return null;
  }
  if (typeof window.Stripe !== "function") {
    showToast("Stripe.js failed to load. Check your network and try again.");
    return null;
  }
  return window.Stripe(key);
}

async function handleCheckout() {
  if (!state.cart.length) {
    showToast("Add a plan before checking out.");
    return;
  }
  const stripe = ensureStripeConfigured();
  if (!stripe) return;

  const uniqueModes = new Set(state.cart.map((entry) => plans[entry.planKey]?.stripe?.mode));
  if (uniqueModes.size > 1) {
    showToast("Checkout one plan type at a time. Remove extras to continue.");
    return;
  }

  const mode = [...uniqueModes][0];
  const lineItems = state.cart.map((entry) => {
    const plan = plans[entry.planKey];
    const priceId = plan?.stripe?.priceId;
    return {
      planKey: entry.planKey,
      priceId,
      quantity: entry.quantity
    };
  });

  if (lineItems.some((item) => !item.priceId || item.priceId.includes("PLACEHOLDER"))) {
    showToast("Update Stripe price IDs in app.js before going live.");
    return;
  }

  try {
    await stripe.redirectToCheckout({
      mode,
      lineItems: lineItems.map((item) => ({ price: item.priceId, quantity: item.quantity })),
      successUrl: `${window.location.origin}?checkout=success`,
      cancelUrl: `${window.location.origin}?checkout=cancel`
    });
  } catch (error) {
    console.error("Stripe checkout error", error);
    showToast("Checkout failed. Try again in a bit.");
  }
}

checkoutButton?.addEventListener("click", handleCheckout);

state.cart = loadCartFromStorage();
renderCart();

if (purchaseButton) {
  purchaseButton.addEventListener("click", () => {
    const planKey = purchaseButton.dataset.plan || "subscription";
    addToCart(planKey);
    openModal(cartModal, navCartTrigger);
    setTriggerExpanded(navCartTrigger, true);
  });
}

// -------- Misc utilities --------

const checkoutParams = new URLSearchParams(window.location.search);
if (checkoutParams.get("checkout") === "success") {
  showToast("Payment succeeded. Welcome deeper into the Lab.");
  checkoutParams.delete("checkout");
  const newUrl = `${window.location.pathname}${checkoutParams.toString() ? `?${checkoutParams.toString()}` : ""}`;
  window.history.replaceState({}, document.title, newUrl);
}
if (checkoutParams.get("checkout") === "cancel") {
  showToast("Checkout canceled. Your kit is waiting.");
  checkoutParams.delete("checkout");
  const newUrl = `${window.location.pathname}${checkoutParams.toString() ? `?${checkoutParams.toString()}` : ""}`;
  window.history.replaceState({}, document.title, newUrl);
}
