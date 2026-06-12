// ==========================================
// AURA V2 — Theme Engine
// Centralized theme manager
// ==========================================

import { getState, setState } from '../state/index.js';

// ── Theme Definitions ──
export const THEMES = {
  'slate-blue': {
    id: 'slate-blue',
    name: 'Slate Blue',
    emoji: '🔵',
    tags: ['Apple', 'Minimal', 'Professional', 'Clean'],
    dark: false,
    colors: {
      background: '#F6F8FB',
      surface:    '#EEF2F7',
      card:       '#FFFFFF',
      border:     '#E2E8F0',
      primary:    '#5A7BFB',
      secondary:  '#94A3BB',
      success:    '#10B981',
      warning:    '#F59E0B',
      danger:     '#EF4444',
      textPrimary:   '#0F172A',
      textSecondary: '#64748B',
      textMuted:     '#94A3B8',
    },
  },
  'elite-green': {
    id: 'elite-green',
    name: 'Elite Green',
    emoji: '💚',
    tags: ['Athlete', 'Performance', 'Discipline'],
    dark: true,
    colors: {
      background: '#050505',
      surface:    '#0A0A0A',
      card:       '#111111',
      border:     '#232323',
      primary:    '#00C853',
      secondary:  '#A8A8A8',
      success:    '#00C853',
      warning:    '#F59E0B',
      danger:     '#EF4444',
      textPrimary:   '#FFFFFF',
      textSecondary: '#A8A8A8',
      textMuted:     '#555555',
    },
  },
  'deep-indigo': {
    id: 'deep-indigo',
    name: 'Deep Indigo',
    emoji: '🟣',
    tags: ['Premium Performance', 'Modern', 'Focused'],
    dark: true,
    colors: {
      background: '#050505',
      surface:    '#0D0E14',
      card:       '#11121A',
      border:     '#23253A',
      primary:    '#5B5CF6',
      secondary:  '#8E93B8',
      success:    '#00E5A8',
      warning:    '#F59E0B',
      danger:     '#F43F5E',
      textPrimary:   '#FFFFFF',
      textSecondary: '#8E93B8',
      textMuted:     '#4A4F6E',
    },
  },
  'dusty-rose': {
    id: 'dusty-rose',
    name: 'Dusty Rose',
    emoji: '🌸',
    tags: ['Premium Wellness', 'Luxury Recovery'],
    dark: false,
    colors: {
      background: '#FFF7F8',
      surface:    '#FDF0F2',
      card:       '#FFFFFF',
      border:     '#F0E1E4',
      primary:    '#E07ABC',
      secondary:  '#F2B6C1',
      success:    '#10B981',
      warning:    '#F59E0B',
      danger:     '#EF4444',
      textPrimary:   '#2A1A1F',
      textSecondary: '#6A4A53',
      textMuted:     '#A08090',
    },
  },
  'deep-blue-silver': {
    id: 'deep-blue-silver',
    name: 'Deep Blue & Silver',
    emoji: '🔷',
    tags: ['Executive Athlete', 'WHOOP', 'Aston Martin'],
    dark: true,
    colors: {
      background: '#081120',
      surface:    '#111827',
      card:       '#151E2E',
      border:     '#23324A',
      primary:    '#2D6BFF',
      secondary:  '#8FA1B8',
      success:    '#00E5A8',
      warning:    '#F59E0B',
      danger:     '#EF4444',
      textPrimary:   '#F2F5FB',
      textSecondary: '#8FA1B8',
      textMuted:     '#4A5A70',
    },
  },
  'forest-stone': {
    id: 'forest-stone',
    name: 'Forest & Stone',
    emoji: '🌿',
    tags: ['Resilience', 'Nature', 'Long-Term Consistency'],
    dark: true,
    colors: {
      background: '#001A14',
      surface:    '#13231B',
      card:       '#1A2E24',
      border:     '#2A3C33',
      primary:    '#2ECC71',
      secondary:  '#8CA398',
      success:    '#2ECC71',
      warning:    '#F59E0B',
      danger:     '#EF4444',
      textPrimary:   '#E1F5E3',
      textSecondary: '#8CA398',
      textMuted:     '#4A6055',
    },
  },
};

export const THEME_ORDER = [
  'slate-blue',
  'elite-green',
  'deep-indigo',
  'dusty-rose',
  'deep-blue-silver',
  'forest-stone',
];

export const DEFAULT_THEME = 'deep-indigo';

// ── Internal color helpers ──
function _hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function _lighten(hex, amount) {
  const { r, g, b } = _hexToRgb(hex);
  const rr = Math.min(255, r + amount).toString(16).padStart(2, '0');
  const gg = Math.min(255, g + amount).toString(16).padStart(2, '0');
  const bb = Math.min(255, b + amount).toString(16).padStart(2, '0');
  return `#${rr}${gg}${bb}`;
}

function _darken(hex, amount) {
  return _lighten(hex, -amount);
}

function _alpha(hex, opacity) {
  const { r, g, b } = _hexToRgb(hex);
  return `rgba(${r},${g},${b},${opacity})`;
}

