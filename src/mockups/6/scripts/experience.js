(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  });

  ready(()=>{
    initSteppers();
  });

  function initSteppers(){
    const steppers = document.querySelectorAll('[data-stepper]');
    steppers.forEach((stepper)=>{
      const buttons = stepper.querySelectorAll('.step-btn');
      const panels = stepper.querySelectorAll('[data-step-panel]');
      buttons.forEach((btn)=>{
        btn.addEventListener('click', ()=>{
          if(btn.classList.contains('is-active')) return;
          const step = btn.getAttribute('data-step');
          buttons.forEach((b)=>{
            const isActive = b === btn;
            b.classList.toggle('is-active', isActive);
            b.setAttribute('aria-selected', isActive ? 'true' : 'false');
          });
          panels.forEach((panel)=>{
            const match = panel.getAttribute('data-step-panel') === step;
            panel.classList.toggle('is-active', match);
            panel.toggleAttribute('hidden', !match);
          });
        });
      });
    });
  }
})();
