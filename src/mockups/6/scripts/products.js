(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  });

  ready(()=>{
    initProductTilt('.product-card');
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
          const categories = (card.getAttribute('data-product-category') || '').split(',');
          const show = value === 'all' || categories.includes(value);
          card.toggleAttribute('hidden', !show);
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }
})();
