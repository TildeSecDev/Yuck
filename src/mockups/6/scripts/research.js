(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  });

  ready(()=>{
    initAccordions();
  });

  function initAccordions(){
    document.querySelectorAll('[data-accordion]').forEach((accordion)=>{
      accordion.querySelectorAll('.accordion-head').forEach((head)=>{
        head.addEventListener('click', ()=>{
          const body = head.nextElementSibling;
          if(!body) return;
          const isHidden = body.hasAttribute('hidden');
          body.toggleAttribute('hidden', !isHidden);
          const caret = head.querySelector('.caret');
          if(caret){
            caret.textContent = isHidden ? '-' : '+';
          }
        });
      });
    });
  }
})();
