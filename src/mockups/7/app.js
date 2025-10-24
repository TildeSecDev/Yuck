const doc = document;

const modals = Array.from(doc.querySelectorAll('.modal'));
const openButtons = Array.from(doc.querySelectorAll('[data-modal-open]'));
const closeSelectors = Array.from(doc.querySelectorAll('[data-modal-close]'));
const productField = doc.getElementById('productField');

const toggleModal = (id, open = true) => {
  const modal = doc.getElementById(id);
  if (!modal) return;
  modal.classList.toggle('is-open', open);
  modal.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (!open) return;
  const focusable = modal.querySelector('button, [href], input, select, textarea');
  if (focusable) focusable.focus({ preventScroll: true });
};

openButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const modalId = button.dataset.modalOpen;
    const productName = button.dataset.product;
    toggleModal(modalId, true);
    if (productField && productName) {
      productField.value = productName;
    }
  });
});

closeSelectors.forEach((trigger) =>
  trigger.addEventListener('click', () => {
    const modal = trigger.closest('.modal');
    if (!modal) return;
    toggleModal(modal.id, false);
  })
);

doc.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openModal = modals.find((modal) => modal.classList.contains('is-open'));
  if (openModal) {
    toggleModal(openModal.id, false);
  }
});

// Ambient header blur intensity adjusts with scroll.
const header = doc.querySelector('[data-ambient]');
if (header) {
  const updateHeader = () => {
    const scrolled = Math.min(window.scrollY, 300);
    header.style.setProperty('--ambient-opacity', (scrolled / 300).toFixed(2));
    header.style.backdropFilter = `blur(${12 + scrolled / 50}px)`;
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

// Panels respond to pointer position.
const panels = Array.from(doc.querySelectorAll('[data-panel]'));
if (panels.length) {
  panels.forEach((panel) => {
    panel.addEventListener('pointermove', (event) => {
      const rect = panel.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      panel.style.transform = `translateY(${y * -6}px) rotate3d(${y.toFixed(2)}, ${-x.toFixed(2)}, 0, 6deg)`;
    });
    panel.addEventListener('pointerleave', () => {
      panel.style.transform = '';
    });
  });
}

// Simulate marquee drift on community notes.
const marquee = doc.querySelector('[data-marquee]');
if (marquee) {
  let offset = 0;
  const drift = () => {
    offset = (offset + 0.1) % marquee.scrollWidth;
    marquee.style.transform = `translateX(${Math.sin(Date.now() / 8000) * 10}px)`;
    requestAnimationFrame(drift);
  };
  drift();
}

// Corridor parallax
const corridor = doc.querySelector('.corridor');
if (corridor) {
  corridor.addEventListener('pointermove', (event) => {
    const rect = corridor.getBoundingClientRect();
    const progress = (event.clientX - rect.left) / rect.width;
    corridor.scrollLeft = progress * (corridor.scrollWidth - rect.width);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .catch((error) => console.error('Service worker registration failed', error));
  });
}
