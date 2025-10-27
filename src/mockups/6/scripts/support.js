(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  });

  ready(()=>{
    setupContactToggles();
  });

  function setupContactToggles(){
    document.querySelectorAll('[data-support-toggle]').forEach((toggle)=>{
      toggle.addEventListener('click', ()=>{
        const targetId = toggle.getAttribute('data-support-toggle');
        if(!targetId) return;
        const target = document.getElementById(targetId);
        if(!target) return;
        const isHidden = target.hasAttribute('hidden');
        document.querySelectorAll('[data-support-panel]').forEach((panel)=>{
          panel.hidden = true;
        });
        target.hidden = !isHidden ? true : false;
        if(isHidden) target.hidden = false;
        document.querySelectorAll('[data-support-toggle]').forEach((btn)=>{
          btn.classList.toggle('is-active', btn === toggle && isHidden);
        });
      });
    });
  }
})();
