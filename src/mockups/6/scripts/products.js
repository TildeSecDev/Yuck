(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  });

  let catalogCards = [];

  ready(()=>{
    initProductTilt('.product-card');
    setupCatalogAccordion();
    setupProductFilters();
  });

  function initProductTilt(selector){
    const cards = document.querySelectorAll(selector);
    cards.forEach((card)=>{
      const reset = ()=>{
        card.style.setProperty('--tiltX', '0deg');
        card.style.setProperty('--tiltY', '0deg');
        card.style.setProperty('--lift', '0px');
      };
      card.addEventListener('pointermove', (event)=>{
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * -10;
        card.style.setProperty('--tiltX', `${x}deg`);
        card.style.setProperty('--tiltY', `${y}deg`);
        card.style.setProperty('--lift', '-12px');
      });
      card.addEventListener('pointerleave', reset);
      card.addEventListener('pointerup', reset);
      reset();
    });
  }

  function setupProductFilters(){
    const controls = document.querySelector('[data-product-filter]');
    if(!controls) return;
    const buttons = controls.querySelectorAll('button[data-filter]');
    const cards = Array.from(document.querySelectorAll('[data-product-category]'));
    if(!buttons.length || !cards.length) return;

    buttons.forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const value = btn.getAttribute('data-filter');
        buttons.forEach((b)=> b.classList.toggle('is-active', b === btn));
        cards.forEach((card)=>{
          const categories = (card.getAttribute('data-product-category') || '')
            .split(',')
            .map((item)=> item.trim())
            .filter(Boolean);
          const show = value === 'all' || categories.includes(value);
          if(!show){
            setCatalogCardExpanded(card, false);
          }
          card.toggleAttribute('hidden', !show);
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  function setupCatalogAccordion(){
    catalogCards = Array.from(document.querySelectorAll('.catalog-card'));
    if(!catalogCards.length) return;

    catalogCards.forEach((card)=>{
      const details = card.querySelector('.catalog-card__details');
      if(!details) return;

      const expanded = card.dataset.expanded === 'true';
      card.dataset.expanded = expanded ? 'true' : 'false';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      details.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      setCatalogCardExpanded(card, expanded, { immediate: true });

      card.addEventListener('click', handleCatalogCardClick);
      card.addEventListener('keydown', handleCatalogCardKey);
    });

    window.addEventListener('resize', handleResize);
  }

  function handleCatalogCardClick(event){
    if(event.target.closest('.js-add-to-cart')) return;
    toggleCatalogCard(event.currentTarget);
  }

  function handleCatalogCardKey(event){
    if(event.target.closest('.js-add-to-cart')) return;
    if(event.key === 'Enter' || event.key === ' '){
      event.preventDefault();
      toggleCatalogCard(event.currentTarget);
    }
  }

  function toggleCatalogCard(card){
    const willExpand = card.dataset.expanded !== 'true';
    catalogCards.forEach((node)=>{
      if(node !== card){
        setCatalogCardExpanded(node, false);
      }
    });
    setCatalogCardExpanded(card, willExpand);
  }

  function setCatalogCardExpanded(card, state, options = {}){
    const { immediate = false } = options;
    const expanded = Boolean(state);
    const details = card.querySelector('.catalog-card__details');
    if(!details) return;

    const currentState = card.dataset.expanded === 'true';
    if(!immediate && currentState === expanded){
      if(expanded){
        details.style.maxHeight = `${details.scrollHeight}px`;
      }
      return;
    }

    card.dataset.expanded = expanded ? 'true' : 'false';
    card.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    details.setAttribute('aria-hidden', expanded ? 'false' : 'true');

    const contentHeight = `${details.scrollHeight}px`;
    if(immediate){
      details.style.maxHeight = expanded ? contentHeight : '0px';
    }else{
      details.style.maxHeight = expanded ? '0px' : contentHeight;
      requestAnimationFrame(()=>{
        details.style.maxHeight = expanded ? contentHeight : '0px';
      });
    }

    details.style.opacity = expanded ? '1' : '0';
    details.style.marginTop = expanded ? '0.75rem' : '0';
  }

  function handleResize(){
    const expandedCard = catalogCards.find((card)=> card.dataset.expanded === 'true');
    if(!expandedCard) return;
    const details = expandedCard.querySelector('.catalog-card__details');
    if(!details) return;
    details.style.maxHeight = `${details.scrollHeight}px`;
  }
})();
