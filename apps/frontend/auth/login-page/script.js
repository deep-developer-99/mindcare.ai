(function () {
  'use strict';

  const form = document.getElementById('loginForm');
  const identifier = document.getElementById('identifier');
  const password = document.getElementById('password');
  const idErr = document.getElementById('identifierError');
  const pwErr = document.getElementById('passwordError');
  const toggle = document.getElementById('togglePassword');
  const submitBtn = document.getElementById('submitBtn');
  const rememberChk = document.getElementById('remember');

  const forgotLink = document.getElementById('forgotPasswordLink');
  const forgotModal = document.getElementById('forgotModal');
  const closeForgotModalBtn = document.getElementById('closeForgotModal');
  const forgotSteps = document.querySelectorAll('.forgot-step');
  const forgotStatus = document.getElementById('forgotStatus');
  const recoveryMethod = document.getElementById('recoveryMethod');
  const recoveryIdentifier = document.getElementById('recoveryIdentifier');
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const recoveryOtp = document.getElementById('recoveryOtp');
  const resetPasswordBtn = document.getElementById('resetPasswordBtn');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const resetNewPassword = document.getElementById('resetNewPassword');
  const resetConfirmPassword = document.getElementById('resetConfirmPassword');
  const devOtpHint = document.getElementById('devOtpHint');

  const API_BASE = CONFIG.getApiBase();
  const AUTH_BASE = `${API_BASE}/api/auth`;
  const FORGOT_REQUEST_ENDPOINT = `${AUTH_BASE}/forgot-password/request`;
  const FORGOT_VERIFY_ENDPOINT = `${AUTH_BASE}/forgot-password/verify`;
  const FORGOT_RESET_ENDPOINT = `${AUTH_BASE}/forgot-password/reset`;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const phoneRegex = /^(?:\+?\d[\d\s-]{7,}\d)$/;
  const forgotState = {
    channel: 'email',
    identifier: '',
    resetToken: ''
  };

  function isValidIdentifier(value) {
    const v = value.trim();
    if (!v) return false;
    return emailRegex.test(v) || phoneRegex.test(v);
  }

  function isValidRecoveryIdentifier(channel, value) {
    const v = value.trim();
    if (!v) return false;
    return channel === 'email' ? emailRegex.test(v) : phoneRegex.test(v);
  }

  function setFieldError(input, errorEl, message) {
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
  }

  function clearFieldError(input, errorEl) {
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
  }

  function validateLogin() {
    let valid = true;

    if (!isValidIdentifier(identifier.value)) {
      setFieldError(identifier, idErr, 'Enter a valid mobile number or email');
      valid = false;
    } else {
      clearFieldError(identifier, idErr);
    }

    if (!password.value.trim()) {
      setFieldError(password, pwErr, 'Password is required');
      valid = false;
    } else {
      clearFieldError(password, pwErr);
    }

    return valid;
  }

  async function parseApiResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    if (text.trim().startsWith('<!DOCTYPE')) {
      return { message: 'Unexpected HTML response from server. Please restart backend server.' };
    }
    return { message: text || 'Unexpected server response' };
  }

  function setForgotStatus(message, type) {
    if (!forgotStatus) return;
    forgotStatus.textContent = message || '';
    forgotStatus.classList.remove('error', 'success');
    if (type) forgotStatus.classList.add(type);
  }

  function setForgotStep(stepNumber) {
    forgotSteps.forEach((stepEl) => {
      const step = Number(stepEl.getAttribute('data-step'));
      stepEl.classList.toggle('hidden', step !== stepNumber);
    });
  }

  function updateRecoveryPlaceholder() {
    if (!recoveryMethod || !recoveryIdentifier) return;
    const channel = recoveryMethod.value === 'mobile' ? 'mobile' : 'email';
    recoveryIdentifier.placeholder = channel === 'email' ? 'you@example.com' : '+1 555 123 4567';
  }

  function openForgotModal() {
    if (!forgotModal) return;
    forgotModal.classList.remove('hidden');
    setForgotStep(1);
    setForgotStatus('');
    forgotState.channel = 'email';
    forgotState.identifier = '';
    forgotState.resetToken = '';
    if (recoveryMethod) recoveryMethod.value = 'email';
    if (recoveryIdentifier) recoveryIdentifier.value = '';
    if (recoveryOtp) recoveryOtp.value = '';
    if (resetNewPassword) resetNewPassword.value = '';
    if (resetConfirmPassword) resetConfirmPassword.value = '';
    if (devOtpHint) {
      devOtpHint.textContent = '';
      devOtpHint.classList.add('hidden');
    }
    updateRecoveryPlaceholder();
  }

  function closeForgotModal() {
    if (!forgotModal) return;
    forgotModal.classList.add('hidden');
  }

  async function requestOtp() {
    if (!recoveryMethod || !recoveryIdentifier) return;

    const channel = recoveryMethod.value === 'mobile' ? 'mobile' : 'email';
    const identifierValue = recoveryIdentifier.value.trim();

    if (!isValidRecoveryIdentifier(channel, identifierValue)) {
      setForgotStatus(`Enter a valid ${channel === 'email' ? 'email address' : 'mobile number'}.`, 'error');
      return;
    }

    const activeBtn = sendOtpBtn && !sendOtpBtn.classList.contains('hidden') ? sendOtpBtn : resendOtpBtn;
    if (activeBtn) activeBtn.disabled = true;
    setForgotStatus('Sending OTP...');

    try {
      const response = await fetch(FORGOT_REQUEST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('mindcare_token') || '') },
        body: JSON.stringify({
          channel,
          identifier: identifierValue
        })
      });

      const result = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send OTP.');
      }

      forgotState.channel = channel;
      forgotState.identifier = identifierValue;
      forgotState.resetToken = '';
      if (recoveryOtp) recoveryOtp.value = '';
      setForgotStep(2);
      setForgotStatus(result.message || 'OTP sent successfully.', 'success');

      if (devOtpHint) {
        if (result.debugOtp) {
          devOtpHint.textContent = `Development OTP: ${result.debugOtp}`;
          devOtpHint.classList.remove('hidden');
        } else {
          devOtpHint.textContent = '';
          devOtpHint.classList.add('hidden');
        }
      }
    } catch (error) {
      setForgotStatus(error.message || 'Could not send OTP.', 'error');
    } finally {
      if (activeBtn) activeBtn.disabled = false;
    }
  }

  async function verifyOtp() {
    if (!recoveryOtp) return;
    const otpValue = recoveryOtp.value.trim();
    if (!/^\d{6}$/.test(otpValue)) {
      setForgotStatus('Enter a valid 6-digit OTP.', 'error');
      return;
    }

    if (!forgotState.channel || !forgotState.identifier) {
      setForgotStatus('Please request OTP first.', 'error');
      setForgotStep(1);
      return;
    }

    if (verifyOtpBtn) verifyOtpBtn.disabled = true;
    setForgotStatus('Verifying OTP...');

    try {
      const response = await fetch(FORGOT_VERIFY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('mindcare_token') || '') },
        body: JSON.stringify({
          channel: forgotState.channel,
          identifier: forgotState.identifier,
          otp: otpValue
        })
      });

      const result = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(result.message || 'OTP verification failed.');
      }

      forgotState.resetToken = result.resetToken || '';
      setForgotStep(3);
      setForgotStatus(result.message || 'OTP verified successfully.', 'success');
    } catch (error) {
      setForgotStatus(error.message || 'Could not verify OTP.', 'error');
    } finally {
      if (verifyOtpBtn) verifyOtpBtn.disabled = false;
    }
  }

  async function submitResetPassword() {
    if (!resetNewPassword || !resetConfirmPassword) return;

    const newPassword = resetNewPassword.value;
    const confirmPassword = resetConfirmPassword.value;

    if (!forgotState.resetToken) {
      setForgotStatus('Please verify OTP before resetting password.', 'error');
      setForgotStep(2);
      return;
    }

    if (newPassword.length < 8) {
      setForgotStatus('New password must be at least 8 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotStatus('Passwords do not match.', 'error');
      return;
    }

    if (resetPasswordBtn) resetPasswordBtn.disabled = true;
    setForgotStatus('Updating password...');

    try {
      const response = await fetch(FORGOT_RESET_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('mindcare_token') || '') },
        body: JSON.stringify({
          resetToken: forgotState.resetToken,
          newPassword,
          confirmPassword
        })
      });

      const result = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(result.message || 'Could not reset password.');
      }

      setForgotStatus(result.message || 'Password reset successful.', 'success');
      password.value = '';
      setTimeout(closeForgotModal, 900);
    } catch (error) {
      setForgotStatus(error.message || 'Could not reset password.', 'error');
    } finally {
      if (resetPasswordBtn) resetPasswordBtn.disabled = false;
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      const showing = password.getAttribute('type') === 'text';
      password.setAttribute('type', showing ? 'password' : 'text');
      toggle.setAttribute('aria-pressed', String(!showing));
      toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  }

  identifier.addEventListener('input', () => {
    if (identifier.value && isValidIdentifier(identifier.value)) {
      clearFieldError(identifier, idErr);
    }
  });

  password.addEventListener('input', () => {
    if (password.value) {
      clearFieldError(password, pwErr);
    }
  });

  if (forgotLink) {
    forgotLink.addEventListener('click', (event) => {
      event.preventDefault();
      openForgotModal();
    });
  }

  if (closeForgotModalBtn) {
    closeForgotModalBtn.addEventListener('click', closeForgotModal);
  }

  if (forgotModal) {
    forgotModal.addEventListener('click', (event) => {
      if (event.target === forgotModal) closeForgotModal();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && forgotModal && !forgotModal.classList.contains('hidden')) {
      closeForgotModal();
    }
  });

  if (recoveryMethod) {
    recoveryMethod.addEventListener('change', updateRecoveryPlaceholder);
  }
  updateRecoveryPlaceholder();

  if (sendOtpBtn) sendOtpBtn.addEventListener('click', requestOtp);
  if (resendOtpBtn) resendOtpBtn.addEventListener('click', requestOtp);
  if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', verifyOtp);
  if (resetPasswordBtn) resetPasswordBtn.addEventListener('click', submitResetPassword);
  if (cancelResetBtn) cancelResetBtn.addEventListener('click', closeForgotModal);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    submitBtn.disabled = true;

    const ok = validateLogin();
    if (!ok) {
      submitBtn.disabled = false;
      return;
    }

    const idVal = identifier.value.trim();
    const pwdVal = password.value;

    try {
      const response = await fetch(`${AUTH_BASE}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('mindcare_token') || '')
        },
        body: JSON.stringify({ identifier: idVal, password: pwdVal })
      });

      const result = await parseApiResponse(response);

      if (!response.ok) {
        setFieldError(identifier, idErr, result.message || 'Login failed.');
        submitBtn.disabled = false;
        return;
      }

      clearFieldError(identifier, idErr);
      clearFieldError(password, pwErr);
      
      if (result.token) {
        localStorage.setItem('mindcare_token', result.token);
      } else {
        localStorage.removeItem('mindcare_token');
      }

      if (rememberChk && rememberChk.checked) {
        localStorage.setItem('mindcare_user_email', result.user.email);
      }

      window.location.href = '/yoga.html';
    } catch (err) {
      console.error('Login Error:', err);
      setFieldError(identifier, idErr, 'Server is not reachable. Please try again later.');
      submitBtn.disabled = false;
    }
  });
})();
