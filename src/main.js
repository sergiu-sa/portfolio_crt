/**
 *
 * CRT Portfolio - A nostalgic retro TV experience
 */

// Module imports
import { projects } from './data/projects.js';
import { skills } from './data/skills.js';
import { initSoundSystem, isSoundEnabled, playNavigationClick, playStaticBurst, toggleSound, playCRTPowerOff, playCRTTurnOn } from './js/audio.js';
import {
  initChannelSystem,
  setChannel,
  prevChannel,
  nextChannel,
  getYtPlayer,
  setSoundEnabledChecker,
  setTvPowered,
  getCurrentChannel,
} from './js/channels.js';
import { initTerminal, triggerTerminalSequence, startConsoleIntro } from './js/terminal.js';
import { initContact, cleanupContact } from './js/contact.js';
import {
  initProjectsSection,
  cleanupProjects,
  setProjectsCallbacks,
  showProjectView,
} from './js/projectsView.js';
import { stopBreakout } from './js/breakout.js';
import { stopTuner } from './js/tuner.js';
import { initRedesignNotice } from './js/notice.js';

// ============================================
// GLOBAL STATE
// ============================================

// DOM references
const sections = document.querySelectorAll('.channel-screen');
const navButtons = document.querySelectorAll('nav button');

// Glitch transition state
let initialLoadDone = false;
let glitchTimeout = null;
let switchTimeout = null;

// Section currently on screen — the comparison that makes routing idempotent
let currentSection = null;

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
 * Toggle CRT TV power with authentic shutdown/startup animation.
 * Media lifecycle is delegated to channels.js via `setTvPowered` +`setChannel`;
 * that way nothing starts (or stays playing) while off.
 */
function toggleCRTPower() {
  const tvScreen = document.getElementById('tv-screen');
  const powerBtn = document.getElementById('remote-power');

  if (!tvScreen) return;

  if (tvPoweredOn) {
    // Turn OFF: mark off, then setChannel to stop every channel's media.
    tvPoweredOn = false;
    playCRTPowerOff();

    setTvPowered(false);
    setChannel(getCurrentChannel()); // stops slideshow/webcam/YT/canvas; no sound, no start

    tvScreen.classList.add('crt-turning-off');
    powerBtn?.classList.add('tv-off');
    document.body.classList.add('tv-powered-off');

    setTimeout(() => {
      tvScreen.classList.remove('crt-turning-off');
      tvScreen.classList.add('crt-off');
    }, 600);
  } else {
    // Turn ON: mark on, then setChannel to resume the current channel's media.
    tvPoweredOn = true;
    playCRTTurnOn();

    setTvPowered(true);
    setChannel(getCurrentChannel(), { showOSD, triggerFlicker: triggerChannelFlicker });

    tvScreen.classList.remove('crt-off');
    tvScreen.classList.add('crt-turning-on');
    powerBtn?.classList.remove('tv-off');
    document.body.classList.remove('tv-powered-off');

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
  currentSection = section;

  // Keep the hash authoritative even for callers that reach here without going through  routeFromHash.
  // Written after currentSection is set, so the hashchange this triggers finds the state already applied and no-ops.
  if (parseHash(window.location.hash).section !== section) {
    window.location.hash = `#${section}`;
  }

  // Cleanup active modules
  cleanupProjects();
  cleanupContact();

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
    initContact({ showOSD, showSection });
    triggerTerminalSequence();
    startConsoleIntro();
  }

  if (section === 'projects') {
    // Derive the view from the hash that was just reconciled above, not from whatever project the module last rendered.
    initProjectsSection(parseHash(window.location.hash).projectId);
  }
}

// ============================================
// HASH ROUTING
// ============================================

const VALID_SECTIONS = ['intro', 'projects', 'about', 'contact'];

/**
 * Parse the URL hash into a section and optional project id.
 * An empty hash is the intro. A non-empty hash naming no known section is not a route at all — the skip link writes `#main-content`, and in-page anchors would do the same — so it resolves to `null` and the caller decides.
 * @param {string} hash
 * @returns {{section: string|null, projectId: string|null}}
 */
