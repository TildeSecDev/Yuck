(function(){
  const installState = { deferredPrompt: null };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const openModals = new Set();
  const focusableSelector = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

  function ready(fn){
    if(document.readyState !== 'loading'){
      fn();
    }else{
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }
  }

  window.addEventListener('beforeinstallprompt', (event)=>{
    event.preventDefault();
    installState.deferredPrompt = event;
    enableInstallButton();
  });

  ready(()=>{
    registerServiceWorker();
    setupInstallButton();
    setupNavigation();
    setupReveal();
    setupModals();
    setupForms();
    setupBuyForm();
    markActiveNav();
    updateYear();
  });

  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
    });
  }

  function enableInstallButton(){
    const btn = document.getElementById('installBtn');
    if(!btn) return;
    const hasPrompt = Boolean(installState.deferredPrompt);
    btn.disabled = !hasPrompt;
    btn.classList.toggle('ready', hasPrompt);
  }

  function setupInstallButton(){
    const btn = document.getElementById('installBtn');
    if(!btn) return;
    enableInstallButton();
    btn.addEventListener('click', async ()=>{
      if(!installState.deferredPrompt) return;
      installState.deferredPrompt.prompt();
      await installState.deferredPrompt.userChoice.catch(()=>{});
      installState.deferredPrompt = null;
      btn.disabled = true;
      btn.classList.remove('ready');
      btn.textContent = 'Installed';
    });
  }

  function setupNavigation(){
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('primaryNav');
    if(toggle){
      toggle.addEventListener('click', ()=>{
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        nav?.classList.toggle('is-open', !expanded);
      });
    }
    nav?.querySelectorAll('a').forEach((link)=>{
      link.addEventListener('click', ()=>{
        if(!nav.classList.contains('is-open')) return;
        nav.classList.remove('is-open');
        toggle?.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function markActiveNav(){
    const page = document.body?.dataset?.page;
    if(!page) return;
    document.querySelectorAll('[data-nav]').forEach((link)=>{
      const isCurrent = link.getAttribute('data-nav') === page;
      if(isCurrent){
        link.setAttribute('aria-current', 'page');
      }else{
        link.removeAttribute('aria-current');
      }
      link.classList.toggle('is-active', isCurrent);
    });
  }

  function setupReveal(){
    const items = document.querySelectorAll('.reveal');
    if(!items.length) return;
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    items.forEach((item)=> observer.observe(item));
  }

  function setupModals(){
    document.querySelectorAll('[data-modal-open]').forEach((trigger)=>{
      trigger.addEventListener('click', ()=>{
        const id = trigger.getAttribute('data-modal-open');
        if(!id) return;
        openModal(id, trigger);
      });
    });

    document.querySelectorAll('[data-modal-close]').forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const modal = btn.closest('.modal');
        if(modal) closeModal(modal);
      });
    });

    document.querySelectorAll('.modal').forEach((modal)=>{
      modal.addEventListener('click', (event)=>{
        if(event.target.classList.contains('modal-backdrop')){
          closeModal(modal);
        }
      });
    });
  }

  function focusTrap(modal){
    const focusable = Array.from(modal.querySelectorAll(focusableSelector)).filter((el)=> !el.hasAttribute('disabled'));
    if(!focusable.length) return;
    const [first, last] = [focusable[0], focusable[focusable.length - 1]];
    const handleKeydown = (event)=>{
      if(event.key === 'Tab'){
        if(event.shiftKey && document.activeElement === first){
          event.preventDefault();
          last.focus();
        }else if(!event.shiftKey && document.activeElement === last){
          event.preventDefault();
          first.focus();
        }
      }else if(event.key === 'Escape'){
        event.preventDefault();
        closeModal(modal);
      }
    };
    modal.addEventListener('keydown', handleKeydown);
    modal.__trapHandler = handleKeydown;
    first.focus();
  }

  function releaseTrap(modal){
    if(!modal.__trapHandler) return;
    modal.removeEventListener('keydown', modal.__trapHandler);
    delete modal.__trapHandler;
  }

  function lockScroll(){
    document.documentElement.style.overflow = openModals.size ? 'hidden' : '';
  }

  function openModal(idOrEl, trigger){
    const modal = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if(!modal || openModals.has(modal)) return;
    modal.hidden = false;
    openModals.add(modal);
    lockScroll();

    if(trigger?.dataset.product){
      const select = modal.querySelector('#buyProduct');
      if(select){
        const match = Array.from(select.options).find((option)=> option.value === trigger.dataset.product);
        if(match){
          select.value = match.value;
          select.dispatchEvent(new Event('change'));
        }
      }
    }

    focusTrap(modal);
  }

  function closeModal(modal){
    if(!openModals.has(modal)) return;
    modal.hidden = true;
    releaseTrap(modal);
    openModals.delete(modal);
    lockScroll();
  }

  function setupForms(){
    handleSimpleForm('#newsletterForm', '#newsletterMsg', 'Subscribed!');
    handleSimpleForm('#joinModalForm', '#joinModalMsg', 'Invite requested.');
    handleSimpleForm('#supportModalForm', '#supportModalMsg', 'Message received. We will reply soon.');

    const joinForm = document.getElementById('joinForm');
    if(joinForm){
      joinForm.addEventListener('submit', (event)=>{
        event.preventDefault();
        const data = new FormData(joinForm);
        if(data.get('website')) return;
        const email = String(data.get('email') || '').trim();
        const msg = document.getElementById('joinMsg');
        if(!emailPattern.test(email)){
          if(msg){
            msg.textContent = 'Enter a valid email.';
            msg.style.color = '#c05746';
          }
          return;
        }
        if(msg){
          msg.textContent = 'Invite requested. Check your inbox for a secure link.';
          msg.style.color = '#2f6f4e';
        }
        joinForm.reset();
      });
    }

    const supportForm = document.getElementById('supportForm');
    if(supportForm){
      supportForm.addEventListener('submit', (event)=>{
        event.preventDefault();
        const email = String(supportForm.elements.email.value || '').trim();
        const msg = document.getElementById('supportMsg');
        if(!emailPattern.test(email)){
          if(msg){
            msg.textContent = 'Please enter a valid email.';
            msg.style.color = '#c05746';
          }
          return;
        }
        if(msg){
          msg.textContent = 'Thanks! We will reply within 24 hours.';
          msg.style.color = '#2f6f4e';
        }
        supportForm.reset();
      });
    }
  }

  function handleSimpleForm(formSelector, messageSelector, successText){
    const form = typeof formSelector === 'string' ? document.querySelector(formSelector) : formSelector;
    if(!form) return;
    const messageEl = typeof messageSelector === 'string' ? document.querySelector(messageSelector) : messageSelector;
    form.addEventListener('submit', (event)=>{
      event.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput?.value.trim() || '';
      if(emailInput && !emailPattern.test(email)){
        if(messageEl){
          messageEl.textContent = 'Please enter a valid email.';
          messageEl.style.color = '#c05746';
        }
        emailInput.focus();
        return;
      }
      if(messageEl){
        messageEl.textContent = successText;
        messageEl.style.color = '#2f6f4e';
      }
      form.reset();
    });
  }

  function setupBuyForm(){
    const form = document.getElementById('buyForm');
    if(!form) return;
    const productSelect = document.getElementById('buyProduct');
    const qtyInput = document.getElementById('buyQty');
    const totalEl = document.getElementById('buyTotal');
    const msg = document.getElementById('buyMsg');

    const computeTotal = ()=>{
      const option = productSelect?.selectedOptions[0];
      const base = option ? Number(option.dataset.price) : 0;
      const qty = qtyInput ? Math.max(1, Number(qtyInput.value) || 1) : 1;
      const total = base * qty;
      if(qtyInput) qtyInput.value = String(qty);
      if(totalEl) totalEl.textContent = `£${total.toFixed(2)}`;
    };

    productSelect?.addEventListener('change', computeTotal);
    qtyInput?.addEventListener('change', computeTotal);
    form.querySelectorAll('.qty-btn').forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        if(!qtyInput) return;
        const delta = Number(btn.dataset.qty) || 0;
        const next = Math.max(1, Number(qtyInput.value) + delta || 1);
        qtyInput.value = String(next);
        computeTotal();
      });
    });

    form.addEventListener('submit', (event)=>{
      event.preventDefault();
      computeTotal();
      if(msg){
        msg.textContent = 'Added to cart (demo).';
        msg.style.color = '#2f6f4e';
      }
    });

    computeTotal();
  }

  function updateYear(){
    const slot = document.getElementById('year');
    if(slot) slot.textContent = String(new Date().getFullYear());
  }

  // expose helpful utilities for page-level scripts
  window.Yuck = Object.assign(window.Yuck || {}, {
    ready,
    openModal,
    closeModal,
    emailPattern
  });
})();
