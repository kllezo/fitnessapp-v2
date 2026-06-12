# CURRENT ARCHITECTURE — AURA V2

AURA V2 is built as a modular, single-page application (SPA) using Vite + Vanilla JavaScript, styled using Vanilla CSS variables and glassmorphism.

## Directory Structure
```
webiste 2/
├── index.html               # Main shell structure (Notch, status bar, container mounts)
├── vite.config.js           # Vite development server settings
├── package.json             # Dev dependencies and scripts
└── src/
    ├── main.js              # Application entry, boots state and registers routes
    ├── router.js            # SPA Hash-based Router with transition hooks and route guards
    ├── style.css            # Vite starter styles
    ├── assets/
    │   └── styles/
    │       ├── global.css   # Core mobile phone frame, inputs, buttons, scrollbar behaviors
    │       ├── tokens.css   # Color palette tokens, gradients, sizing variables
    │       └── animations.css # Toast entries, slide sheets, backdrops animations
    ├── components/
    │   ├── shared/
    │   │   └── ui.js        # Global Toast overlay (`showToast`) and Modal sheets (`showModal`)
    │   └── navigation/
    │       └── bottom-nav.js # Global mobile bottom navigation mount
    ├── pages/
    │   ├── auth/            # Lock screen authentication and demo triggers
    │   ├── onboarding/      # 14-step configuration wizard (now includes Choose Your Aura theme step)
    │   ├── home/            # Dashboard stats, AI reviews, sync sheet modal
    │   ├── train/           # Day chips, set completion log sheets, rest timer
    │   ├── diet/            # Hydration bars, food logs, meal detail sheets
    │   ├── recovery/        # Somatics, brown noise, box breathing, mindfulness
    │   ├── socials/         # Partner tab, DMs, matching engine, squad leaderboard
    │   ├── profile/         # Avatar uploads, bio, stats
    │   └── settings/        # Preferences, data export, account delete modal
    ├── services/
    │   ├── ai-engine.js        # Readiness, PR extracts, habits detection, compatibility calculations
    │   ├── nutrition-engine.js # Calorie target calculations, meal catalogs, logging
    │   ├── workout-engine.js   # Plan generation, history persistence, volume calculations
    │   ├── activity-engine.js  # Step tracking abstraction layer, goal updates, steps calculations
    │   └── theme-engine.js     # Centralized theme manager: 6 theme presets, CSS var injection, persistence
    └── state/
        └── index.js         # Single reactive store with localStorage serialization
```

## State Flow
- Master state lives in `src/state/index.js` (loaded at bootstrap).
- Modules call `getState()`, `setState(key, value)`, or `updateState(key, partialObject)`.
- Updates serialize to `localStorage` under `aura_state_v2`.

## Global Shell UI Overlay Structure
- Backdrop and sheet modals are appended inside `div#modal-container` in `index.html` and managed dynamically via `showModal` / `closeModal` from `src/components/shared/ui.js` to ensure a single active modal instance and clean DOM unmounting.
- Toasts are appended inside `div#toast-container`.
- Custom bottom sheets are generated entirely dynamically at the bottom of `#phone-shell` using `openBottomSheet` inside `src/components/shared/ui.js`. There are no static sheet elements inside the HTML templates, ensuring no ghost boxes or duplicate overlays.
- **Single Active Sheet Enforced**: The dynamic bottom sheet manager uses a global singleton pointer `_activeBottomSheet`. Opening any sheet immediately triggers `closeActiveBottomSheet(true)` which removes any existing bottom sheet and backdrop instantly from the DOM.
- **Route Transition Cleanup**: The SPA router (`src/router.js`) calls `closeActiveBottomSheet(true)` and `closeModal()` on every route change, guaranteeing a completely clean DOM state when moving between screens.
- **Event Listener Safety**: `_refreshMacros()` in `diet/index.js` only re-binds macro ring handlers (`calories-ring-wrapper`, `protein-ring-wrapper`) after DOM refreshes, avoiding stacked event listener warnings or duplicate executions.

## Theme System Architecture
- **Engine**: `src/services/theme-engine.js` exports `THEMES`, `THEME_ORDER`, `DEFAULT_THEME`, and `themeManager` singleton.
- **Apply mechanism**: `themeManager.setTheme(id)` calls `_applyThemeVars(theme)` which injects CSS custom properties directly onto `#phone-shell` using `element.style.setProperty(varName, value)`. Approximately 40 variables are overridden per theme.
- **Root propagation**: A subset of critical variables (backgrounds, text, borders, primary colors) are also set on `document.documentElement` so `#modal-container` (outside `#phone-shell`) inherits the correct palette.
- **Boot sequence**: `main.js` calls `themeManager.loadTheme()` then `themeManager.applyInstant()` after the initial route renders — no flash of wrong theme.
- **Persistence**: Theme ID stored in `localStorage` key `aura_theme_v2` (via `themeManager.saveTheme()`) AND in `state.app.selectedTheme` (via `setState`).
- **No page reload**: CSS variable injection is synchronous DOM mutation — instantaneous theme switching without any page navigation.

