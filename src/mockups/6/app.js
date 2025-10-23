// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

// Install prompt handling
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (installBtn) {
    installBtn.disabled = false;
    installBtn.classList.add('ready');
  }
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(() => {});
  deferredPrompt = null;
  installBtn.disabled = true;
  installBtn.textContent = 'Installed';
});

// Mobile navigation toggle
const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.getElementById('primaryNav');
menuToggle?.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  primaryNav?.classList.toggle('is-open', !expanded);
});

primaryNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (!primaryNav.classList.contains('is-open')) return;
    primaryNav.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

// Reveal on scroll
const revealItems = document.querySelectorAll('.reveal');
if (revealItems.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );
  revealItems.forEach((el) => revealObserver.observe(el));
}

// Hero scene switcher
const sceneSwitchers = document.querySelectorAll('[data-scene-switcher]');
sceneSwitchers.forEach((switcher) => {
  const buttons = switcher.querySelectorAll('.scene-btn');
  const panels = switcher.querySelectorAll('[data-scene-panel]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      const scene = btn.dataset.scene;
      buttons.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        const match = panel.dataset.scenePanel === scene;
        panel.classList.toggle('is-active', match);
        panel.toggleAttribute('hidden', !match);
      });
    });
  });
});

// Experience stepper
const steppers = document.querySelectorAll('[data-stepper]');
steppers.forEach((stepper) => {
  const buttons = stepper.querySelectorAll('.step-btn');
  const panels = stepper.querySelectorAll('[data-step-panel]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      const step = btn.dataset.step;
      buttons.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        const match = panel.dataset.stepPanel === step;
        panel.classList.toggle('is-active', match);
        panel.toggleAttribute('hidden', !match);
      });
    });
  });
});

// Product tilt interaction
const productCards = document.querySelectorAll('.product-card');
productCards.forEach((card) => {
  const resetTilt = () => {
    card.style.setProperty('--tiltX', '0deg');
    card.style.setProperty('--tiltY', '0deg');
  };
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -10;
    card.style.setProperty('--tiltX', `${x}deg`);
    card.style.setProperty('--tiltY', `${y}deg`);
  });
  card.addEventListener('pointerleave', resetTilt);
  card.addEventListener('pointerup', resetTilt);
  resetTilt();
});

// Accordion controls
document.querySelectorAll('[data-accordion]').forEach((accordion) => {
  accordion.querySelectorAll('.accordion-head').forEach((head) => {
    head.addEventListener('click', () => {
      const body = head.nextElementSibling;
      if (!body) return;
      const isHidden = body.hasAttribute('hidden');
      body.toggleAttribute('hidden', !isHidden);
      const caret = head.querySelector('.caret');
      if (caret) caret.textContent = isHidden ? '-' : '+';
    });
  });
});

// Modal helpers
const openModals = new Set();
const focusableSelector = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

const lockScroll = () => {
  document.documentElement.style.overflow = openModals.size ? 'hidden' : '';
};

function trapFocus(modal) {
  const focusable = Array.from(modal.querySelectorAll(focusableSelector)).filter((el) => !el.hasAttribute('disabled'));
  if (!focusable.length) return;
  const [first, last] = [focusable[0], focusable[focusable.length - 1]];
  const handleKeydown = (event) => {
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(modal);
    }
  };
  modal.addEventListener('keydown', handleKeydown);
  modal.__trapHandler = handleKeydown;
  first.focus();
}

function releaseFocus(modal) {
  if (modal.__trapHandler) {
    modal.removeEventListener('keydown', modal.__trapHandler);
    delete modal.__trapHandler;
  }
}

function openModal(id, trigger) {
  const modal = document.getElementById(id);
  if (!modal || openModals.has(modal)) return;
  modal.hidden = false;
  openModals.add(modal);
  lockScroll();

  if (trigger?.dataset.product) {
    const select = modal.querySelector('#buyProduct');
    if (select) {
      const match = Array.from(select.options).find((option) => option.value === trigger.dataset.product);
      if (match) {
        select.value = match.value;
        select.dispatchEvent(new Event('change'));
      }
    }
  }

  trapFocus(modal);
}

