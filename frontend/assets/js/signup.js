const signupForm = document.getElementById('signupForm');
const signupFeedback = document.getElementById('signupFeedback');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const togglePasswordBtn = document.getElementById('togglePassword');
const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
const googleSignupBtn = document.getElementById('googleSignupBtn');
const ruleLength = document.getElementById('ruleLength');
const ruleUpper = document.getElementById('ruleUpper');
const ruleLower = document.getElementById('ruleLower');
const ruleNumber = document.getElementById('ruleNumber');
const ruleSpecial = document.getElementById('ruleSpecial');
const emailInput = document.getElementById('email');
const verifyEmailBtn = document.getElementById('verifyEmailBtn');
const signupOtpPanel = document.getElementById('signupOtpPanel');
const signupOtpInput = document.getElementById('signupOtp');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const emailVerificationStatus = document.getElementById('emailVerificationStatus');
const otpVerificationStatus = document.getElementById('otpVerificationStatus');
ensureSessionValidity();

if (getCurrentSessionUser()) {
  location.replace('home.html');
}

const showMessage = (message, isSuccess = false) => {
  signupFeedback.textContent = message;
  signupFeedback.classList.toggle('success', isSuccess);
};

const verificationState = {
  verifiedEmail: '',
  otpSentEmail: '',
};