function parseHash(hash) {
  const clean = (hash || '').replace(/^#/, '');
  if (!clean) return { section: 'intro', projectId: null };

  const [section, projectId] = clean.split('/');
  if (!VALID_SECTIONS.includes(section)) return { section: null, projectId: null };

  return { section, projectId: projectId || null };
}

/**
 * Apply the current hash to the UI.
 * Idempotent — routing to the state already on screen does nothing, which is what stops a write/event loop and keeps showSection from re-firing its glitch and static burst on a redundant route.
 */
function routeFromHash() {
  const { section, projectId } = parseHash(window.location.hash);

  // A hash that names no section is left alone rather than treated as intro:
  // the skip link sets `#main-content`, and yanking a keyboard user out of the section they are reading is worse than a stale URL.
  // The intro fallback only applies to the very first route, when nothing has been shown yet.
  if (section === null) {
    if (currentSection !== null) return;
    showSection('intro');
    return;
  }

  if (section !== currentSection) {
    showSection(section);
  }

  if (section === 'projects') {
    showProjectView(projectId);
  }
}

/**
 * Capability groups for the About page;
 * maps skills.js `tier` values to display group labels, in render order.
 */
const CAP_GROUPS = [
  { tier: 'strong', label: 'Core' },
  { tier: 'working', label: 'Working with' },
  { tier: 'learning', label: 'Learning' },
];

let aboutRevealObserver = null;

/**
 * Initialize the About section:
 * render capabilities from the single skills source, set the live project count, wire in-app nav links, and attach the scroll-driven reveal (progressive enhancement).
 */
function initAboutSection() {
  const countEl = document.getElementById('about-project-count');
  if (countEl) {
    countEl.textContent = String(projects.length);
  }

  renderCapabilities();
  wireAboutNav();
  wireAboutMusic();
  initAboutReveal();
}

/** Render capabilities grouped by tier into #about-caps. */
function renderCapabilities() {
  const container = document.getElementById('about-caps');
  if (!container) return;

  container.innerHTML = CAP_GROUPS.map((group) => {
    const items = skills.filter((s) => s.tier === group.tier);
    if (!items.length) return '';
    const list = items.map((s) => `<li class="about-caps-item">${s.name}</li>`).join('');
    return `
        <div class="about-caps-group">
          <span class="about-caps-group-label">${group.label}</span>
          <ul class="about-caps-items">${list}</ul>
        </div>`;
  }).join('');
}

/** Wire any in-panel [data-section] control (e.g. the Contact route) to the router. */
function wireAboutNav() {
  document.querySelectorAll('#about [data-section]').forEach((el) => {
    if (el.dataset.wired) return;
    el.dataset.wired = 'true';
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-section');
      if (target) {
        playNavigationClick();
        showSection(target);
      }
    });
  });
}

/** Toggle the Spotify playlists panel from its inline bio trigger. */
function wireAboutMusic() {
  const toggle = document.querySelector('#about .about-music-toggle');
  const panel = document.getElementById('about-music');
  if (!toggle || !panel || toggle.dataset.wired) return;
  toggle.dataset.wired = 'true';
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
  });
}

/**
 * Scroll-driven reveal.
 * Progressive enhancement:
 * only when motion is allowed do we add `.js-reveal` (which hides blocks) and reveal them as they enterview.
 * Under prefers-reduced-motion we do nothing, so blocks stay visible.
 */
function initAboutReveal() {
  const column = document.querySelector('#about .about-signoff');
  if (!column) return;

  if (aboutRevealObserver) {
    aboutRevealObserver.disconnect();
    aboutRevealObserver = null;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    column.classList.remove('js-reveal');
    return;
  }

  column.classList.add('js-reveal');

  aboutRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          aboutRevealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  column.querySelectorAll('.about-block').forEach((block) => aboutRevealObserver.observe(block));
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
      window.location.hash = `#${section}`;
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

  // Remote home button — return to the "start state": intro section + CH01.
  // This also clears any immersive channel body class (news/commercial), so the intro headline is visible again.
  const remoteHome = document.getElementById('remote-home');
  if (remoteHome) {
    remoteHome.addEventListener('click', () => {
      window.location.hash = '#intro';
      setChannel(1, { showOSD, triggerFlicker: triggerChannelFlicker });
    });
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
  // Initialize channel system
  initChannelSystem();
  setSoundEnabledChecker(isSoundEnabled);

  // Set callbacks for the projects view
  setProjectsCallbacks({ showOSD });

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

  // Set initial channel, then let the URL decide which section to show
  setChannel(1, { showOSD, triggerFlicker: triggerChannelFlicker });
  window.addEventListener('hashchange', routeFromHash);
  routeFromHash();

  // First-visit "site mid-redesign" notice (temporary)
  initRedesignNotice();
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', init);