// ── Apply theme CSS variables to the phone shell ──
function _applyThemeVars(theme) {
  const c = theme.colors;
  const shell = document.getElementById('phone-shell');
  const root  = document.documentElement;
  if (!shell) return;

  // Mark theme on shell
  shell.dataset.theme = theme.id;

  const vars = {
    '--bg-base':        c.background,
    '--bg-surface':     c.surface,
    '--bg-elevated':    c.card,
    '--bg-card':        c.card,
    '--bg-card-hover':  theme.dark ? _lighten(c.card, 8) : _darken(c.card, 5),
    '--bg-input':       c.surface,
    '--bg-modal':       c.card,

    '--text-primary':   c.textPrimary,
    '--text-secondary': c.textSecondary,
    '--text-muted':     c.textMuted,
    '--text-accent':    c.primary,

    '--border-subtle':  _alpha(c.border, 0.8),
    '--border-card':    c.border,
    '--border-active':  _alpha(c.primary, 0.6),
    '--border-input':   c.border,

    '--aura-violet':        c.primary,
    '--aura-violet-light':  _lighten(c.primary, 20),
    '--aura-violet-dark':   _darken(c.primary, 20),
    '--aura-violet-glow':   _alpha(c.primary, 0.4),

    '--aura-mint':        c.success,
    '--aura-mint-light':  _lighten(c.success, 20),
    '--aura-mint-dark':   _darken(c.success, 20),
    '--aura-mint-glow':   _alpha(c.success, 0.4),

    '--aura-rose':        c.danger,
    '--aura-rose-light':  _lighten(c.danger, 20),
    '--aura-rose-dark':   _darken(c.danger, 20),
    '--aura-rose-glow':   _alpha(c.danger, 0.3),

    '--aura-amber':       c.warning,
    '--aura-amber-light': _lighten(c.warning, 20),
    '--aura-amber-glow':  _alpha(c.warning, 0.3),

    '--aura-blue':        c.secondary,
    '--aura-blue-light':  c.secondary,

    '--grad-violet': `linear-gradient(135deg, ${c.primary}, ${_darken(c.primary, 25)})`,
    '--grad-mint':   `linear-gradient(135deg, ${c.success}, ${_darken(c.success, 25)})`,
    '--grad-rose':   `linear-gradient(135deg, ${c.danger}, ${_darken(c.danger, 15)})`,
    '--grad-amber':  `linear-gradient(135deg, ${c.warning}, ${_darken(c.warning, 20)})`,
    '--grad-dark':   `linear-gradient(180deg, ${c.card} 0%, ${c.background} 100%)`,
    '--grad-card':   `linear-gradient(135deg, ${_alpha(c.primary, 0.08)}, ${_alpha(c.primary, 0.04)})`,
    '--grad-blue':   `linear-gradient(135deg, ${c.secondary}, ${_darken(c.secondary, 20)})`,

    '--shadow-sm':     `0 1px 3px ${_alpha('#000', theme.dark ? 0.4 : 0.15)}`,
    '--shadow-md':     `0 4px 16px ${_alpha('#000', theme.dark ? 0.5 : 0.2)}`,
    '--shadow-lg':     `0 8px 32px ${_alpha('#000', theme.dark ? 0.6 : 0.25)}`,
    '--shadow-violet': `0 4px 24px ${_alpha(c.primary, 0.3)}`,
    '--shadow-mint':   `0 4px 24px ${_alpha(c.success, 0.3)}`,
  };

  Object.entries(vars).forEach(([k, v]) => {
    shell.style.setProperty(k, v);
  });

  // Also propagate key vars to root (for modal-container which is outside shell)
  const rootKeys = [
    '--bg-elevated', '--bg-card', '--bg-modal', '--bg-input',
    '--text-primary', '--text-secondary', '--text-muted',
    '--border-card', '--border-subtle', '--border-active',
    '--aura-violet', '--aura-violet-light', '--aura-violet-glow',
    '--aura-mint', '--aura-mint-light',
    '--aura-rose', '--aura-rose-light',
    '--aura-amber', '--aura-amber-light',
    '--grad-violet', '--grad-mint',
    '--shadow-lg',
  ];
  rootKeys.forEach(k => {
    if (vars[k]) root.style.setProperty(k, vars[k]);
  });
}

// ── Public API ──
export const themeManager = {
  _currentThemeId: DEFAULT_THEME,

  get currentTheme() { return this._currentThemeId; },

  getTheme(id = null) {
    return THEMES[id || this._currentThemeId] || THEMES[DEFAULT_THEME];
  },

  /** Get a specific color from active theme */
  getColor(token) {
    return this.getTheme().colors[token] || '';
  },

  /** Apply + save a theme by id */
  setTheme(themeId, animate = true) {
    if (!THEMES[themeId]) return;
    this._currentThemeId = themeId;

    const shell = document.getElementById('phone-shell');
    if (shell && animate) {
      shell.style.transition = 'opacity 150ms ease';
      shell.style.opacity   = '0.8';
      setTimeout(() => {
        _applyThemeVars(THEMES[themeId]);
        shell.style.opacity = '1';
        setTimeout(() => { shell.style.transition = ''; }, 350);
      }, 150);
    } else {
      _applyThemeVars(THEMES[themeId]);
    }

    this.saveTheme();
    try { setState('app.selectedTheme', themeId); } catch(e) {}
  },

  /** Apply without fade (instant — used on boot) */
  applyInstant(themeId) {
    if (!THEMES[themeId]) themeId = DEFAULT_THEME;
    this._currentThemeId = themeId;
    _applyThemeVars(THEMES[themeId]);
  },

  saveTheme() {
    try { localStorage.setItem('aura_theme_v2', this._currentThemeId); } catch(e) {}
  },

  loadTheme() {
    try {
      const saved = localStorage.getItem('aura_theme_v2');
      if (saved && THEMES[saved]) { this._currentThemeId = saved; return saved; }
      const fromState = getState()?.app?.selectedTheme;
      if (fromState && THEMES[fromState]) { this._currentThemeId = fromState; return fromState; }
    } catch(e) {}
    return DEFAULT_THEME;
  },
};
