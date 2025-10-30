(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  });

  ready(()=>{
    setupDirectorySearch();
    setupCommunityPanel();
  });

  function setupDirectorySearch(){
    const search = document.querySelector('[data-community-search]');
    const cards = Array.from(document.querySelectorAll('[data-community-entry]'));
    const emptyMsg = document.querySelector('[data-community-empty]');
    if(!search || !cards.length) return;

    const filter = ()=>{
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach((card)=>{
        const text = card.textContent?.toLowerCase() || '';
        const show = !query || text.includes(query);
        card.toggleAttribute('hidden', !show);
        card.style.display = show ? '' : 'none';
        if(show) visible += 1;
      });
      if(emptyMsg){
        emptyMsg.toggleAttribute('hidden', visible !== 0);
      }
    };

    search.addEventListener('input', filter);
    filter();
  }

  function setupCommunityPanel(){
    const panel = document.querySelector('[data-community-panel]');
    if(!panel) return;
    const triggers = document.querySelectorAll('[data-find-community]');
    const closeBtn = panel.querySelector('[data-community-panel-close]');
    const logoutBtn = panel.querySelector('[data-community-logout]');
    const searchInput = panel.querySelector('[data-community-search]');

    const isLoggedIn = ()=> window.Yuck?.isLoggedIn?.() === true;

    const hidePanel = ({ persist } = {})=>{
      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
      if(persist) panel.dataset.forcedHidden = 'true';
      else delete panel.dataset.forcedHidden;
    };

    const focusSearch = ()=>{
      if(!searchInput) return;
      requestAnimationFrame(()=> searchInput.focus({ preventScroll: true }));
    };

    const showPanel = ()=>{
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      panel.dataset.forcedHidden = 'false';
      focusSearch();
    };

    const handleAuthChange = ({ detail } = {})=>{
      const loggedIn = detail?.loggedIn ?? isLoggedIn();
      if(!loggedIn){
        hidePanel({ persist: true });
        delete panel.dataset.openOnLogin;
        return;
      }
      const shouldOpen = panel.dataset.openOnLogin === '1';
      if(shouldOpen){
        delete panel.dataset.openOnLogin;
        showPanel();
        return;
      }
      const forcedHidden = panel.dataset.forcedHidden === 'true';
      if(forcedHidden){
        hidePanel({ persist: true });
      }else{
        showPanel();
      }
    };

    triggers.forEach((trigger)=>{
      trigger.addEventListener('click', ()=>{
        if(isLoggedIn()){
          showPanel();
          return;
        }
        panel.dataset.openOnLogin = '1';
        window.Yuck?.accountModal?.open?.('login') ?? window.Yuck?.openModal?.('accountModal');
      });
    });

    closeBtn?.addEventListener('click', ()=>{
      hidePanel({ persist: true });
    });

    logoutBtn?.addEventListener('click', ()=>{
      window.Yuck?.setLoggedIn?.(false);
      hidePanel({ persist: true });
    });

    document.addEventListener('yuck:auth-change', handleAuthChange);

    // initialise visibility
    hidePanel({ persist: true });
    handleAuthChange({ detail: { loggedIn: isLoggedIn() } });
  }
})();
