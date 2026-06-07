// ==========================================
// AURA V2 — Bottom Navigation Component
// (Global Shell — never unmounts)
// ==========================================

import { navigate } from '../../router.js';

const NAV_ITEMS = [
  {
    route: '/home',
    label: 'Home',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>`,
  },
  {
    route: '/train',
    label: 'Train',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.5 6.5h1.8M15.7 6.5h1.8M3 12h2.5M18.5 12H21M6.5 17.5h1.8M15.7 17.5h1.8"/>
      <rect x="8.3" y="4.5" width="1.4" height="4" rx="0.7"/>
      <rect x="14.3" y="4.5" width="1.4" height="4" rx="0.7"/>
      <rect x="8.3" y="15.5" width="1.4" height="4" rx="0.7"/>
      <rect x="14.3" y="15.5" width="1.4" height="4" rx="0.7"/>
      <rect x="9.7" y="9.5" width="4.6" height="5" rx="1.2"/>
    </svg>`,
  },
  {
    route: '/diet',
    label: 'Diet',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2C8 2 5 5.5 5 9c0 2.5 1.2 4.7 3 6v1h8v-1c1.8-1.3 3-3.5 3-6 0-3.5-3-7-7-7z"/>
      <path d="M9 21h6"/>
      <path d="M10 14v2M14 14v2"/>
    </svg>`,
  },
  {
    route: '/recovery',
    label: 'Recovery',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.759 4.068 2 6.5 2c1.845 0 3.715.86 5.5 2.587C13.785 2.86 15.655 2 17.5 2 19.932 2 23 3.76 23 7.191c0 4.105-5.37 8.863-11 14.402z"/>
    </svg>`,
  },
  {
    route: '/socials',
    label: 'Squad',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="7" r="3"/>
      <path d="M3 21v-2a6 6 0 0112 0v2"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
      <path d="M21 21v-2a4 4 0 00-3-3.85"/>
    </svg>`,
  },
];

export function renderBottomNav() {
  const mount = document.getElementById('bottom-nav-mount');
  if (!mount) return;

  mount.innerHTML = `
    <nav id="bottom-nav">
      ${NAV_ITEMS.map(item => `
        <button
          class="nav-item"
          data-route="${item.route}"
          id="nav-${item.route.slice(1)}"
          aria-label="${item.label}"
        >
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `).join('')}
    </nav>
  `;

  // Wire click handlers
  mount.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = btn.dataset.route;
      navigate(r);
    });
  });
}

export function setNavActive(route) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === route);
  });
}
