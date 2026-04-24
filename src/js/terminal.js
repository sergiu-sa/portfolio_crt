/**
 * Terminal Module (P.500 — CALLSIGN console)
 * Command-line UI, /message compose wizard, command chips,
 * and boot sequence. Commands either open an external link,
 * print a response, or drive the compose state machine.
 */

import { playTypingSound } from './audio.js';
import { submitContactMessage, pingDirectoryLines } from './contact.js';

const MAX_TERMINAL_LINES = 80;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let terminalOutput = null;
let contactInput = null;
let contactIntroPlayed = false;

// Command history for ArrowUp/ArrowDown nav
const commandHistory = [];
let historyIndex = -1;

// Compose wizard state machine
const WIZARD = {
  IDLE: 'idle',
  EMAIL: 'email',
  SUBJECT: 'subject',
  BODY: 'body',
  SENDING: 'sending',
};

const wizard = {
  state: WIZARD.IDLE,
  from: '',
  subject: '',
  body: [],
};

const COMMANDS = {
  '/email': {
    response: '[MAIL] Opening email client...',
    action: () => (window.location.href = 'mailto:sergiudsarbu@gmail.com'),
  },
  '/github': {
    response: '[GIT] Opening GitHub...',
    action: () => window.open('https://github.com/sergiu-sa', '_blank', 'noopener,noreferrer'),
  },
  '/linkedin': {
    response: '[NETWORK] Opening LinkedIn...',
    action: () =>
      window.open(
        'https://www.linkedin.com/in/sergiu-sarbu-39154226a',
        '_blank',
        'noopener,noreferrer'
      ),
  },
  '/instagram': {
    response: '[MEDIA] Opening Instagram...',
    action: () =>
      window.open('https://www.instagram.com/sergiu_sarbu_/', '_blank', 'noopener,noreferrer'),
  },
  '/ping': {
    response: '[SIGNAL] Contact signal sent successfully!',
    kind: 'ok',
  },
  '/ping-all': {
    response: '[BROADCAST] Pinging all outbound lines...',
    kind: 'ok',
    action: pingDirectoryLines,
  },
  '/clear': { special: 'clear' },
  '/message': { special: 'message' },
  '/help': {
    response: [
      '[HELP] AVAILABLE COMMANDS',
      '  /email       open primary email line',
      '  /message     compose a message (in-console)',
      '  /github      open GitHub',
      '  /linkedin    open LinkedIn',
      '  /instagram   open Instagram',
      '  /ping        send a contact signal',
      '  /ping-all    pulse every outbound line',
      '  /clear       clear the console',
      '  /help        show this list',
    ].join('\n'),
    kind: 'prompt',
  },
};

function trimTerminalOutput() {
  while (terminalOutput && terminalOutput.children.length > MAX_TERMINAL_LINES) {
    terminalOutput.removeChild(terminalOutput.firstChild);
  }
}

/**
 * Append a single terminal line. `immediate:true` skips the typewriter.
 */
function appendLine(text, { kind, immediate } = {}) {
  if (!terminalOutput) return;
  const line = document.createElement('div');
  line.classList.add('terminal-line');
  if (kind) line.dataset.kind = kind;
  terminalOutput.appendChild(line);

  if (immediate) {
    line.textContent = text;
    trimTerminalOutput();
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    return;
  }

  let i = 0;
  const speed = 15;
  (function typeChar() {
    if (i < text.length) {
      line.textContent += text.charAt(i);
      i++;
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
      setTimeout(typeChar, speed);
    } else {
      trimTerminalOutput();
    }
  })();
}

function printCommandEcho(cmd) {
  appendLine(`> ${cmd}`, { immediate: true });
}

function printResponse(msg, { kind } = {}) {
  const lines = String(msg).split('\n');
  lines.forEach((line, i) => {
    setTimeout(() => appendLine(line, { kind }), i * 40);
  });
}

function clearOutput() {
  if (!terminalOutput) return;
  while (terminalOutput.firstChild) terminalOutput.removeChild(terminalOutput.firstChild);
}

function resetWizard() {
  wizard.state = WIZARD.IDLE;
  wizard.from = '';
  wizard.subject = '';
  wizard.body = [];
  if (contactInput) contactInput.placeholder = 'Type /help';
}

function startCompose() {
  if (wizard.state !== WIZARD.IDLE) {
    appendLine('[COMPOSE] Already in progress. Use /cancel to abort.', {
      immediate: true,
      kind: 'error',
    });
    return;
  }
  wizard.state = WIZARD.EMAIL;
  if (contactInput) contactInput.placeholder = 'your@email.com';
  appendLine('[COMPOSE] Step 1/3 — your email:', { immediate: true, kind: 'prompt' });
}

/**
 * Handle input while the compose wizard is active.
 * Returns true (always) — terminal input is fully delegated to the wizard.
 */