const requiredFieldConfigs = [
  { id: 'firstname', label: 'First Name' },
  { id: 'lastname', label: 'Last Name' },
  { id: 'dob', label: 'Date of Birth' },
  { id: 'username', label: 'Username' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone Number' },
  { id: 'password', label: 'Password' },
  { id: 'confirmPassword', label: 'Re-confirm Password' },
  { id: 'nationality', label: 'Nationality' },
  { id: 'status', label: 'Status' },
];

const getErrorElement = (fieldId) => document.getElementById(`${fieldId}Error`);

const setFieldError = (fieldId, message = '') => {
  const input = document.getElementById(fieldId);
  const errorElement = getErrorElement(fieldId);
  const hasError = Boolean(message);
  input?.classList.toggle('input-error', hasError);
  if (errorElement) errorElement.textContent = message;
};

const clearAllFieldErrors = () => {
  requiredFieldConfigs.forEach(({ id }) => setFieldError(id, ''));
  setFieldError('signupOtp', '');
};

const setVerificationStatus = (element, message = '', type = '') => {
  if (!element) return;
  element.textContent = message;
  element.classList.remove('success', 'error');
  if (type) element.classList.add(type);
};

const validateRequiredFields = () => {
  const missingLabels = [];
  requiredFieldConfigs.forEach(({ id, label }) => {
    const input = document.getElementById(id);
    const value = input?.value?.trim?.() ?? input?.value ?? '';
    const isMissing = !value;
    setFieldError(id, isMissing ? `${label} is required.` : '');
    if (isMissing) missingLabels.push(label);
  });
  return missingLabels;
};

const resetEmailVerificationState = ({ clearOtp = true } = {}) => {
  verificationState.verifiedEmail = '';
  verificationState.otpSentEmail = '';
  signupOtpPanel?.classList.add('hidden');
  if (clearOtp && signupOtpInput) signupOtpInput.value = '';
  setVerificationStatus(emailVerificationStatus, '', '');
  setVerificationStatus(otpVerificationStatus, '', '');
};

const isIgnorableGoogleError = (message) =>
  typeof message === 'string' && message.toLowerCase().includes('did not return a credential');

const setButtonLoading = (button, isLoading, idleText) => {
  if (!button) return;
  button.disabled = isLoading;
  if (!button.dataset.defaultText) {
    button.dataset.defaultText = idleText || button.textContent.trim();
  }
  button.textContent = isLoading ? 'Please wait...' : button.dataset.defaultText;
};

const completeSignup = (payload, message) => {
  persistSession(payload || {});
  showMessage(message, true);
  signupForm.reset();
  clearAllFieldErrors();
  resetEmailVerificationState();

  setTimeout(() => {
    location.href = 'home.html';
  }, 900);
};

const passwordRules = {
  length: (value) => value.length >= 8,
  upper: (value) => /[A-Z]/.test(value),
  lower: (value) => /[a-z]/.test(value),
  number: (value) => /\d/.test(value),
  special: (value) => /[^A-Za-z\d]/.test(value),
};

const setRuleState = (element, isValid) => {
  if (!element) return;
  element.classList.toggle('valid', isValid);
  element.classList.toggle('invalid', !isValid);
};

const updatePasswordChecklist = () => {
  const value = passwordInput.value;
  setRuleState(ruleLength, passwordRules.length(value));
  setRuleState(ruleUpper, passwordRules.upper(value));
  setRuleState(ruleLower, passwordRules.lower(value));
  setRuleState(ruleNumber, passwordRules.number(value));
  setRuleState(ruleSpecial, passwordRules.special(value));
};

const isPasswordStrong = (value) => Object.values(passwordRules).every((rule) => rule(value));

requiredFieldConfigs.forEach(({ id, label }) => {
  const input = document.getElementById(id);
  input?.addEventListener('input', () => {
    const value = input.value?.trim?.() ?? input.value;
    if (value) setFieldError(id, '');
    if (id === 'email' && verificationState.verifiedEmail && value.trim().toLowerCase() !== verificationState.verifiedEmail) {
      resetEmailVerificationState({ clearOtp: true });
      setVerificationStatus(emailVerificationStatus, 'Email changed. Please verify this email again.', 'error');
    }
  });
  input?.addEventListener('change', () => {
    const value = input.value?.trim?.() ?? input.value;
    if (value) setFieldError(id, '');
  });
});

passwordInput.addEventListener('input', updatePasswordChecklist);
updatePasswordChecklist();

togglePasswordBtn.addEventListener('click', () => {
  const icon = togglePasswordBtn.querySelector('i');
  const showPassword = passwordInput.type === 'password';
  passwordInput.type = showPassword ? 'text' : 'password';
  icon.classList.toggle('fa-eye', !showPassword);
  icon.classList.toggle('fa-eye-slash', showPassword);
});

toggleConfirmPasswordBtn.addEventListener('click', () => {
  const icon = toggleConfirmPasswordBtn.querySelector('i');
  const showPassword = confirmPasswordInput.type === 'password';
  confirmPasswordInput.type = showPassword ? 'text' : 'password';
  icon.classList.toggle('fa-eye', !showPassword);
  icon.classList.toggle('fa-eye-slash', showPassword);
});

verifyEmailBtn?.addEventListener('click', async () => {
  const email = emailInput.value.trim().toLowerCase();
  showMessage('');
  setFieldError('email', '');
  setFieldError('signupOtp', '');

  if (!email) {
    setFieldError('email', 'Email is required.');
    setVerificationStatus(emailVerificationStatus, 'Please enter your email first.', 'error');
    emailInput.focus();
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('email', 'Enter a valid email address.');
    setVerificationStatus(emailVerificationStatus, 'Please enter a valid email address.', 'error');
    emailInput.focus();
    return;
  }

  try {
    setButtonLoading(verifyEmailBtn, true, 'Verify');
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'signup' }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to send OTP');
    }

    verificationState.verifiedEmail = '';
    verificationState.otpSentEmail = email;
    signupOtpPanel?.classList.remove('hidden');
    setVerificationStatus(emailVerificationStatus, 'OTP sent to your email. Please enter it below.', 'success');
    setVerificationStatus(otpVerificationStatus, '', '');
    signupOtpInput?.focus();
  } catch (error) {
    resetEmailVerificationState();
    setVerificationStatus(emailVerificationStatus, error.message || 'Unable to send OTP right now.', 'error');
  } finally {
    setButtonLoading(verifyEmailBtn, false, 'Verify');
  }
});

