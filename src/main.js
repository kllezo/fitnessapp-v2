// ==========================================
// AURA V2 — App Entry Point
// ==========================================

import './assets/styles/tokens.css';
import './assets/styles/global.css';
import './assets/styles/animations.css';

import { loadState, getState } from './state/index.js';
import { route, initRouter } from './router.js';
import { renderBottomNav } from './components/navigation/bottom-nav.js';

// Pages
import * as AuthPage from './pages/auth/index.js';
import * as OnboardingPage from './pages/onboarding/index.js';
import * as HomePage from './pages/home/index.js';
import * as TrainPage from './pages/train/index.js';
import * as DietPage from './pages/diet/index.js';
import * as RecoveryPage from './pages/recovery/index.js';
import * as SocialsPage from './pages/socials/index.js';
import * as ProfilePage from './pages/profile/index.js';
import * as SettingsPage from './pages/settings/index.js';

async function bootstrap() {
  // 1. Load persisted state
  loadState();

  // 2. Render global bottom nav (always mounted)
  renderBottomNav();

  // 3. Register all routes
  route('/auth', AuthPage);
  route('/onboarding', OnboardingPage);
  route('/home', HomePage);
  route('/train', TrainPage);
  route('/diet', DietPage);
  route('/recovery', RecoveryPage);
  route('/socials', SocialsPage);
  route('/profile', ProfilePage);
  route('/settings', SettingsPage);

  // 4. Init router & navigate to initial route
  await initRouter();

  // 5. Start status bar clock
  startClock();

  // 6. Apply persisted theme
  const state = getState();
  if (state.app?.theme === 'light') {
    document.body.classList.add('light-theme');
  }
}

function startClock() {
  function update() {
    const el = document.getElementById('status-time');
    if (!el) return;
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    el.textContent = `${h}:${m}`;
  }
  update();
  setInterval(update, 10000);
}

bootstrap().catch(console.error);
