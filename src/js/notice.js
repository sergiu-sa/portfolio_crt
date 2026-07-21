/**
 * First-visit broadcast notice — the site is mid-redesign.
 *
 * Shows a small dismissible card and keeps showing it until the visitor closes it, then remembers that in localStorage so they are not pestered again.
 * Temporary: remove this module, its import and call in main.js, its @import in main.css, and the #broadcast-notice markup in index.html once the About and
 * Contact redesigns land.
 */

const STORAGE_KEY = 'crtRedesignNoticeDismissed';

export function initRedesignNotice() {
  const notice = document.getElementById('broadcast-notice');
  const closeBtn = document.getElementById('broadcast-notice-close');
  if (!notice || !closeBtn) return;

  let dismissed = false;
  try {
    dismissed = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    /* localStorage blocked (private mode) — show it anyway */
  }
  if (dismissed) return;

  notice.hidden = false;
  requestAnimationFrame(() => notice.classList.add('is-visible'));

  const dismiss = () => {
    notice.classList.remove('is-visible');
    const hide = () => {
      notice.hidden = true;
    };
    notice.addEventListener('transitionend', hide, { once: true });
    // Fallback in case the transition never fires (reduced motion, etc.).
    setTimeout(hide, 400);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* localStorage blocked — nothing to persist */
    }
  };

  closeBtn.addEventListener('click', dismiss);
}
