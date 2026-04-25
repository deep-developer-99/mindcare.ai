(function(){
  'use strict';

  const form = document.getElementById('loginForm');
  const identifier = document.getElementById('identifier');
  const password = document.getElementById('password');
  const idErr = document.getElementById('identifierError');
  const pwErr = document.getElementById('passwordError');
  const toggle = document.getElementById('togglePassword');
  const submitBtn = document.getElementById('submitBtn');

  // Utility: email and mobile validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  // Accepts formats: 0712345678, 234701234567, +234701234567, +1 555 123 4567, etc.
  const phoneRegex = /^(?:\+?\d[\d\s-]{7,}\d)$/;

  function isValidIdentifier(value){
    const v = value.trim();
    if(!v) return false;
    return emailRegex.test(v) || phoneRegex.test(v);
  }

  function setFieldError(input, errorEl, message){
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
  }

  function clearFieldError(input, errorEl){
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
  }

  function validate(){
    let valid = true;

    if(!isValidIdentifier(identifier.value)){
      setFieldError(identifier, idErr, 'Enter a valid mobile number or email');
      valid = false;
    } else {
      clearFieldError(identifier, idErr);
    }

    if(!password.value.trim()){
      setFieldError(password, pwErr, 'Password is required');
      valid = false;
    } else {
      clearFieldError(password, pwErr);
    }

    return valid;
  }

  // Toggle password visibility
  toggle.addEventListener('click', function(){
    const showing = password.getAttribute('type') === 'text';
    password.setAttribute('type', showing ? 'password' : 'text');
    toggle.setAttribute('aria-pressed', String(!showing));
    toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
  });

  identifier.addEventListener('input', () => {
    if(identifier.value && isValidIdentifier(identifier.value)){
      clearFieldError(identifier, idErr);
    }
  });

  password.addEventListener('input', () => {
    if(password.value){
      clearFieldError(password, pwErr);
    }
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    submitBtn.disabled = true;

    const ok = validate();
    if(!ok){
      submitBtn.disabled = false;
      return;
    }

    // Simulate async login call
    setTimeout(() => {
      alert('Login successful (demo)\nIdentifier: ' + identifier.value + '\nRemember: ' + document.getElementById('remember').checked);
      submitBtn.disabled = false;
      // In real app, send to backend and navigate
      // window.location.href = '/dashboard';
    }, 600);
  });
})();
