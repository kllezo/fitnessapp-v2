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
    │   ├── onboarding/      # 12-step configuration wizard
    │   ├── home/            # Dashboard stats, AI reviews, sync sheet modal
    │   ├── train/           # Day chips, set completion log sheets, rest timer
    │   ├── diet/            # Hydration bars, food logs, meal detail sheets
    │   ├── recovery/        # Somatics, brown noise, box breathing, mindfulness
    │   ├── socials/         # Partner tab, DMs, matching engine, squad leaderboard
    │   ├── profile/         # Avatar uploads, bio, stats
    │   └── settings/        # Preferences, data export, account delete modal
    ├── services/
    │   ├── ai-engine.js     # Readiness, PR extracts, habits detection, compatibility calculations
    │   ├── nutrition-engine.js # Calorie target calculations, meal catalogs, logging
    │   ├── workout-engine.js # Plan generation, history persistence, volume calculations
    │   └── activity-engine.js # Step tracking abstraction layer, goal updates, steps calculations
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
- Custom bottom sheets (such as Activity Details and Discipline Details sheets in `/home`) use absolute-positioned viewport drawers overlaying the main app shell container, driven by class toggles (`.open`) and custom event handlers.
- **Orphan / Ghost Node Prevention**: The SPA router (`src/router.js`) explicitly imports and executes `closeModal()` at the beginning of page transitions to clean up backdrop and modal wrappers from previous page states, ensuring zero orphaned elements or duplicate rendering.
- **Ghost Sheet Guards**: `home/index.js::_forceCloseAllSheets()` and `diet/index.js::_forceCloseAllDietSheets()` are called at the start of every `onEnter()` call. This defensively removes `.open` classes from all custom bottom-sheet overlays and panels before event rebinding, preventing ghost overlays from blocking user interactions after re-renders or sync-complete refreshes.
- **Event Listener Safety**: `_refreshMacros()` in `diet/index.js` no longer calls the full `_wireEvents()` after DOM updates; it only rebinds the two macro ring click handlers (`calories-ring-wrapper`, `protein-ring-wrapper`). This prevents listener stacking on water buttons and meal rows which would cause duplicate log actions per tap.
