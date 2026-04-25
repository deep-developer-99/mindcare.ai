(async function(){
  const form = document.getElementById('createAccountForm');
  const mentalRadios = document.querySelectorAll('input[name="mental"]');
  const mentalDetails = document.getElementById('mentalDetails');
  const message = document.getElementById('message');
  const API_BASE = CONFIG ? CONFIG.getApiBase() : (window.location.protocol === 'file:' ? 'http://localhost:5002' : '');
  const AUTH_BASE = `${API_BASE}/api/auth`;

  function toggleDetails(){
    const selected = document.querySelector('input[name="mental"]:checked').value;
    mentalDetails.hidden = selected !== 'yes';
  }
  mentalRadios.forEach(r => r.addEventListener('change', toggleDetails));
  toggleDetails();

  // Password visibility toggles
  document.querySelectorAll('.toggle-visibility').forEach(btn => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;
    btn.addEventListener('click', () => {
      const shown = input.type === 'text';
      input.type = shown ? 'password' : 'text';
      btn.textContent = shown ? 'Show' : 'Hide';
      btn.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
    });
  });

  // Flatpickr init for DOB (prevents future dates)
  if(window.flatpickr){
    flatpickr(document.getElementById('dob'), {
      dateFormat: 'Y-m-d',
      maxDate: 'today',
      allowInput: true
    });
  }

  // helper: hash password with SHA-256 and return hex string
  async function hashPassword(password){
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // helper: load users array from localStorage safely
  function loadUsers(){
    try {
      const raw = localStorage.getItem('signupData');
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Could not parse signupData from localStorage, resetting to []', err);
      return [];
    }
  }

  // helper: save users array to localStorage
  function saveUsers(users){
    try {
      localStorage.setItem('signupData', JSON.stringify(users));
      return true;
    } catch (err) {
      console.warn('Failed to save users to localStorage:', err);
      return false;
    }
  }

  // lightweight unique id
  function makeId(){
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    message.textContent = '';

    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }

    const pwdEl = document.getElementById('password');
    const confirmEl = document.getElementById('confirmPassword');
    if(pwdEl && pwdEl.value.length < 8){
      message.style.color = '#b00020';
      message.textContent = 'Password must be at least 8 characters.';
      pwdEl.focus();
      return;
    }
    if(pwdEl && confirmEl && pwdEl.value !== confirmEl.value){
      message.style.color = '#b00020';
      message.textContent = 'Passwords do not match.';
      confirmEl.focus();
      return;
    }

    const data = new FormData(form);
    const payload = {};
    for(const [k,v] of data.entries()) payload[k] = v;

    // minimal mobile validation
    const digits = (payload.mobile || '').replace(/\D/g, '');
    if(digits.length < 6){
      message.style.color = '#b00020';
      message.textContent = 'Please enter a valid mobile number.';
      return;
    }

    // Call Backend API instead of saving to localStorage
    try {
      const response = await fetch(`${AUTH_BASE}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        message.style.color = '#b00020';
        message.textContent = result.message || 'Registration failed.';
        return;
      }

      message.style.color = '#14532d';
      message.textContent = 'Account created successfully! You can now login.';
      
      // Optionally redirect to login page
      setTimeout(() => {
        window.location.href = '/auth/login-page/index.html';
      }, 2000);

    } catch (err) {
      console.error('API Error:', err);
      message.style.color = '#b00020';
      message.textContent = 'Server is not reachable. Please try again later.';
    }
  });

  // Expose helper for debugging (optional)
  window.signupHelpers = {
    loadUsers,
    saveUsers,
    clearAll: () => { localStorage.removeItem('signupData'); }
  };
})();
