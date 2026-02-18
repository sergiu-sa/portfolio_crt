/**
 * Main Application Entry Point
 * CRT Portfolio - A nostalgic retro TV experience
 */

// Module imports
import { decryptedText, cleanupDecryptedText } from './js/decryptedText.js';
import { initSoundSystem, isSoundEnabled, playNavigationClick, playStaticBurst, toggleSound, playCRTPowerOff, playCRTTurnOn } from './js/audio.js';
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
import { stopBreakout } from './js/breakout.js';
import { stopTuner } from './js/tuner.js';

// ============================================
// GLOBAL STATE
// ============================================

// DOM references
const sections = document.querySelectorAll('.channel-screen');
const navButtons = document.querySelectorAll('nav button');
const typewriter = document.getElementById('typewriter-line');
const typeText = '> Developer. Explorer. Problem-solver.';
let typewriterIndex = 0;

// Glitch transition state
let initialLoadDone = false;
let glitchTimeout = null;
let switchTimeout = null;

// Screen dim state
const DIM_LEVELS = ['off', 'dim', 'blackout'];
let dimLevel = localStorage.getItem('crtDimLevel') || 'off';

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
// CRT POWER TOGGLE
// ============================================

let tvPoweredOn = true;

/**
 * Toggle CRT TV power with authentic shutdown/startup animation
 */
function toggleCRTPower() {
  const tvScreen = document.getElementById('tv-screen');
  const powerBtn = document.getElementById('remote-power');
  const ytPlayer = getYtPlayer();

  if (!tvScreen) return;

  if (tvPoweredOn) {
    // Turn OFF the TV
    tvPoweredOn = false;

    // Play power-off sound
    playCRTPowerOff();

    // Mute YouTube player if active
    if (ytPlayer && typeof ytPlayer.mute === 'function') {
      ytPlayer.mute();
    }

    // Stop fullscreen canvas channels
    if (document.body.classList.contains('tuner-active')) {
      stopTuner();
    }
    if (document.body.classList.contains('breakout-active')) {
      stopBreakout();
    }

    // Add turning-off animation class
    tvScreen.classList.add('crt-turning-off');
    powerBtn?.classList.add('tv-off');
    document.body.classList.add('tv-powered-off');

    // After animation, set to fully off state
    setTimeout(() => {
      tvScreen.classList.remove('crt-turning-off');
      tvScreen.classList.add('crt-off');
    }, 600);

  } else {
    // Turn ON the TV
    tvPoweredOn = true;

    // Play power-on sound
    playCRTTurnOn();

    // Unmute YouTube player if sound is enabled
    if (ytPlayer && typeof ytPlayer.unMute === 'function' && isSoundEnabled()) {
      ytPlayer.unMute();
    }

    // Remove off state and add turning-on animation
    tvScreen.classList.remove('crt-off');
    tvScreen.classList.add('crt-turning-on');
    powerBtn?.classList.remove('tv-off');
    document.body.classList.remove('tv-powered-off');

    // After animation, remove animation class
    setTimeout(() => {
      tvScreen.classList.remove('crt-turning-on');
    }, 500);
  }
}

// ============================================
// SCREEN DIM TOGGLE
// ============================================

/**
 * Apply current dim level to body classes
 */
function applyDim() {
  document.body.classList.remove('screen-dim', 'screen-blackout');
  if (dimLevel === 'dim') document.body.classList.add('screen-dim');
  else if (dimLevel === 'blackout') document.body.classList.add('screen-blackout');
}

/**
 * Cycle through dim levels: off → dim → blackout → off
 */
