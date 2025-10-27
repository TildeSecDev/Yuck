(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  });

  ready(()=>{
    setupDirectorySearch();
  });

  function setupDirectorySearch(){
    const search = document.querySelector('[data-community-search]');
    const cards = Array.from(document.querySelectorAll('[data-community-entry]'));
    if(!search || !cards.length) return;
    search.addEventListener('input', ()=>{
      const query = search.value.trim().toLowerCase();
      cards.forEach((card)=>{
        const text = card.textContent?.toLowerCase() || '';
        const show = !query || text.includes(query);
        card.toggleAttribute('hidden', !show);
        card.style.display = show ? '' : 'none';
      });
    });
  }
})();
