/**
 * Contact Module (station ident)
 * Live Oslo clock, copy-to-clipboard for the email line, outbound-line ping
 * animation, the test-card signal-lock tune-in, scroll reveal, section-nav
 * wiring, and Formspree message submission.
 */

import { playSignalLock } from './audio.js';

// ============================================

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzddenv';

const PRIMARY_EMAIL = 'sergiudsarbu@gmail.com';

let clockTimer = null;
let revealObserver = null;

function formatOsloTime(date) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Oslo',
  });
}

function renderClockInto(el, time) {
  if (!el) return;
  // Rebuild as: "<h><span.colon>:</span><m>" so the colon can blink via CSS.
  const [h, m] = time.split(':');
  el.textContent = '';
  el.appendChild(document.createTextNode(h));
  const colon = document.createElement('span');
  colon.className = 'contact-clock-colon';
  colon.textContent = ':';
  el.appendChild(colon);
  el.appendChild(document.createTextNode(m));
}

function updateClock() {
  const time = formatOsloTime(new Date());
  renderClockInto(document.getElementById('contact-clock-time'), time);
}

function startClock() {
  updateClock();
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = setInterval(updateClock, 30_000);
}

function setupCopyEmail(showOSD) {
  const btn = document.getElementById('contact-copy-mail');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = 'true';

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(PRIMARY_EMAIL);
      if (typeof showOSD === 'function') showOSD('EMAIL COPIED');
      btn.classList.add('copied');
      const original = btn.querySelector('span').textContent;
      btn.querySelector('span').textContent = 'COPIED';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.querySelector('span').textContent = original;
      }, 1200);
    } catch {
      if (typeof showOSD === 'function') showOSD('COPY FAILED');
    }
  });
}

function setupSectionNav(showSection) {
  document.querySelectorAll('#contact [data-section]').forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = 'true';
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-section');
      if (target && typeof showSection === 'function') showSection(target);
    });
  });
}

/**
 * Scroll-driven block reveal — mirrors the About section. Progressive
 * enhancement: only when motion is allowed do we add `.js-reveal` (which hides
 * blocks) and reveal them as they enter view. Under reduced motion, nothing
 * happens and blocks stay visible.
 */
function initContactReveal() {
  const column = document.querySelector('#contact .contact-signal');
  if (!column) return;

  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    column.classList.remove('js-reveal');
    return;
  }

  column.classList.add('js-reveal');

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  // Skip the hero/ident block — it stays visible immediately so the tune-in
  // plays against a present card (CSS keeps it un-hidden under .js-reveal).
  column
    .querySelectorAll('.contact-block:not(.contact-ident)')
    .forEach((block) => revealObserver.observe(block));
}

/**
 * Tune the test card in on entry: a brief signal-lock glitch + sound, like the
 * channel locking. The visual is skipped under reduced motion; the sound is
 * gated by the global mute state inside playSignalLock.
 */
function playTuneIn() {
  const card = document.querySelector('#contact .contact-testcard');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (card && !reduce) {
    card.classList.add('is-tuning');
    setTimeout(() => card.classList.remove('is-tuning'), 520);
  }
  playSignalLock();
}

/**
 * Pulse every outbound line — used by the /ping-all terminal command.
 */
export function pingDirectoryLines() {
  const lines = document.querySelectorAll('#contact .contact-out');
  lines.forEach((line, i) => {
    setTimeout(() => {
      line.classList.add('pinged');
      setTimeout(() => line.classList.remove('pinged'), 600);
    }, i * 100);
  });
}

/**
 * Submit a message to Formspree.
 * @param {{email:string,subject:string,message:string}} payload
 * @returns {Promise<void>}
 * @throws {Error} on network failure or server rejection
 */
export async function submitContactMessage({ email, subject, message }) {
  if (!FORMSPREE_ENDPOINT || FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
    throw new Error('Form endpoint not configured. Set FORMSPREE_ENDPOINT in contact.js.');
  }

  const body = new FormData();
  body.append('email', email);
  body.append('_replyto', email);
  body.append('subject', subject);
  body.append('_subject', `[CALLSIGN] ${subject}`);
  body.append('message', message);

  let res;
  try {
    res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body,
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error('Network error. Check connection and retry.');
  }

  if (!res.ok) {
    let msg = `Server rejected (${res.status}).`;
    try {
      const data = await res.json();
      if (data && Array.isArray(data.errors) && data.errors.length) {
        msg = data.errors.map((e) => e.message || String(e)).join('; ');
      }
    } catch {
      /* non-JSON body — keep default msg */
    }
    throw new Error(msg);
  }
}

/**
 * Initialize the P.500 CALLSIGN page. Called when #contact becomes active.
 * @param {{showOSD?:Function, showSection?:Function}} ctx
 */
export function initContact(ctx = {}) {
  startClock();
  setupCopyEmail(ctx.showOSD);
  setupSectionNav(ctx.showSection);
  initContactReveal();
  playTuneIn();
}

/**
 * Stop timers and observers. Called on section exit.
 */
export function cleanupContact() {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }
}
