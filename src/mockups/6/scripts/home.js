(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  });

  ready(()=>{
    initSceneSwitchers();
  });

  function initSceneSwitchers(){
    const switchers = document.querySelectorAll('[data-scene-switcher]');
    switchers.forEach((switcher)=>{
      const buttons = switcher.querySelectorAll('.scene-btn');
      const panels = switcher.querySelectorAll('[data-scene-panel]');
      let autoIndex = Array.from(buttons).findIndex((btn)=> btn.classList.contains('is-active'));
      if(autoIndex < 0) autoIndex = 0;

      buttons.forEach((btn, index)=>{
        btn.addEventListener('click', ()=>{
          if(btn.classList.contains('is-active')) return;
          activateScene(index);
        });
      });

      function activateScene(targetIndex){
        buttons.forEach((button, idx)=>{
          const isActive = idx === targetIndex;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        panels.forEach((panel, idx)=>{
          const isActive = idx === targetIndex;
          panel.classList.toggle('is-active', isActive);
          panel.toggleAttribute('hidden', !isActive);
        });
        autoIndex = targetIndex;
      }

      const interval = switcher.dataset.sceneInterval ? Number(switcher.dataset.sceneInterval) : 0;
      if(interval > 0){
        setInterval(()=>{
          autoIndex = (autoIndex + 1) % buttons.length;
          activateScene(autoIndex);
        }, interval);
      }
    });
  }
})();
