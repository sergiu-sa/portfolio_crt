/**
 * Main Application Entry Point
 * CRT Portfolio - A nostalgic retro TV experience
 */

// Module imports
import { decryptedText } from './js/decryptedText.js';
import { initSoundSystem, isSoundEnabled, playNavigationClick } from './js/audio.js';
import {
  initChannelSystem,
  setChannel,
  prevChannel,
  nextChannel,
  getYtPlayer,
  setSoundEnabledChecker,
} from './js/channels.js';
import { initTerminal, triggerTerminalSequence, startConsoleIntro } from './js/terminal.js';
import {
  initProjectChannelSystem,
  cleanupTeletext,
  setTeletextCallbacks,
  stopProjectSlideshow,
} from './js/teletext.js';

// ============================================
// GLOBAL STATE
// ============================================

let galleryIntervals = [];
let dateInterval = null;

// DOM references
const sections = document.querySelectorAll('.channel-screen');
const navButtons = document.querySelectorAll('nav button');
const typewriter = document.getElementById('typewriter-line');
const typeText = '> Developer. Explorer. Problem-solver.';
let typewriterIndex = 0;

// ============================================
// UI EFFECTS
// ============================================

/**
 * Show On-Screen Display indicator
 * @param {string} text - Text to display
 */
function showOSD(text) {
  const osd = document.getElementById('channel-indicator');
  const osdText = document.getElementById('osd-channel');

  if (!osd || !osdText) return;

  osdText.textContent = text;
  osd.classList.remove('show');

  // Force reflow to restart animation
  void osd.offsetWidth;

  osd.classList.add('show');

  setTimeout(() => {
    osd.classList.remove('show');
  }, 2000);
}

/**
 * Trigger channel switch flicker effect
 */
function triggerChannelFlicker() {
  const flicker = document.getElementById('channel-flicker');
  if (!flicker) return;

  flicker.style.animation = 'channelGlitch 0.4s ease-out';
  flicker.style.opacity = '1';

  setTimeout(() => {
    flicker.style.animation = 'none';
    flicker.style.opacity = '0';
  }, 400);
}

// ============================================
// TYPEWRITER EFFECT
// ============================================

/**
 * Animate typewriter text effect
 */
function typeWriterEffect() {
  if (!typewriter) return;
  if (typewriterIndex < typeText.length) {
    typewriter.textContent += typeText.charAt(typewriterIndex);
    typewriterIndex++;
    setTimeout(typeWriterEffect, 50);
  }
}

// ============================================
// SECTION NAVIGATION
// ============================================

/**
 * Show a specific section/screen
 * @param {string} section - Section ID to show
 */
function showSection(section) {
  // Clear gallery intervals
  galleryIntervals.forEach((interval) => clearInterval(interval));
  galleryIntervals = [];

  // Stop project slideshow
  stopProjectSlideshow();

  // Cleanup teletext when leaving projects
  cleanupTeletext();

  // Hide all sections
  sections.forEach((s) => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  // Show target section
  const target = document.getElementById(section);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('active');
  }

  // Section-specific initialization
  if (section === 'about') {
    initAboutSection();
  }

  if (section === 'contact') {
    triggerTerminalSequence();
    startConsoleIntro();
    refreshFadeInObserver();
  }

  if (section === 'projects') {
    initProjectChannelSystem();
  }
}

/**
 * Initialize the about section with animations
 */
function initAboutSection() {
  if (typewriter) {
    typewriter.textContent = '> ';
    typewriterIndex = 0;
    setTimeout(typeWriterEffect, 300);
  }

  const aboutText = document.getElementById('about-text');
  if (aboutText) {
    aboutText.textContent = '';
    decryptedText({
      elementId: 'about-text',
      text: [
        `I'm a front-end developer, creative explorer, and occasional chaos mechanic with a mind wired for problem-solving.`,
        `My work usually begins with a feeling. Sometimes it's curiosity, other times it's tension or instinct. I build through trial and error, letting the process guide the result rather than forcing it into place.`,
        `Creating something new, even if it's strange or unfinished, is where I feel most at home. If it feels honest or unexpectedly useful, I know I'm moving in the right direction.`,
        `Lately I've been exploring how people interact with AI, how digital tools can support mental clarity, and how retro aesthetics can inspire modern expression. This portfolio is one of those experiments.`,
      ],
      speed: 15,
      revealDirection: 'start',
    });
  }
}

// ============================================
// FADE-IN OBSERVER
// ============================================

const fadeInObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

// Observe all fade-in elements
document.querySelectorAll('.fade-in').forEach((el) => fadeInObserver.observe(el));

/**
 * Refresh fade-in observer for dynamically added elements
 */
function refreshFadeInObserver() {
  document.querySelectorAll('.fade-in').forEach((el) => {
    fadeInObserver.observe(el);
  });
}

// ============================================
// DATE DISPLAY
// ============================================

/**
 * Update the date display in the header
 */
function updateDate() {
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const now = new Date();
  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    dateEl.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Callback object for channel system
  const channelCallbacks = { showOSD, triggerFlicker: triggerChannelFlicker };

  // Navigation buttons
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      playNavigationClick();
      showSection(section);
    });
  });

  // Channel controls
  const channelPrev = document.getElementById('channel-prev');
  const channelNext = document.getElementById('channel-next');

  if (channelPrev) {
    channelPrev.addEventListener('click', () => prevChannel(channelCallbacks));
  }
  if (channelNext) {
    channelNext.addEventListener('click', () => nextChannel(channelCallbacks));
  }

  // Home link
  const homeLink = document.getElementById('home-link');
  if (homeLink) {
    homeLink.addEventListener('click', () => showSection('intro'));
  }

  // Easter egg buttons
  const pingAll = document.getElementById('ping-all');
  const powerOff = document.getElementById('power-off');

  if (pingAll) {
    pingAll.addEventListener('click', () => {
      alert('[SYSTEM] All contact protocols pinged. Awaiting response...');
    });
  }

  if (powerOff) {
    powerOff.addEventListener('click', () => {
      document.body.classList.toggle('power-off');
    });
  }

  // Escape key to exit power-off mode
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('power-off')) {
      document.body.classList.remove('power-off');
    }
  });

  // Keyboard shortcuts modal
  setupShortcutsModal();
}

/**
 * Set up keyboard shortcuts modal
 */
function setupShortcutsModal() {
  const keyboardHintBtn = document.getElementById('keyboard-hint');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const modalClose = document.querySelector('.modal-close');

  if (keyboardHintBtn && shortcutsModal) {
    keyboardHintBtn.addEventListener('click', () => {
      shortcutsModal.classList.add('active');
    });
  }

  if (modalClose && shortcutsModal) {
    modalClose.addEventListener('click', () => {
      shortcutsModal.classList.remove('active');
    });
  }

  if (shortcutsModal) {
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) {
        shortcutsModal.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && shortcutsModal.classList.contains('active')) {
        shortcutsModal.classList.remove('active');
      }
    });
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
function init() {
  // Initialize channel system
  initChannelSystem();
  setSoundEnabledChecker(isSoundEnabled);

  // Set callbacks for teletext
  setTeletextCallbacks({ showOSD, triggerFlicker: triggerChannelFlicker });

  // Initialize terminal
  initTerminal();

  // Initialize sound system with YouTube player getter
  initSoundSystem(getYtPlayer);

  // Set up event listeners
  setupEventListeners();

  // Initialize date display
  updateDate();
  dateInterval = setInterval(updateDate, 60000);

  // Set initial channel and show intro
  setChannel(1, { showOSD, triggerFlicker: triggerChannelFlicker });
  showSection('intro');
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', init);