verifyOtpBtn?.addEventListener('click', async () => {
  const email = emailInput.value.trim().toLowerCase();
  const otp = signupOtpInput.value.trim();
  setFieldError('signupOtp', '');
  showMessage('');

  if (!email || verificationState.otpSentEmail !== email) {
    setVerificationStatus(otpVerificationStatus, 'Please click Verify on your email first.', 'error');
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    setFieldError('signupOtp', 'Enter a valid 6-digit OTP.');
    setVerificationStatus(otpVerificationStatus, 'Enter a valid 6-digit OTP.', 'error');
    signupOtpInput.focus();
    return;
  }

  try {
    setButtonLoading(verifyOtpBtn, true, 'Verify OTP');
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, purpose: 'signup' }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to verify OTP');
    }

    verificationState.verifiedEmail = email;
    setVerificationStatus(emailVerificationStatus, 'Email verified successfully.', 'success');
    setVerificationStatus(otpVerificationStatus, 'OTP verified successfully. You can now create your account.', 'success');
    setFieldError('email', '');
  } catch (error) {
    verificationState.verifiedEmail = '';
    setVerificationStatus(otpVerificationStatus, error.message || 'Unable to verify OTP right now.', 'error');
  } finally {
    setButtonLoading(verifyOtpBtn, false, 'Verify OTP');
  }
});

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAllFieldErrors();

  const firstname = signupForm.querySelector('#firstname').value.trim();
  const middlename = signupForm.querySelector('#middlename').value.trim();
  const lastname = signupForm.querySelector('#lastname').value.trim();
  const dob = signupForm.querySelector('#dob').value;
  const username = signupForm.querySelector('#username').value.trim();
  const email = signupForm.querySelector('#email').value.trim();
  const phone = signupForm.querySelector('#phone').value.trim();
  const password = signupForm.querySelector('#password').value;
  const confirmPassword = signupForm.querySelector('#confirmPassword').value;
  const nationality = signupForm.querySelector('#nationality').value;
  const status = signupForm.querySelector('#status').value;
  const missingFields = validateRequiredFields();

  if (missingFields.length > 0) {
    showMessage(`Please fill the required fields: ${missingFields.join(', ')}.`);
    return;
  }

  if (!verificationState.verifiedEmail || verificationState.verifiedEmail !== email.toLowerCase()) {
    setFieldError('email', 'Please verify your email before creating your account.');
    setVerificationStatus(emailVerificationStatus, 'You must verify your email before creating your account.', 'error');
    showMessage('Please verify your email before creating your account.');
    return;
  }

  if (password !== confirmPassword) {
    setFieldError('confirmPassword', 'Passwords do not match.');
    showMessage('Password and Re-confirm Password must match.');
    return;
  }

  if (!isPasswordStrong(password)) {
    setFieldError('password', 'Please satisfy all password conditions.');
    showMessage('Please satisfy all password conditions before creating your account.');
    return;
  }

  try {
    setButtonLoading(signupForm.querySelector('.primary-btn'), true, 'Create Account');
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstname,
        middlename,
        lastname,
        username,
        email,
        phone,
        dob,
        password,
        nationality,
        status,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to create account');
    }

    const payload = result?.data || {};
    completeSignup(payload, 'Account created successfully! Redirecting...');
  } catch (error) {
    showMessage(error.message || 'Unable to create account right now.');
  } finally {
    setButtonLoading(signupForm.querySelector('.primary-btn'), false, 'Create Account');
  }
});

googleSignupBtn?.addEventListener('click', () => {
  showMessage('');
  setButtonLoading(googleSignupBtn, true, 'Continue with Google');

  requestGoogleCredential({
    mountId: 'googleSignupMount',
    onReady: () => {
      // The Google button is rendered invisibly off-screen.
      // Auto-click it to open the popup immediately.
      // Our styled button stays fully visible at all times.
      const mount = document.getElementById('googleSignupMount');
      if (mount) {
        const innerBtn = mount.querySelector('div[role="button"], iframe');
        if (innerBtn) innerBtn.click();
      }
      // Restore our button to normal — it was never hidden
      setButtonLoading(googleSignupBtn, false, 'Continue with Google');
    },
    onCredential: async ({ credential }) => {
      try {
        setButtonLoading(googleSignupBtn, true, 'Continue with Google');

        const response = await fetch(`${AUTH_API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Google signup failed.');
        }

        const googleMessage = result.data?.isNewUser
          ? 'Google account created successfully! Redirecting...'
          : 'Existing account found. Signed in with Google successfully!';

        completeSignup(result.data || {}, googleMessage);
      } catch (error) {
        showMessage(error.message || 'Google signup failed.');
        setButtonLoading(googleSignupBtn, false, 'Continue with Google');
      }
    },
    onError: (message) => {
      if (!isIgnorableGoogleError(message)) {
        showMessage(message);
      }
      setButtonLoading(googleSignupBtn, false, 'Continue with Google');
    },
  });
});