function cycleDim() {
  const idx = DIM_LEVELS.indexOf(dimLevel);
  dimLevel = DIM_LEVELS[(idx + 1) % DIM_LEVELS.length];
  localStorage.setItem('crtDimLevel', dimLevel);
  applyDim();
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
 * Show a section with CRT glitch transition
 * @param {string} section - Section ID to show
 */
function showSection(section) {
  const glitch = document.getElementById('glitch-transition');

  // If breakout game or tuner is active, stop it so sections become visible again
  if (document.body.classList.contains('breakout-active')) {
    stopBreakout();
  }
  if (document.body.classList.contains('tuner-active')) {
    stopTuner();
  }

  // Cancel any pending transition
  clearTimeout(glitchTimeout);
  clearTimeout(switchTimeout);

  // Skip glitch on initial page load
  if (!initialLoadDone) {
    initialLoadDone = true;
    switchToSection(section);
    return;
  }

  // Trigger glitch overlay
  if (glitch) {
    glitch.classList.remove('active');
    void glitch.offsetWidth;
    glitch.classList.add('active');
  }

  // Play static burst audio
  playStaticBurst(0.3, 0.12);

  // Switch content behind the glitch overlay
  switchTimeout = setTimeout(() => switchToSection(section), 150);

  // Clean up glitch overlay after animation
  glitchTimeout = setTimeout(() => {
    if (glitch) glitch.classList.remove('active');
  }, 450);
}

/**
 * Perform the actual section switch
 * @param {string} section - Section ID to show
 */
function switchToSection(section) {
  // Cleanup active modules
  stopProjectSlideshow();
  cleanupTeletext();
  cleanupDecryptedText();

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

  // Channel controls - rocker buttons
  const channelPrev = document.getElementById('channel-prev');
  const channelNext = document.getElementById('channel-next');

  if (channelPrev) {
    channelPrev.addEventListener('click', () => prevChannel(channelCallbacks));
  }
  if (channelNext) {
    channelNext.addEventListener('click', () => nextChannel(channelCallbacks));
  }

  // Remote home button
  const remoteHome = document.getElementById('remote-home');
  if (remoteHome) {
    remoteHome.addEventListener('click', () => showSection('intro'));
  }

  // Remote power button - CRT power off/on effect
  const remotePower = document.getElementById('remote-power');
  if (remotePower) {
    remotePower.addEventListener('click', toggleCRTPower);
  }

  // Remote dim button - screen brightness toggle
  const remoteDim = document.getElementById('remote-dim');
  if (remoteDim) {
    remoteDim.addEventListener('click', cycleDim);
  }

  // Easter egg buttons
  const pingAll = document.getElementById('ping-all');

  if (pingAll) {
    pingAll.addEventListener('click', () => {
      showOSD('PING ALL');
      document.querySelectorAll('.contact-card').forEach((card, i) => {
        setTimeout(() => {
          card.classList.add('pinged');
          setTimeout(() => card.classList.remove('pinged'), 600);
        }, i * 100);
      });
    });
  }

  // Keyboard shortcuts modal
  setupShortcutsModal();
}

/**
 * Set up keyboard shortcuts modal and global keyboard shortcuts
 */
function setupShortcutsModal() {
  const keyboardHintBtn = document.getElementById('remote-keyboard-hint');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const fastextClose = document.querySelector('.fastext-btn[data-action="close"]');

  // Open modal via ? button on remote
  if (keyboardHintBtn && shortcutsModal) {
    keyboardHintBtn.addEventListener('click', () => {
      shortcutsModal.classList.add('active');
    });
  }

  // Close via fastext red button
  if (fastextClose && shortcutsModal) {
    fastextClose.addEventListener('click', () => {
      shortcutsModal.classList.remove('active');
    });
  }

  if (shortcutsModal) {
    // Close on backdrop click
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) {
        shortcutsModal.classList.remove('active');
      }
    });
  }

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const isModalOpen = shortcutsModal?.classList.contains('active');

    // ESC - Close modal
    if (e.key === 'Escape' && isModalOpen) {
      shortcutsModal.classList.remove('active');
      return;
    }

    // Don't process other shortcuts if modal is open
    if (isModalOpen) return;

    // ? - Open help modal
    if (e.key === '?' && shortcutsModal) {
      e.preventDefault();
      shortcutsModal.classList.add('active');
      return;
    }

    // M - Toggle sound
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleSound(getYtPlayer());
      return;
    }

    // D - Cycle screen dim
    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      cycleDim();
      return;
    }

    // P - Toggle TV power
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      toggleCRTPower();
      return;
    }
  });
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
function init() {
  // Set dynamic year in splash footer
  const splashYear = document.getElementById('splash-year');
  if (splashYear) splashYear.textContent = new Date().getFullYear();

  // First-visit splash screen
  const splashSeen = localStorage.getItem('crtSplashSeen') === 'true';
  const splash = document.getElementById('splash-screen');
  const splashBtn = document.getElementById('splash-dismiss');

  if (splashSeen && splash) {
    splash.remove();
  } else if (splash && splashBtn) {
    function dismissSplash() {
      splash.classList.add('hidden');
      localStorage.setItem('crtSplashSeen', 'true');
      splash.addEventListener('transitionend', () => splash.remove(), { once: true });
      document.removeEventListener('keydown', splashKey);
    }

    function splashKey(e) {
      if (e.key === 'Escape') {
        dismissSplash();
      }
    }

    splashBtn.addEventListener('click', dismissSplash);
    document.addEventListener('keydown', splashKey);
  }

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

  // Apply saved dim preference
  applyDim();

  // Initialize date display
  updateDate();
  setInterval(updateDate, 60000);

  // Set initial channel and show intro
  setChannel(1, { showOSD, triggerFlicker: triggerChannelFlicker });
  showSection('intro');
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', init);
