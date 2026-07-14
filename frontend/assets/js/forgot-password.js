const backBtn = document.getElementById('backBtn');
const emailForm = document.getElementById('emailForm');
const otpForm = document.getElementById('otpForm');
const resetForm = document.getElementById('resetForm');
const emailInput = document.getElementById('emailInput');
const otpInput = document.getElementById('otpInput');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const emailDisplay = document.getElementById('emailDisplay');
const resendBtn = document.getElementById('resendBtn');
const resendTimer = document.getElementById('resendTimer');
const API_BASE_URL = 'http://localhost:5000/api';

let currentEmail = '';
let currentOtp = '';
let resendCountdown = 0;
let isResending = false;
let emailTimerInterval = null;
let isOtpVerified = false;
let resetToken = '';
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const emailFeedback = document.getElementById('emailFeedback');
const otpFeedback = document.getElementById('otpFeedback');
const resetFeedback = document.getElementById('resetFeedback');
const resetRuleLength = document.getElementById('resetRuleLength');
const resetRuleUpper = document.getElementById('resetRuleUpper');
const resetRuleLower = document.getElementById('resetRuleLower');
const resetRuleNumber = document.getElementById('resetRuleNumber');
const resetRuleSpecial = document.getElementById('resetRuleSpecial');

const passwordRules = {
  length: (value) => value.length >= 8,
  upper: (value) => /[A-Z]/.test(value),
  lower: (value) => /[a-z]/.test(value),
  number: (value) => /\d/.test(value),
  special: (value) => /[^A-Za-z\d]/.test(value),
};

function setFeedback(element, message, type = 'info') {
  if (!element) return;
  element.textContent = message;
  element.className = `feedback ${type}`;
}

function clearFeedback(element) {
  if (!element) return;
  element.textContent = '';
  element.className = 'feedback hidden';
}

function setButtonLoading(button, isLoading, loadingText, defaultText) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : defaultText;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

function setRuleState(element, isValid) {
  if (!element) return;
  element.classList.toggle('valid', isValid);
  element.classList.toggle('invalid', !isValid);
}

function updateResetPasswordChecklist() {
  const value = newPassword?.value || '';
  setRuleState(resetRuleLength, passwordRules.length(value));
  setRuleState(resetRuleUpper, passwordRules.upper(value));
  setRuleState(resetRuleLower, passwordRules.lower(value));
  setRuleState(resetRuleNumber, passwordRules.number(value));
  setRuleState(resetRuleSpecial, passwordRules.special(value));
}

function isPasswordStrong(value) {
  return Object.values(passwordRules).every((rule) => rule(value));
}

newPassword?.addEventListener('input', updateResetPasswordChecklist);
updateResetPasswordChecklist();

// Password visibility toggle
const togglePasswordButtons = document.querySelectorAll('.toggle-password');
togglePasswordButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    const passwordInput = e.target.previousElementSibling;
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    e.target.classList.toggle('fa-eye');
    e.target.classList.toggle('fa-eye-slash');
  });
});

// Back button
backBtn.addEventListener('click', () => {
  window.location.href = 'login.html';
});

// Show specific step
function showStep(stepNumber) {
  document.querySelectorAll('.forgot-step').forEach(step => {
    step.classList.add('hidden');
  });
  document.getElementById(`step${stepNumber}`).classList.remove('hidden');
}

// Email form submission
emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  currentEmail = emailInput.value.trim().toLowerCase();

  clearFeedback(emailFeedback);

  if (!isValidEmail(currentEmail)) {
    setFeedback(emailFeedback, 'Please enter a valid email address.', 'error');
    return;
  }

  try {
    setButtonLoading(sendOtpBtn, true, 'Sending OTP...', 'Send OTP');
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to send OTP');
    }

    setFeedback(emailFeedback, 'OTP sent successfully. Please check your email inbox/spam.', 'success');
    emailDisplay.textContent = `Email: ${currentEmail}`;
    resendCountdown = 60;
    startResendTimer();
    showStep(2);
  } catch (error) {
    setFeedback(emailFeedback, error.message || 'Unable to send OTP right now.', 'error');
  } finally {
    setButtonLoading(sendOtpBtn, false, 'Sending OTP...', 'Send OTP');
  }
});

// OTP form submission
otpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const enteredOTP = otpInput.value.trim();
  clearFeedback(otpFeedback);

  if (enteredOTP.length !== 6 || isNaN(enteredOTP)) {
    setFeedback(otpFeedback, 'Please enter a valid 6-digit OTP.', 'error');
    return;
  }

  try {
    setButtonLoading(verifyOtpBtn, true, 'Verifying...', 'Verify OTP');
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, otp: enteredOTP }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to verify OTP');
    }

    currentOtp = enteredOTP;
    isOtpVerified = true;
    resetToken = result?.data?.resetToken || '';
    setFeedback(otpFeedback, 'OTP verified successfully.', 'success');
    setTimeout(() => {
      showStep(3);
    }, 500);
  } catch (error) {
    setFeedback(otpFeedback, error.message || 'Unable to verify OTP right now.', 'error');
  } finally {
    setButtonLoading(verifyOtpBtn, false, 'Verifying...', 'Verify OTP');
  }
});

// Reset password form submission
resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = newPassword.value;
  const confirmPass = confirmPassword.value;
  clearFeedback(resetFeedback);

  if (!isOtpVerified) {
    setFeedback(resetFeedback, 'Please verify your OTP before resetting the password.', 'error');
    return;
  }

  if (!isPasswordStrong(password)) {
    setFeedback(resetFeedback, 'Please satisfy all password conditions before resetting your password.', 'error');
    return;
  }

  if (password !== confirmPass) {
    setFeedback(resetFeedback, 'Passwords do not match.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentEmail,
        resetToken,
        password,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to reset password');
    }

    setFeedback(resetFeedback, 'Password reset successfully.', 'success');
    showStep(4);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  } catch (error) {
    setFeedback(resetFeedback, error.message || 'Unable to reset password right now.', 'error');
  }
});

// Resend OTP
resendBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  if (isResending || resendCountdown > 0) {
    return;
  }

  isResending = true;
  clearFeedback(otpFeedback);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to resend OTP');
    }

    setFeedback(otpFeedback, 'A new OTP has been sent to your email.', 'success');

    resendCountdown = 60;
    startResendTimer();
    otpInput.value = '';
    otpInput.focus();
  } catch (error) {
    setFeedback(otpFeedback, error.message || 'Unable to resend OTP right now.', 'error');
  } finally {
    isResending = false;
  }
});

// Resend timer
function startResendTimer() {
  if (emailTimerInterval) {
    clearInterval(emailTimerInterval);
  }

  resendBtn.classList.add('disabled');
  resendBtn.style.pointerEvents = 'none';
  resendBtn.style.opacity = '0.5';

  emailTimerInterval = setInterval(() => {
    resendCountdown--;
    if (resendCountdown > 0) {
      resendTimer.textContent = `(${resendCountdown}s)`;
    } else {
      clearInterval(emailTimerInterval);
      emailTimerInterval = null;
      resendBtn.classList.remove('disabled');
      resendBtn.style.pointerEvents = 'auto';
      resendBtn.style.opacity = '1';
      resendTimer.textContent = '';
    }
  }, 1000);
}
