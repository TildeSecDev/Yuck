(function(){
  const ready = window.Yuck?.ready || ((fn)=>{
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  });
  const closeModal = window.Yuck?.closeModal;
  const emailPattern = window.Yuck?.emailPattern || /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  ready(setupAccountModal);

  function setupAccountModal(){
    const modal = document.getElementById('accountModal');
    if(!modal) return;
    const tabs = Array.from(modal.querySelectorAll('[data-account-tab]'));
    const views = Array.from(modal.querySelectorAll('[data-account-view]'));
    const statusEl = modal.querySelector('#accountStatus');
    const errorEl = modal.querySelector('#accountError');
    const loginForm = modal.querySelector('[data-account-form="login"]');
    const signupForm = modal.querySelector('[data-account-form="signup"]');
    const triggers = document.querySelectorAll('[data-modal-open="accountModal"]');

    let activeTab = 'login';

    function setStatus(message){
      if(statusEl) statusEl.textContent = message || '';
    }

    function setError(message){
      if(!errorEl) return;
      if(message){
        errorEl.hidden = false;
        errorEl.textContent = message;
      }else{
        errorEl.hidden = true;
        errorEl.textContent = '';
      }
    }

    function clearFeedback(){
      setStatus('');
      setError('');
    }

    function setActiveTab(mode){
      activeTab = mode;
      tabs.forEach((tab)=>{
        const isActive = tab.getAttribute('data-account-tab') === mode;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      views.forEach((view)=>{
        const isActive = view.getAttribute('data-account-view') === mode;
        view.toggleAttribute('hidden', !isActive);
        if(isActive){
          view.setAttribute('tabindex', '0');
        }else{
          view.removeAttribute('tabindex');
        }
      });
      return mode;
    }

    function focusFirstField(mode){
      const view = modal.querySelector(`[data-account-view="${mode}"]`);
      const field = view?.querySelector('input[name="email"], input[name="password"]');
      if(field){
        setTimeout(()=> field.focus({ preventScroll: true }), 80);
      }
    }

    function reset(){
      setActiveTab('login');
      loginForm?.reset();
      signupForm?.reset();
      clearFeedback();
      setBusy(false);
      focusFirstField('login');
    }

    function setBusy(state){
      if(state) modal.setAttribute('data-busy', '1');
      else modal.removeAttribute('data-busy');
    }

    tabs.forEach((tab)=>{
      tab.addEventListener('click', ()=>{
        const mode = tab.getAttribute('data-account-tab') || 'login';
        setActiveTab(mode);
        clearFeedback();
        focusFirstField(mode);
      });
    });

    triggers.forEach((trigger)=>{
      trigger.addEventListener('click', ()=>{
        requestAnimationFrame(()=>{
          reset();
        });
      });
    });

    async function handleSubmit(event, mode){
      event.preventDefault();
      clearFeedback();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '').trim();
      const hp = String(formData.get('website') || '').trim();
      if(hp) return;
      if(!emailPattern.test(email)){
        setError('Enter a valid email address.');
        form.querySelector('input[name="email"]').focus();
        return;
      }
      if(!password){
        setError('Add your password to continue.');
        form.querySelector('input[name="password"]').focus();
        return;
      }
      if(mode === 'signup' && password.length < 8){
        setError('Password must be at least 8 characters.');
        form.querySelector('input[name="password"]').focus();
        return;
      }

  setBusy(true);
  setStatus('Processing...');
      try{
        const response = await fetch(`/api/auth/${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        const payload = await response.json().catch(()=> ({}));
        if(response.ok){
          setError('');
          setStatus(mode === 'signup' ? 'Account created. Welcome aboard!' : 'Signed in. Welcome back!');
          if(mode === 'signup'){
            await notifyFormSubmit({ email, mode, fallback: false });
          }
          form.reset();
          setTimeout(()=>{
            closeModal?.(modal);
            reset();
          }, 1600);
          return;
        }
        if(response.status === 409){
          setStatus('');
          setError('That email already has an account. Try logging in.');
          return;
        }
        if(response.status === 401){
          setStatus('');
          setError('We could not find that email and password combo.');
          return;
        }
        if(response.status === 400){
          setStatus('');
          setError(formatValidationError(payload?.error));
          return;
        }
  await notifyFormSubmit({ email, mode, fallback: true });
  setError('');
  setStatus('We captured your request via FormSubmit. We will follow up shortly.');
      }catch(err){
        console.error('Account request failed', err);
        await notifyFormSubmit({ email, mode, fallback: true });
        setStatus('We captured your request via FormSubmit. We will follow up shortly.');
        setError('');
      }finally{
        setBusy(false);
      }
    }

    loginForm?.addEventListener('submit', (event)=> handleSubmit(event, 'login'));
    signupForm?.addEventListener('submit', (event)=> handleSubmit(event, 'signup'));

    window.Yuck = Object.assign({}, window.Yuck, {
      accountModal: {
        open(mode = 'login'){
          window.Yuck?.openModal?.('accountModal');
          requestAnimationFrame(()=>{
            setActiveTab(mode);
            focusFirstField(mode);
          });
        }
      }
    });
  }

  function formatValidationError(code){
    switch(code){
      case 'invalid_email':
        return 'Enter a valid email address.';
      case 'weak_password':
        return 'Password must be at least 8 characters.';
      case 'missing_fields':
        return 'Add your email and password to continue.';
      default:
        return typeof code === 'string' ? code : 'Something went wrong. Try again shortly.';
    }
  }

  async function notifyFormSubmit({ email, mode, fallback }){
    if(!email) return;
    try{
      const formData = new FormData();
      formData.set('email', email);
      formData.set('mode', mode);
      formData.set('source', 'mockup-6-account-overlay');
      formData.set('backend_status', fallback ? 'fallback' : 'ok');
      formData.set('_subject', `Yuck ${mode} request (${fallback ? 'fallback' : 'ok'})`);
      formData.set('message', fallback ? 'Backend call failed; captured via FormSubmit.' : 'Backend handled request successfully.');
      await fetch('https://formsubmit.co/ajax/hello@yuck.example', {
        method: 'POST',
        body: formData
      });
    }catch(err){
      console.warn('FormSubmit notification failed', err);
    }
  }
})();
