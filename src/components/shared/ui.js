// ==========================================
// AURA V2 — Toast Notification Component
// ==========================================

export function showToast(message, type = 'default', duration = 2500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
    error: '✕',
    violet: '✦',
    default: '●',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span style="opacity:0.7">${icons[type] || icons.default}</span> ${message}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==========================================
// AURA V2 — Modal Component
// ==========================================

let _activeModal = null;
let _onCloseCallback = null;

export function showModal({ title, content, actions = [], onClose, className = '' }) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  closeModal();

  _onCloseCallback = onClose;

  const modal = document.createElement('div');
  modal.className = `modal-wrapper ${className}`;
  modal.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop"></div>
    <div class="modal-sheet" id="modal-sheet">
      <div class="modal-handle"></div>
      ${title ? `<h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:var(--fw-bold);margin-bottom:var(--space-md);color:var(--text-primary)">${title}</h3>` : ''}
      <div id="modal-body">${content}</div>
      ${actions.length ? `
        <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg)">
          ${actions.map((a, i) => `
            <button class="btn ${a.style || 'btn-secondary'} btn-full" id="modal-action-${i}">${a.label}</button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  container.style.pointerEvents = 'auto';
  container.innerHTML = '';
  container.appendChild(modal);
  _activeModal = modal;

  // Wire actions
  actions.forEach((a, i) => {
    document.getElementById(`modal-action-${i}`)?.addEventListener('click', () => {
      if (a.action) a.action();
      if (a.close !== false) closeModal();
    });
  });

  // Close on backdrop
  document.getElementById('modal-backdrop')?.addEventListener('click', () => {
    closeModal();
  });

  // Close on ESC
  const onEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', onEsc);
    }
  };
  document.addEventListener('keydown', onEsc);

  return modal;
}

export function closeModal() {
  if (_activeModal) {
    _activeModal.remove();
    _activeModal = null;
  }
  const container = document.getElementById('modal-container');
  if (container) {
    container.innerHTML = '';
    container.style.pointerEvents = 'none';
  }
  if (_onCloseCallback) {
    const cb = _onCloseCallback;
    _onCloseCallback = null;
    try { cb(); } catch (e) { console.error(e); }
  }
}

export function updateModalBody(html) {
  const body = document.getElementById('modal-body');
  if (body) body.innerHTML = html;
}

// ==========================================
// AURA V2 — Bottom Sheet Manager (Singleton)
// ==========================================

let _activeBottomSheet = null;

export function openBottomSheet({ id, content, onClose }) {
  // Enforce global singleton
  closeActiveBottomSheet(true);

  const shell = document.getElementById('phone-shell');
  if (!shell) {
    console.warn('[BottomSheet] #phone-shell container not found.');
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'bottom-sheet-overlay';
  overlay.id = `${id}-overlay`;

  const sheet = document.createElement('div');
  sheet.className = 'bottom-sheet';
  sheet.id = `${id}-sheet`;
  sheet.innerHTML = `
    <div class="modal-handle"></div>
    <div id="${id}-sheet-content">${content}</div>
  `;

  shell.appendChild(overlay);
  shell.appendChild(sheet);

  _activeBottomSheet = { id, overlay, sheet, onClose };

  // Force layout reflow before sliding in
  requestAnimationFrame(() => {
    overlay.classList.add('open');
    sheet.classList.add('open');
  });

  // Wire backdrop click to close
  overlay.addEventListener('click', () => {
    closeActiveBottomSheet();
  });
}

export function closeActiveBottomSheet(instant = false) {
  if (!_activeBottomSheet) return;

  const { overlay, sheet, onClose } = _activeBottomSheet;
  _activeBottomSheet = null;

  if (instant) {
    overlay.remove();
    sheet.remove();
    if (onClose) {
      try { onClose(); } catch (e) { console.error(e); }
    }
  } else {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
    setTimeout(() => {
      overlay.remove();
      sheet.remove();
      if (onClose) {
        try { onClose(); } catch (e) { console.error(e); }
      }
    }, 300);
  }
}


