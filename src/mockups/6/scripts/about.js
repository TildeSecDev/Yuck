(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  });

  ready(()=>{
    highlightTimeline();
  });

  function highlightTimeline(){
    const items = document.querySelectorAll('.timeline li');
    if(!items.length) return;
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        entry.target.classList.toggle('is-active', entry.isIntersecting);
      });
    }, { threshold: 0.6 });
    items.forEach((item)=> observer.observe(item));
  }
})();
