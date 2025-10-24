const plans = {
  subscription: {
    title: "Subscription",
    price: "$54 / month",
    perks: [
      "Two tubs delivered every 30 days",
      "Exclusive access to The Lab training sessions",
      "Pause or cancel anytime"
    ]
  },
  "one-time": {
    title: "One-time purchase",
    price: "$62",
    perks: [
      "Single tub shipped immediately",
      "Free shaker on your first order",
      "Refill reminders at your pace"
    ]
  }
};

const planDetails = document.querySelector(".plan-details");
const planButtons = document.querySelectorAll(".toggle-btn");
const purchaseButton = document.querySelector("[data-action='purchase']");

function renderPlan(plan = "subscription") {
  const { title, price, perks } = plans[plan];
  planDetails.innerHTML = `
    <h3>${title}</h3>
    <p class="price">${price}</p>
    <ul>${perks.map((perk) => `<li>${perk}</li>`).join("")}</ul>
  `;
  purchaseButton.textContent = plan === "subscription" ? "Subscribe" : "Add to cart";
  purchaseButton.dataset.plan = plan;
}

planButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    planButtons.forEach((button) => button.classList.remove("active"));
    btn.classList.add("active");
    const plan = btn.dataset.plan;
    renderPlan(plan);
  });
});

renderPlan();

if (purchaseButton) {
  purchaseButton.addEventListener("click", () => {
    const plan = purchaseButton.dataset.plan || "subscription";
    alert(`Added ${plans[plan].title} to cart.`);
  });
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
const storyLayers = document.querySelectorAll(".story-layer");

function parallaxStory() {
  const rect = document.querySelector("#story").getBoundingClientRect();
  storyLayers.forEach((layer) => {
    const depth = parseFloat(layer.dataset.depth || 1);
    const translate = rect.top * -0.2 * (1 / depth);
    layer.style.transform = `translateY(${translate}px)`;
  });
}

window.addEventListener("scroll", parallaxStory, { passive: true });
parallaxStory();

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
    image: "https://images.pexels.com/photos/7674487/pexels-photo-7674487.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    handle: "@gritgrind",
    quote: "“No fairy dust, just results. Stay uncomfortable.”",
    image: "https://images.pexels.com/photos/7675415/pexels-photo-7675415.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    handle: "@liftyliz",
    quote: "“Yuck. tastes like success metabolized.”",
    image: "https://images.pexels.com/photos/5327520/pexels-photo-5327520.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    handle: "@runclubron",
    quote: "“Mile repeats hit harder with a little bitterness.”",
    image: "https://images.pexels.com/photos/4034027/pexels-photo-4034027.jpeg?auto=compress&cs=tinysrgb&w=800"
  }
];

const feedContainer = document.querySelector(".community-feed");
const loadMoreButton = document.querySelector("[data-action='load-more']");
let feedIndex = 0;

function createFeedCard({ handle, quote, image }) {
  const article = document.createElement("article");
  article.className = "feed-card";
  article.dataset.animate = "";
  article.innerHTML = `
    <img src="${image}" alt="Community member" loading="lazy" />
    <div>
      <h3>${handle}</h3>
      <p>${quote}</p>
    </div>
  `;
  observer.observe(article);
  return article;
}

function loadMoreFeed(count = 2) {
  const slice = feedData.slice(feedIndex, feedIndex + count);
  slice.forEach((entry) => feedContainer.appendChild(createFeedCard(entry)));
  feedIndex += slice.length;
  if (feedIndex >= feedData.length) {
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
