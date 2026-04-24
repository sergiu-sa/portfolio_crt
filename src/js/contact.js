/**
 * Contact Module (P.500 — CALLSIGN)
 * Live Oslo clock, copy-to-clipboard for the primary line,
 * directory ping animation, Formspree message submission,
 * and fastext footer wiring.
 */

// ============================================

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzddenv';

const PRIMARY_EMAIL = 'sergiudsarbu@gmail.com';

let clockTimer = null;

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
  renderClockInto(document.getElementById('contact-stat-time'), time);
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

function setupFastextFooter(showSection) {
  document.querySelectorAll('#contact .contact-fastext[data-section]').forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = 'true';
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-section');
      if (target && typeof showSection === 'function') showSection(target);
    });
  });
}

/**
 * Pulse every directory line — used by the /ping-all terminal command.
 */
export function pingDirectoryLines() {
  const lines = document.querySelectorAll('#contact .contact-line');
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
 * Wire the visible compose form. Submits through submitContactMessage
 * (same Formspree path as the /message terminal wizard). Status feedback
 * is rendered inline under the form.
 */
function setupComposeForm() {
  const form = document.getElementById('contact-form');
  if (!form || form.dataset.wired) return;
  form.dataset.wired = 'true';

  const statusEl = document.getElementById('contact-form-status');
  const submitBtn = document.getElementById('contact-form-submit');
  const emailInput = document.getElementById('contact-form-email');
  const subjectInput = document.getElementById('contact-form-subject');
  const messageInput = document.getElementById('contact-form-message');
  const honeypot = form.querySelector('input[name="_gotcha"]');

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    if (kind) statusEl.dataset.kind = kind;
    else delete statusEl.dataset.kind;
  }

  // Enter in subject → advance to message (textarea still takes newlines as expected)
  subjectInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      messageInput?.focus();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Spam honeypot — bots fill hidden fields; treat as silent success.
    if (honeypot && honeypot.value) {
      setStatus('[OK] Message received. I will get back to you.', 'ok');
      form.reset();
      return;
    }

    const payload = {
      email: emailInput.value.trim(),
      subject: subjectInput.value.trim(),
      message: messageInput.value.trim(),
    };

    if (!payload.email || !payload.subject || !payload.message) {
      setStatus('[ERROR] Fill every field before transmitting.', 'error');
      return;
    }

    submitBtn.disabled = true;
    setStatus('[TRANSMITTING] ......', 'prompt');

    try {
      await submitContactMessage(payload);
      setStatus('[OK] Message received. I will get back to you.', 'ok');
      form.reset();
    } catch (err) {
      const msg = err && err.message ? err.message : 'Transmission failed.';
      setStatus(`[ERROR] ${msg}`, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/**
 * Initialize the P.500 CALLSIGN page. Called when #contact becomes active.
 * @param {{showOSD?:Function, showSection?:Function}} ctx
 */
export function initContact(ctx = {}) {
  startClock();
  setupCopyEmail(ctx.showOSD);
  setupFastextFooter(ctx.showSection);
  setupComposeForm();
}

/**
 * Stop timers. Called on section exit.
 */
export function cleanupContact() {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}
