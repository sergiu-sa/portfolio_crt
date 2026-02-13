/**
 * Terminal Module
 * Handles contact console commands and terminal output
 */

import { playTypingSound } from './audio.js';

// Terminal state
let terminalOutput = null;
let contactIntroPlayed = false;
const MAX_TERMINAL_LINES = 50;

// Command history for arrow key navigation
const commandHistory = [];
let historyIndex = -1;

/**
 * Terminal command definitions
 */
const COMMANDS = {
  '/email': {
    action: () => (window.location.href = 'mailto:sergiudsarbu@gmail.com'),
    response: '[MAIL] Opening email client...',
  },
  '/github': {
    action: () => window.open('https://github.com/sergiu-sa', '_blank'),
    response: '[GIT] Opening GitHub...',
  },
  '/linkedin': {
    action: () => window.open('https://www.linkedin.com/in/sergiu-sarbu-39154226a', '_blank'),
    response: '[NETWORK] Opening LinkedIn...',
  },
  '/instagram': {
    action: () => window.open('https://www.instagram.com/sergiu_sarbu_/', '_blank'),
    response: '[CAMERA] Opening Instagram...',
  },
  '/discord': {
    action: () => window.open('https://discord.com/users/1275872993859342348', '_blank'),
    response: '[CHAT] Opening Discord...',
  },
  '/ping': {
    action: null,
    response: '[SIGNAL] Contact signal sent successfully!',
  },
  '/clear': {
    action: 'clear',
    response: null,
  },
  '/help': {
    action: null,
    response: `[HELP] Available commands:
  /email
  /github
  /linkedin
  /instagram
  /discord
  /ping
  /clear`,
  },
};

/**
 * Print a command to the terminal output
 * @param {string} cmd - Command text
 */
function trimTerminalOutput() {
  while (terminalOutput && terminalOutput.children.length > MAX_TERMINAL_LINES) {
    terminalOutput.removeChild(terminalOutput.firstChild);
  }
}

function printCommand(cmd) {
  if (!terminalOutput) return;
  const line = document.createElement('div');
  line.classList.add('terminal-line');
  line.textContent = `> ${cmd}`;
  terminalOutput.appendChild(line);
  trimTerminalOutput();
}

/**
 * Print a response with typewriter effect
 * @param {string} msg - Message to print
 */
function printResponse(msg) {
  if (!terminalOutput) return;
  const line = document.createElement('div');
  line.classList.add('terminal-line');
  terminalOutput.appendChild(line);

  let i = 0;
  const speed = 20;

  function typeChar() {
    if (i < msg.length) {
      line.textContent += msg.charAt(i);
      i++;
      setTimeout(typeChar, speed);
    } else {
      trimTerminalOutput();
    }
  }
  typeChar();
}

/**
 * Clear terminal output
 */
function clearOutput() {
  if (terminalOutput) {
    terminalOutput.textContent = '';
  }
}

/**
 * Handle a terminal command
 * @param {string} cmd - Command to execute
 */
function handleCommand(cmd) {
  const command = COMMANDS[cmd];

  if (!command) {
    printResponse('[ERROR] Unknown command. Try /help');
    return;
  }

  if (command.action === 'clear') {
    clearOutput();
    return;
  }

  if (command.action) {
    command.action();
  }

  if (command.response) {
    printResponse(command.response);
  }
}

/**
 * Submit command from input field
 * @param {HTMLInputElement} inputElement - The input element
 */
function submitCommand(inputElement) {
  const command = inputElement.value.trim();
  if (command) {
    printCommand(command);
    handleCommand(command.toLowerCase());
    commandHistory.push(command);
    historyIndex = commandHistory.length;
  }
  inputElement.value = '';
  inputElement.focus();
}

/**
 * Initialize the terminal system
 */
export function initTerminal() {
  const contactInput = document.querySelector('#contact .contact-console input');
  const submitBtn = document.querySelector('#console-submit');
  terminalOutput = document.querySelector('#contact .terminal-output');

  if (!contactInput) return;

  // Command input handler (keyboard)
  contactInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
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
    }
  });

  // Submit button handler (touch/click)
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      submitCommand(contactInput);
    });
  }

  // Typing sound on input
  contactInput.addEventListener('input', () => {
    playTypingSound();
  });
}

/**
 * Trigger terminal line reveal sequence
 */
export function triggerTerminalSequence() {
  const lines = document.querySelectorAll('#contact .terminal-line');
  lines.forEach((line, index) => {
    setTimeout(() => {
      line.classList.add('visible');
    }, index * 200);
  });
}

/**
 * Start console intro message (plays once)
 */
export function startConsoleIntro() {
  if (contactIntroPlayed) return;
  contactIntroPlayed = true;

  printResponse('Establishing connection with Sergiu...');
}


