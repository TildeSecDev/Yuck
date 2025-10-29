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
      const panelsWrap = switcher.querySelector('.scene-panels');
      let autoIndex = Array.from(buttons).findIndex((btn)=> btn.classList.contains('is-active'));
      if(autoIndex < 0) autoIndex = 0;
      let activeIndex = autoIndex;

      panels.forEach((panel, idx)=>{
        panel.removeAttribute('hidden');
        const isActive = idx === activeIndex;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });

      updatePanelsHeight();
    window.addEventListener('resize', updatePanelsHeight);

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
          panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });
        autoIndex = targetIndex;
        activeIndex = targetIndex;
        updatePanelsHeight();
      }

      const interval = switcher.dataset.sceneInterval ? Number(switcher.dataset.sceneInterval) : 0;
      if(interval > 0){
        setInterval(()=>{
          autoIndex = (autoIndex + 1) % buttons.length;
          activateScene(autoIndex);
        }, interval);
      }

      function updatePanelsHeight(){
        if(!panelsWrap) return;
        const current = panels[activeIndex];
        if(!current) return;
        requestAnimationFrame(()=>{
          panelsWrap.style.height = `${current.offsetHeight}px`;
        });
      }
    });
  }
})();
