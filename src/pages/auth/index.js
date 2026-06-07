// ==========================================
// AURA V2 — Auth Page
// Routes: /auth (login + register + forgot)
// ==========================================

import { getState, setState, updateState, saveState } from '../../state/index.js';
import { navigate } from '../../router.js';
import { showToast } from '../../components/shared/ui.js';
import './auth.css';

let _view = 'login'; // 'login' | 'register' | 'forgot'

export function render() {
  return `
    <div class="auth-page" id="auth-page">
      <!-- Background particles -->
      <div class="auth-bg">
        <div class="auth-orb auth-orb-1"></div>
        <div class="auth-orb auth-orb-2"></div>
        <div class="auth-orb auth-orb-3"></div>
      </div>

      <!-- Logo -->
      <div class="auth-logo">
        <div class="auth-emblem">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="url(#authGrad)" stroke-width="2"/>
            <path d="M14 34L24 10L34 34" stroke="url(#authGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17 27h14" stroke="url(#authGrad)" stroke-width="2" stroke-linecap="round"/>
            <defs>
              <linearGradient id="authGrad" x1="0" y1="0" x2="48" y2="48">
                <stop stop-color="#a78bfa"/>
                <stop offset="1" stop-color="#7c3aed"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="auth-brand">AURA</h1>
        <p class="auth-tagline">Your Adaptive Fitness OS</p>
      </div>

      <!-- Form container -->
      <div class="auth-form-container" id="auth-form-container">
        ${_renderView()}
      </div>
    </div>
  `;
}

function _renderView() {
  switch (_view) {
    case 'login': return _renderLogin();
    case 'register': return _renderRegister();
    case 'forgot': return _renderForgot();
    default: return _renderLogin();
  }
}

function _renderLogin() {
  return `
    <div class="auth-form anim-scale-in" id="login-form">
      <h2 class="auth-form-title">Welcome back</h2>
      <p class="auth-form-sub">Sign in to your account</p>

      <div class="auth-fields">
        <div class="field-group">
          <label class="field-label">Email or Username</label>
          <input class="input" id="login-email" type="text" placeholder="you@example.com" autocomplete="email" />
        </div>
        <div class="field-group">
          <label class="field-label">Password</label>
          <div class="input-with-icon">
            <input class="input" id="login-password" type="password" placeholder="••••••••" autocomplete="current-password" />
            <button class="input-icon-btn" id="toggle-pw" type="button">👁</button>
          </div>
        </div>
      </div>

      <button class="auth-link" id="goto-forgot">Forgot password?</button>

      <button class="btn btn-primary btn-full auth-submit" id="login-btn">
        Sign In
      </button>

      <div class="auth-divider"><span>or</span></div>

      <button class="btn btn-secondary btn-full" id="demo-btn">
        ✦ Try Demo Mode
      </button>

      <p class="auth-switch">
        Don't have an account?
        <button class="auth-link inline" id="goto-register">Sign up free</button>
      </p>
    </div>
  `;
}

function _renderRegister() {
  return `
    <div class="auth-form anim-scale-in" id="register-form">
      <h2 class="auth-form-title">Create account</h2>
      <p class="auth-form-sub">Start your transformation</p>

      <div class="auth-fields">
        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Full Name</label>
            <input class="input" id="reg-name" type="text" placeholder="Alex Johnson" />
          </div>
          <div class="field-group">
            <label class="field-label">Username</label>
            <input class="input" id="reg-username" type="text" placeholder="@username" />
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Email</label>
          <input class="input" id="reg-email" type="email" placeholder="you@example.com" />
        </div>
        <div class="field-group">
          <label class="field-label">Password</label>
          <input class="input" id="reg-password" type="password" placeholder="Min 8 characters" />
        </div>
      </div>

      <button class="btn btn-primary btn-full auth-submit" id="register-btn">
        Create Account
      </button>

      <p class="auth-switch">
        Already have an account?
        <button class="auth-link inline" id="goto-login">Sign in</button>
      </p>
    </div>
  `;
}

function _renderForgot() {
  return `
    <div class="auth-form anim-scale-in" id="forgot-form">
      <button class="auth-back" id="back-to-login">← Back</button>
      <h2 class="auth-form-title">Reset password</h2>
      <p class="auth-form-sub">We'll send you a reset link</p>

      <div class="auth-fields">
        <div class="field-group">
          <label class="field-label">Email</label>
          <input class="input" id="forgot-email" type="email" placeholder="you@example.com" />
        </div>
      </div>

      <button class="btn btn-primary btn-full" id="forgot-btn">
        Send Reset Link
      </button>
    </div>
  `;
}

export function onEnter() {
  _view = 'login';
  _wireEvents();
}

export function onLeave() {}

function _switchView(view) {
  _view = view;
  const container = document.getElementById('auth-form-container');
  if (container) container.innerHTML = _renderView();
  _wireEvents();
}

function _wireEvents() {
  // View switches
  document.getElementById('goto-register')?.addEventListener('click', () => _switchView('register'));
  document.getElementById('goto-login')?.addEventListener('click', () => _switchView('login'));
  document.getElementById('goto-forgot')?.addEventListener('click', () => _switchView('forgot'));
  document.getElementById('back-to-login')?.addEventListener('click', () => _switchView('login'));

  // Password toggle
  document.getElementById('toggle-pw')?.addEventListener('click', () => {
    const pw = document.getElementById('login-password');
    if (pw) pw.type = pw.type === 'password' ? 'text' : 'password';
  });

  // Login
  document.getElementById('login-btn')?.addEventListener('click', _handleLogin);
  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _handleLogin();
  });

  // Register
  document.getElementById('register-btn')?.addEventListener('click', _handleRegister);

  // Demo
  document.getElementById('demo-btn')?.addEventListener('click', _handleDemo);

  // Forgot
  document.getElementById('forgot-btn')?.addEventListener('click', () => {
    showToast('Reset link sent! Check your email ✦', 'violet');
    setTimeout(() => _switchView('login'), 2000);
  });
}

function _handleLogin() {
  const email = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value;

  if (!email || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }
  if (password.length < 3) {
    showToast('Invalid credentials', 'error');
    return;
  }

  _loginUser({ profileName: email.split('@')[0], username: email.split('@')[0].toLowerCase() });
}

function _handleRegister() {
  const name = document.getElementById('reg-name')?.value?.trim();
  const username = document.getElementById('reg-username')?.value?.trim().replace('@', '');
  const email = document.getElementById('reg-email')?.value?.trim();
  const password = document.getElementById('reg-password')?.value;

  if (!name || !username || !email || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }
  if (password.length < 8) {
    showToast('Password must be 8+ characters', 'error');
    return;
  }

  _loginUser({ profileName: name, username });
}

function _handleDemo() {
  _loginUser({ profileName: 'Demo User', username: 'demo_athlete' });
}

function _loginUser({ profileName, username }) {
  const btn = document.querySelector('.auth-submit, #demo-btn');
  if (btn) { btn.textContent = 'Signing in...'; btn.disabled = true; }

  setTimeout(() => {
    updateState('auth', {
      isLoggedIn: true,
      userId: Date.now().toString(),
      profileName,
      username,
    });
    saveState();

    const state = getState();
    if (state.onboarding?.completed) {
      navigate('/home', true);
    } else {
      navigate('/onboarding', true);
    }
  }, 800);
}
