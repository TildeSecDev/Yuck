(function(){
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

  ready(()=>{
    registerServiceWorker();
    setupNavigation();
    setupReveal();
    setupModals();
    setupForms();
    setupCart();
    markActiveNav();
    updateYear();
  });

  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
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
      trigger.addEventListener('click', (event)=>{
        event.preventDefault();
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

  function setupCart(){
    // Lightweight cart state persisted in localStorage for the mock demo
    const storageKey = 'yuck-cart';
    const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
    const loadCart = ()=>{
      try{
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : [];
      }catch(_error){
        return [];
      }
    };
    let cart = loadCart();

  const cartBody = document.querySelector('[data-cart-body]');
  const cartTotal = document.querySelector('[data-cart-total]');
  const cartCounts = document.querySelectorAll('[data-cart-count]');
  const checkoutButton = document.querySelector('[data-cart-checkout]');
  const cartToggle = document.querySelector('[data-cart-toggle]');

    const formatCurrency = (value)=> currency.format(value);

    const persist = ()=>{
      try{
        localStorage.setItem(storageKey, JSON.stringify(cart));
      }catch(_error){
        /* ignore storage failures in demo */
      }
    };

    const render = ()=>{
      const total = cart.reduce((sum, item)=> sum + item.price * item.qty, 0);
      const count = cart.reduce((sum, item)=> sum + item.qty, 0);

      if(cartTotal) cartTotal.textContent = formatCurrency(total);
      cartCounts.forEach((el)=>{
        el.textContent = String(count);
        el.toggleAttribute('data-empty', count === 0);
      });

      if(!cartBody) return;

      if(!cart.length){
        cartBody.innerHTML = '<div class="cart-empty">Your cart is currently empty. Explore the lineup to add something great.</div>';
        return;
      }

      cartBody.innerHTML = cart.map((item)=>`
        <article class="cart-item" data-product-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" />
          <div class="cart-item-details">
            <strong>${item.name}</strong>
            <p class="cart-item-meta">${formatCurrency(item.price)} • Qty ${item.qty}</p>
            <p class="cart-item-meta">${item.description}</p>
          </div>
          <button class="cart-item-remove" type="button" data-cart-remove="${item.id}">Remove</button>
        </article>
      `).join('');
    };

    const addToCart = (product)=>{
      if(!product?.id) return;
      const existing = cart.find((item)=> item.id === product.id);
      if(existing){
        existing.qty += product.qty || 1;
      }else{
        cart.push(Object.assign({ qty: 1 }, product));
      }
      persist();
      render();
    };

    const removeFromCart = (id)=>{
      cart = cart.filter((item)=> item.id !== id);
      persist();
      render();
    };

    cartBody?.addEventListener('click', (event)=>{
      const target = event.target;
      if(!(target instanceof HTMLElement)) return;
      const id = target.getAttribute('data-cart-remove');
      if(!id) return;
      removeFromCart(id);
    });

    if(checkoutButton){
      checkoutButton.addEventListener('click', ()=>{
        alert('In a production build this would take you to a secure checkout.');
      });
    }

    document.querySelectorAll('.js-add-to-cart').forEach((button)=>{
      button.addEventListener('click', (event)=>{
        event.preventDefault();
        const dataset = button.dataset;
        const product = {
          id: dataset.productId || dataset.productName || button.textContent?.trim() || String(Date.now()),
          name: dataset.productName || button.getAttribute('aria-label') || 'Yuck product',
          price: Number(dataset.productPrice || 0),
          image: dataset.productImage || '../../assets/images/Trolley/default.png',
          description: dataset.productDescription || 'Limited release blend straight from the lab.',
          qty: Number(dataset.productQty || 1)
        };
        addToCart(product);
        openModal('cartModal', cartToggle || button);
      });
    });

    cartToggle?.addEventListener('click', (event)=>{
      event.preventDefault();
      render();
      openModal('cartModal', cartToggle);
    });

    render();
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
