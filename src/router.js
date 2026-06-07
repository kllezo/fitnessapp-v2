// ==========================================
// AURA V2 — Hash-Based SPA Router
// ==========================================

import { getState, setState } from './state/index.js';

const _routes = new Map();
let _currentRoute = null;
let _transitioning = false;

// ── Register a route ──
export function route(path, module) {
  _routes.set(path, module);
}

// ── Navigate to route ──
export async function navigate(path, replace = false) {
  if (_transitioning) return;
  if (path === _currentRoute) return;

  const hash = '#' + path;
  if (replace) {
    history.replaceState(null, '', hash);
  } else {
    history.pushState(null, '', hash);
  }
  await _handleRoute(path);
}

// ── Get current route ──
export function getCurrentRoute() {
  return _currentRoute;
}

// ── Init router ──
export async function initRouter() {
  window.addEventListener('popstate', () => {
    const path = _getPathFromHash();
    _handleRoute(path);
  });

  const initial = _getPathFromHash();
  await _handleRoute(initial);
}

function _getPathFromHash() {
  const hash = window.location.hash;
  if (!hash || hash === '#') return null;
  return hash.slice(1); // remove '#'
}

async function _handleRoute(path) {
  _transitioning = true;

  const state = getState();
  const isLoggedIn = state.auth?.isLoggedIn;
  const onboardingDone = state.onboarding?.completed;

  // Route guards
  let resolvedPath = path;

  if (!path || path === '/') {
    if (!isLoggedIn) resolvedPath = '/auth';
    else if (!onboardingDone) resolvedPath = '/onboarding';
    else resolvedPath = '/home';
  }

  // Guard: non-authed users → /auth
  const publicRoutes = ['/auth', '/onboarding'];
  if (!isLoggedIn && !publicRoutes.includes(resolvedPath)) {
    resolvedPath = '/auth';
  }

  // Guard: logged-in users trying /auth → /home
  if (isLoggedIn && resolvedPath === '/auth') {
    if (!onboardingDone) resolvedPath = '/onboarding';
    else resolvedPath = '/home';
  }

  const mod = _routes.get(resolvedPath);
  if (!mod) {
    console.warn('[Router] No module for route:', resolvedPath);
    _transitioning = false;
    return;
  }

  // Update URL if it changed
  const currentHash = '#' + resolvedPath;
  if (window.location.hash !== currentHash) {
    history.replaceState(null, '', currentHash);
  }

  // Get page content container
  const container = document.getElementById('page-content');
  if (!container) { _transitioning = false; return; }

  // Exit current page
  if (_currentRoute) {
    const prevMod = _routes.get(_currentRoute);
    if (prevMod?.onLeave) await prevMod.onLeave();
    container.style.opacity = '0';
    container.style.transform = 'translateX(-12px)';
    container.style.transition = 'all 150ms ease';
    await _sleep(150);
  }

  // Update nav visibility
  _updateNavVisibility(resolvedPath);

  // Render new page
  setState('app.currentRoute', resolvedPath);
  _currentRoute = resolvedPath;

  container.style.transition = 'none';
  container.style.opacity = '0';
  container.style.transform = 'translateX(12px)';

  // Render HTML
  if (mod.render) {
    container.innerHTML = mod.render();
  }

  // Animate in
  await _sleep(16);
  container.style.transition = 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)';
  container.style.opacity = '1';
  container.style.transform = 'translateX(0)';

  // Call onEnter lifecycle
  if (mod.onEnter) {
    await _sleep(50);
    mod.onEnter();
  }

  // Update bottom nav active state
  _updateNavActive(resolvedPath);

  _transitioning = false;
}

function _updateNavVisibility(path) {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  const hiddenRoutes = ['/auth', '/onboarding'];
  if (hiddenRoutes.includes(path)) {
    nav.style.display = 'none';
  } else {
    nav.style.display = 'flex';
  }
}

function _updateNavActive(path) {
  document.querySelectorAll('.nav-item').forEach(item => {
    const itemRoute = item.dataset.route;
    item.classList.toggle('active', itemRoute === path);
  });
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
