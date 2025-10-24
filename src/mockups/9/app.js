document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.25,
      rootMargin: "0px 0px -10% 0px"
    }
  );

  document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el));

  const depthElements = document.querySelectorAll("[data-depth]");
  const applyParallax = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    depthElements.forEach(el => {
      const depth = parseFloat(el.dataset.depth) || 1;
      const translate = (scrollY * depth) / 35;
      el.style.transform = `translateY(${translate}px)`;
    });
  };
  applyParallax();
  window.addEventListener("scroll", applyParallax, { passive: true });

  const sceneContainer = document.querySelector("[data-scenes]");
  if (sceneContainer) {
    const buttons = sceneContainer.querySelectorAll("[data-scene]");
    const scenes = sceneContainer.querySelectorAll("[data-scene-id]");

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const target = button.dataset.scene;
        if (!target) {
          return;
        }

        buttons.forEach(btn => {
          btn.classList.toggle("is-active", btn === button);
          btn.setAttribute("aria-selected", btn === button ? "true" : "false");
        });

        scenes.forEach(scene => {
          const match = scene.dataset.sceneId === target;
          scene.classList.toggle("is-active", match);
          scene.hidden = !match;
        });
      });
    });
  }

  const planDetails = document.querySelector(".plan-details");
  const planButtons = document.querySelectorAll(".toggle-btn");
  const plans = {
    subscription: {
      title: "Subscribe & curate",
      price: "$68 / month",
      description: "Receive your core blend every 30 days with optional creator dose add-ons.",
      bullets: [
        "Rotating artist capsules",
        "Telemetry dashboard",
        "Pause or remix anytime"
      ]
    },
    "one-time": {
      title: "One-time drop",
      price: "$82",
      description: "Perfect for show week or as a starter ritual before committing to the lab.",
      bullets: [
        "Includes tasting notes",
        "Two experimental packets",
        "Ships within 24 hours"
      ]
    }
  };

  const renderPlan = planKey => {
    const plan = plans[planKey];
    if (!plan || !planDetails) {
      return;
    }
    planDetails.innerHTML = `
      <h3>${plan.title}</h3>
      <p class="price">${plan.price}</p>
      <p>${plan.description}</p>
      <ul>${plan.bullets.map(item => `<li>${item}</li>`).join("")}</ul>
    `;
  };

  if (planDetails && planButtons.length) {
    renderPlan("subscription");
    planButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        planButtons.forEach(other => other.classList.toggle("active", other === btn));
        renderPlan(btn.dataset.plan);
      });
    });
  }

  const noteStream = [
    {
      author: "Andre",
      title: "Signal Shield",
      time: "2m ago",
      note: "Layered the base with citrus bitters and hit a new PR in cadence drills."
    },
    {
      author: "Marisa",
      title: "Motion Notes",
      time: "8m ago",
      note: "Using the warm-up vial to cue choreography—clarity without the jitters."
    },
    {
      author: "Lina",
      title: "Studio South",
      time: "15m ago",
      note: "Shared the gallery capsule with two new collaborators, syncing on mood tracking."
    },
    {
      author: "Theo",
      title: "Echo Lab",
      time: "22m ago",
      note: "Experimenting with mineral ratios; sharing telemetry to the Discord channel now."
    },
    {
      author: "Kai",
      title: "North Circuit",
      time: "35m ago",
      note: "Paired the Light Lab drop with ambient lighting setup—clients noticed the calm shift."
    }
  ];

  const feedEl = document.querySelector("[data-stream]");
  const loadBtn = document.querySelector('[data-action="load-more"]');
  let noteIndex = 0;
  const notesPerLoad = 2;

  const renderNotes = () => {
    if (!feedEl) {
      return;
    }
    const slice = noteStream.slice(noteIndex, noteIndex + notesPerLoad);
    const fragment = document.createDocumentFragment();
    slice.forEach(item => {
      const card = document.createElement("article");
      card.className = "note-card";
      card.innerHTML = `
        <div class="note-meta">
          <span>${item.author}</span>
          <span>${item.title}</span>
          <span>${item.time}</span>
        </div>
        <p>${item.note}</p>
      `;
      fragment.appendChild(card);
    });
    feedEl.appendChild(fragment);
    noteIndex += slice.length;
    if (noteIndex >= noteStream.length && loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = "All notes loaded";
    }
  };

  if (feedEl) {
    renderNotes();
  }

  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      renderNotes();
    });
  }

  const communityForm = document.getElementById("communityForm");
  if (communityForm) {
    communityForm.addEventListener("submit", event => {
      event.preventDefault();
      const emailInput = communityForm.querySelector("input[type=email]");
      const honeypot = communityForm.querySelector(".honeypot");
      const message = communityForm.querySelector(".form-confirmation");

      if (honeypot && honeypot.value) {
        return;
      }

      if (emailInput && emailInput.validity.valid) {
        if (message) {
          message.textContent = "Invite requested. Expect a secure link soon.";
        }
        communityForm.reset();
      } else if (message) {
        message.textContent = "Add a valid email and we will send the invite.";
      }
    });
  }

  const newsletterForm = document.getElementById("newsletterForm");
  const newsletterMsg = document.getElementById("newsletterMsg");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", event => {
      event.preventDefault();
      const emailInput = newsletterForm.querySelector("input[type=email]");
      if (emailInput && emailInput.validity.valid) {
        if (newsletterMsg) {
          newsletterMsg.textContent = "Welcome to the Light Lab signal list.";
        }
        newsletterForm.reset();
      } else if (newsletterMsg) {
        newsletterMsg.textContent = "Add a valid email to join.";
      }
    });
  }

  const modal = document.getElementById("portfolioModal");
  const modalOpeners = document.querySelectorAll("[data-modal-open]");
  const modalClosers = document.querySelectorAll("[data-modal-close]");
  const toggleModal = state => {
    if (!modal) {
      return;
    }
    if (state) {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    } else {
      modal.hidden = true;
      document.body.style.overflow = "";
    }
  };

  modalOpeners.forEach(trigger => {
    trigger.addEventListener("click", () => toggleModal(true));
  });

  modalClosers.forEach(trigger => {
    trigger.addEventListener("click", () => toggleModal(false));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      toggleModal(false);
    }
  });

  const yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const cartButton = document.querySelector('[data-action="open-cart"]');
  if (cartButton) {
    cartButton.addEventListener("click", () => {
      window.alert("Cart preview coming soon. For now, explore the Light Lab portfolio.");
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .catch(() => {
          console.warn("Service worker registration failed for mockup 9.");
        });
    });
  }
});