function closeModal(modal) {
  if (!openModals.has(modal)) return;
  modal.hidden = true;
  releaseFocus(modal);
  openModals.delete(modal);
  lockScroll();
}

document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const id = trigger.getAttribute('data-modal-open');
    if (!id) return;
    openModal(id, trigger);
  });
});

document.querySelectorAll('[data-modal-close]').forEach((closeBtn) => {
  closeBtn.addEventListener('click', () => {
    const modal = closeBtn.closest('.modal');
    if (modal) closeModal(modal);
  });
});

document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-backdrop')) {
      closeModal(modal);
    } else if (event.target.hasAttribute('data-modal-close')) {
      closeModal(modal);
    }
  });
});

// Forms
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function handleSimpleForm(form, messageEl, successText) {
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput?.value.trim() || '';
    if (emailInput && !emailPattern.test(email)) {
      if (messageEl) {
        messageEl.textContent = 'Please enter a valid email.';
        messageEl.style.color = '#c05746';
      }
      emailInput.focus();
      return;
    }
    if (messageEl) {
      messageEl.textContent = successText;
      messageEl.style.color = '#2f6f4e';
    }
    form.reset();
  });
}

const joinForm = document.getElementById('joinForm');
if (joinForm) {
  joinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(joinForm);
    if (data.get('website')) return; // Honeypot
    const email = (data.get('email') || '').toString().trim();
    const msg = document.getElementById('joinMsg');
    if (!emailPattern.test(email)) {
      if (msg) {
        msg.textContent = 'Enter a valid email.';
        msg.style.color = '#c05746';
      }
      return;
    }
    if (msg) {
      msg.textContent = 'Invite requested. Check your inbox for a secure link.';
      msg.style.color = '#2f6f4e';
    }
    joinForm.reset();
  });
}

handleSimpleForm(document.getElementById('newsletterForm'), document.getElementById('newsletterMsg'), 'Subscribed!');
handleSimpleForm(document.getElementById('joinModalForm'), document.getElementById('joinModalMsg'), 'Invite requested.');
handleSimpleForm(document.getElementById('supportModalForm'), document.getElementById('supportModalMsg'), 'Message received. We will reply soon.');

const supportForm = document.getElementById('supportForm');
if (supportForm) {
  supportForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = (supportForm.elements.email.value || '').trim();
    const msg = document.getElementById('supportMsg');
    if (!emailPattern.test(email)) {
      if (msg) {
        msg.textContent = 'Please enter a valid email.';
        msg.style.color = '#c05746';
      }
      return;
    }
    if (msg) {
      msg.textContent = 'Thanks! We will reply within 24 hours.';
      msg.style.color = '#2f6f4e';
    }
    supportForm.reset();
  });
}

// Buy form logic
const buyForm = document.getElementById('buyForm');
if (buyForm) {
  const productSelect = document.getElementById('buyProduct');
  const qtyInput = document.getElementById('buyQty');
  const totalEl = document.getElementById('buyTotal');
  const msg = document.getElementById('buyMsg');

  const computeTotal = () => {
    const option = productSelect?.selectedOptions[0];
    const base = option ? Number(option.dataset.price) : 0;
    const qty = qtyInput ? Math.max(1, Number(qtyInput.value) || 1) : 1;
    const total = base * qty;
    if (qtyInput) qtyInput.value = String(qty);
    if (totalEl) totalEl.textContent = `£${total.toFixed(2)}`;
  };

  productSelect?.addEventListener('change', computeTotal);
  qtyInput?.addEventListener('change', computeTotal);
  buyForm.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!qtyInput) return;
      const delta = Number(btn.dataset.qty) || 0;
      const next = Math.max(1, Number(qtyInput.value) + delta || 1);
      qtyInput.value = String(next);
      computeTotal();
    });
  });

  buyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    computeTotal();
    if (msg) {
      msg.textContent = 'Added to cart (demo).';
      msg.style.color = '#2f6f4e';
    }
  });

  computeTotal();
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