function handleWizardInput(rawInput) {
  const input = rawInput.trim();
  const lower = input.toLowerCase();

  if (lower === '/cancel') {
    appendLine('[COMPOSE] Cancelled.', { immediate: true, kind: 'dim' });
    resetWizard();
    return;
  }

  if (wizard.state === WIZARD.EMAIL) {
    if (!EMAIL_RE.test(input)) {
      appendLine('[ERROR] Invalid email. Try again or type /cancel.', {
        immediate: true,
        kind: 'error',
      });
      return;
    }
    wizard.from = input;
    wizard.state = WIZARD.SUBJECT;
    if (contactInput) contactInput.placeholder = 'subject line';
    appendLine('[COMPOSE] Step 2/3 — subject:', { immediate: true, kind: 'prompt' });
    return;
  }

  if (wizard.state === WIZARD.SUBJECT) {
    if (!input) {
      appendLine('[ERROR] Subject cannot be empty.', { immediate: true, kind: 'error' });
      return;
    }
    wizard.subject = input;
    wizard.state = WIZARD.BODY;
    if (contactInput) contactInput.placeholder = 'your message — /send when done';
    appendLine('[COMPOSE] Step 3/3 — message (/send to transmit, /cancel to abort):', {
      immediate: true,
      kind: 'prompt',
    });
    return;
  }

  if (wizard.state === WIZARD.BODY) {
    if (lower === '/send') {
      if (!wizard.body.length) {
        appendLine('[ERROR] Message is empty. Type at least one line or /cancel.', {
          immediate: true,
          kind: 'error',
        });
        return;
      }
      sendCompose();
      return;
    }
    if (!input) return;
    wizard.body.push(input);
    // Subtle confirmation so users see their line was captured
    appendLine(`  ${input}`, { immediate: true, kind: 'dim' });
    return;
  }
}

async function sendCompose() {
  wizard.state = WIZARD.SENDING;
  appendLine('[TRANSMITTING] ......', { immediate: true, kind: 'prompt' });

  try {
    await submitContactMessage({
      email: wizard.from,
      subject: wizard.subject,
      message: wizard.body.join('\n'),
    });
    appendLine('[OK] Message received. I will get back to you.', {
      immediate: true,
      kind: 'ok',
    });
    resetWizard();
  } catch (err) {
    const msg = err && err.message ? err.message : 'Transmission failed.';
    appendLine(`[ERROR] ${msg}`, { immediate: true, kind: 'error' });
    appendLine('        Retry: /send  ·  Abort: /cancel', { immediate: true, kind: 'dim' });
    wizard.state = WIZARD.BODY; // let the user retry without re-entering everything
  }
}

/**
 * Execute a command — entry point for both typed input and chip clicks.
 */
function runCommand(raw) {
  const cmd = String(raw).trim();
  if (!cmd) return;

  printCommandEcho(cmd);

  // Wizard takes over while active
  if (wizard.state !== WIZARD.IDLE) {
    handleWizardInput(cmd);
    return;
  }

  const lower = cmd.toLowerCase();
  const def = COMMANDS[lower];

  if (!def) {
    appendLine('[ERROR] Unknown command. Type /help for a list.', {
      immediate: true,
      kind: 'error',
    });
    return;
  }

  if (def.special === 'clear') {
    clearOutput();
    return;
  }
  if (def.special === 'message') {
    startCompose();
    return;
  }

  if (typeof def.action === 'function') {
    try {
      def.action();
    } catch {
      /* action failures are non-fatal */
    }
  }
  if (def.response) {
    printResponse(def.response, { kind: def.kind });
  }
}

function submitCommand(inputElement) {
  const command = inputElement.value.trim();
  if (command) {
    runCommand(command);
    commandHistory.push(command);
    historyIndex = commandHistory.length;
  }
  inputElement.value = '';
  inputElement.focus();
}

/**
 * Wire up the terminal: input, submit button, chips, shortcut keys.
 * Safe to call once at app init.
 */
export function initTerminal() {
  contactInput = document.querySelector('#contact .contact-console input');
  const submitBtn = document.querySelector('#console-submit');
  terminalOutput = document.querySelector('#contact .terminal-output');

  if (!contactInput) return;

  contactInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCommand(contactInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        contactInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        contactInput.value = commandHistory[historyIndex];
      } else if (historyIndex === commandHistory.length - 1) {
        historyIndex++;
        contactInput.value = '';
      }
    } else if (e.key === 'Escape' && wizard.state !== WIZARD.IDLE) {
      e.preventDefault();
      appendLine('[COMPOSE] Cancelled.', { immediate: true, kind: 'dim' });
      resetWizard();
      contactInput.value = '';
    }
  });

  if (submitBtn) {
    submitBtn.addEventListener('click', () => submitCommand(contactInput));
  }

  contactInput.addEventListener('input', () => playTypingSound());

  // Command chips: clicking runs the bound command
  document.querySelectorAll('#contact .contact-chip[data-cmd]').forEach((chip) => {
    if (chip.dataset.wired) return;
    chip.dataset.wired = 'true';
    chip.addEventListener('click', () => {
      const cmd = chip.dataset.cmd;
      if (!cmd) return;
      runCommand(cmd);
      contactInput.focus();
    });
  });
}

/**
 * Stagger-reveal any terminal lines already in the DOM.
 * Kept for compatibility with main.js section-entry wiring.
 */
export function triggerTerminalSequence() {
  const lines = document.querySelectorAll('#contact .terminal-line');
  lines.forEach((line, index) => {
    setTimeout(() => line.classList.add('visible'), index * 120);
  });
}

/**
 * First-visit boot sequence: prints a short identify block,
 * then auto-runs /help so the user sees the command list immediately.
 */
export function startConsoleIntro() {
  if (contactIntroPlayed) return;
  contactIntroPlayed = true;
  if (!terminalOutput) return;

  const boot = [
    { text: '[BOOT] CALLSIGN terminal v1.0 ........ OK', kind: 'dim' },
    { text: '[LINK] Establishing uplink to Sergiu .. OK', kind: 'dim' },
    { text: '[READY] Type a command or tap a chip above.', kind: 'ok' },
  ];

  boot.forEach((line, i) => {
    setTimeout(() => appendLine(line.text, { immediate: true, kind: line.kind }), i * 220);
  });

  setTimeout(() => runCommand('/help'), boot.length * 220 + 150);
}
