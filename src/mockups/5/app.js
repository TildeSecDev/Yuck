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
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.disabled = true;
  installBtn.textContent = 'Installed';
});

// Hero carousel (actual stateful slider)
(function initCarousel(){
  const shell = document.querySelector('[data-carousel]');
  if (!shell) return;
  const slides = Array.from(shell.querySelectorAll('.carousel-slide'));
  const dots = Array.from(shell.querySelectorAll('.dot'));
  const prev = shell.querySelector('.carousel-nav.prev');
  const next = shell.querySelector('.carousel-nav.next');
  if (!slides.length) return;

  let index = slides.findIndex((s) => s.classList.contains('is-active'));
  if (index < 0) index = 0;
  let timer;

  const setActive = (nextIndex, userAction = false) => {
    if (nextIndex === index) return;
    slides[index].classList.remove('is-active');
    slides[nextIndex].classList.add('is-active');
    if (dots[index]) {
      dots[index].classList.remove('is-active');
      dots[index].setAttribute('aria-selected', 'false');
    }
    if (dots[nextIndex]) {
      dots[nextIndex].classList.add('is-active');
      dots[nextIndex].setAttribute('aria-selected', 'true');
    }
    index = nextIndex;
    if (userAction) resetTimer();
  };

  const nextSlide = () => setActive((index + 1) % slides.length);
  const prevSlide = () => setActive((index - 1 + slides.length) % slides.length, true);

  const resetTimer = () => {
    clearInterval(timer);
    timer = setInterval(() => setActive((index + 1) % slides.length), 6500);
  };
  resetTimer();

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const i = Number(dot.dataset.index);
      if (Number.isNaN(i)) return;
      setActive(i, true);
    });
  });
  next?.addEventListener('click', () => setActive((index + 1) % slides.length, true));
  prev?.addEventListener('click', prevSlide);

  shell.addEventListener('mouseenter', () => clearInterval(timer));
  shell.addEventListener('mouseleave', resetTimer);
})();

// Switcher panes
document.querySelectorAll('.switch-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('is-active')) return;
    const wrapper = btn.closest('.switcher');
    if (!wrapper) return;
    const targetId = btn.dataset.paneTarget;
    wrapper.querySelectorAll('.switch-btn').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
    });
    wrapper.querySelectorAll('.switcher-pane').forEach((pane) => {
      const isMatch = pane.id === targetId;
      pane.classList.toggle('is-active', isMatch);
      pane.toggleAttribute('hidden', !isMatch);
    });
  });
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
const toggleScrollLock = () => {
  document.documentElement.style.overflow = openModals.size ? 'hidden' : '';
};

const focusableSelector = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

function openModal(id, trigger) {
  const modal = document.getElementById(id);
  if (!modal || openModals.has(modal)) return;
  modal.hidden = false;
  openModals.add(modal);
  toggleScrollLock();

  if (trigger?.dataset.product) {
    const select = modal.querySelector('#buyProduct');
    if (select) {
      const option = Array.from(select.options).find((opt) => opt.value === trigger.dataset.product);
      if (option) select.value = option.value;
      select.dispatchEvent(new Event('change'));
    }
  }

  const focusable = Array.from(modal.querySelectorAll(focusableSelector)).filter((el) => !el.hasAttribute('disabled'));
  focusable[0]?.focus();

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(modal);
    } else if (event.key === 'Tab' && focusable.length) {
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

    modal.addEventListener('keydown', handleKeydown);
    modal.__keyHandler = handleKeydown;
}

function closeModal(modal) {
  if (!openModals.has(modal)) return;
  modal.hidden = true;
  openModals.delete(modal);
  toggleScrollLock();
    if (modal.__keyHandler) {
      modal.removeEventListener('keydown', modal.__keyHandler);
      delete modal.__keyHandler;
    }
}

document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const id = trigger.getAttribute('data-modal-open');
    if (!id) return;
    openModal(id, trigger);
  });
});

document.querySelectorAll('[data-modal-close]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal');
    if (modal) closeModal(modal);
  });
});

document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target.hasAttribute('data-modal-close')) {
      const host = event.target.closest('.modal');
      if (host) closeModal(host);
    } else if (event.target.classList.contains('modal-backdrop')) {
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
        messageEl.style.color = '#d27a5c';
      }
      emailInput.focus();
      return;
    }
    if (messageEl) {
      messageEl.textContent = successText;
      messageEl.style.color = '#3f6b4a';
    }
    form.reset();
  });
}

const joinForm = document.getElementById('joinForm');
if (joinForm) {
  joinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(joinForm);
    if (data.get('website')) return; // honeypot
    const email = (data.get('email') || '').toString().trim();
    const msg = document.getElementById('joinMsg');
    if (!emailPattern.test(email)) {
      if (msg) {
        msg.textContent = 'Enter a valid email.';
        msg.style.color = '#d27a5c';
      }
      return;
    }
    if (msg) {
      msg.textContent = 'Invite requested. Check your inbox for a secure link.';
      msg.style.color = '#3f6b4a';
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
        msg.style.color = '#d27a5c';
      }
      return;
    }
    if (msg) {
      msg.textContent = 'Thanks! We will reply within 24 hours.';
      msg.style.color = '#3f6b4a';
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
      msg.style.color = '#3f6b4a';
    }
  });

  computeTotal();
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
