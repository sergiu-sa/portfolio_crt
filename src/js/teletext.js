/**
 * Teletext Module
 * Handles project navigation, lightbox, and teletext-style UI
 */

import { playTeletextBeep } from './audio.js';

// Project data
const projectsData = [
  {
    id: 'square-eyes',
    name: 'Square Eyes',
    tech: 'HTML / CSS',
    description: 'Accessible film streaming site built with clean HTML and CSS.',
    github: 'https://github.com/sergiu-sa/pro-school-react.git',
    live: 'https://sergiu-sa.github.io/pro-school-react/',
    images: ['/assets/projects/square_eyes/new_home02.png']
  },
  {
    id: 'kid-bank',
    name: 'Kid Bank',
    tech: 'JavaScript / API',
    description: 'Banking app for teens with restricted purchases and barcode scanning.',
    github: 'https://github.com/sergiu-sa/kid_bank_.git',
    live: 'https://k1dbank.netlify.app',
    images: [
      '/assets/projects/kid_bank/kid_bank01.png',
      '/assets/projects/kid_bank/kid_bank02.png'
    ]
  },
  {
    id: 'ask-better',
    name: 'Ask Better',
    tech: 'AI / UX',
    description: 'Prompt-engineering app with mood, complexity, and intent refinements.',
    github: 'https://github.com/sergiu-sa/askbetter.git',
    live: 'https://askbetter.netlify.app',
    images: [
      '/assets/projects/ask_better/corporate_basic_01.png',
      '/assets/projects/ask_better/corporate_pro_01.png',
      '/assets/projects/ask_better/coffe_basic_02.png',
      '/assets/projects/ask_better/coffe_pro_02.png',
      '/assets/projects/ask_better/coffe_pro_03.png',
      '/assets/projects/ask_better/forest_basic_01.png',
      '/assets/projects/ask_better/forest_pro_02.png',
      '/assets/projects/ask_better/golden_basic_01.png',
      '/assets/projects/ask_better/golden_pro_01.png',
      '/assets/projects/ask_better/golden_pro_03.png',
      '/assets/projects/ask_better/deep_basic_01.png',
      '/assets/projects/ask_better/deep_pro_01.png',
      '/assets/projects/ask_better/zen_basic01.png',
      '/assets/projects/ask_better/zen_pro_01.png'
    ]
  }
];

// Teletext state
let currentProjectIndex = 0;
let currentProjectImageIndex = 0;
let projectSlideshowInterval = null;
let projectChannelInitialized = false;
let teletextKeyboardHandler = null;
let lightboxOpen = false;

// Callback references
let showOSD = null;
let triggerFlicker = null;

/**
 * Set external callback functions
 * @param {Object} callbacks
 * @param {Function} callbacks.showOSD - Show OSD message
 * @param {Function} callbacks.triggerFlicker - Trigger channel flicker
 */
export function setTeletextCallbacks(callbacks) {
  showOSD = callbacks.showOSD;
  triggerFlicker = callbacks.triggerFlicker;
}

/**
 * Get projects data
 * @returns {Array}
 */
export function getProjectsData() {
  return projectsData;
}

// ============================================
// PROJECT SLIDESHOW
// ============================================

/**
 * Start auto-cycling through project images
 */
function startTeletextImageCycle() {
  stopProjectSlideshow();

  const project = projectsData[currentProjectIndex];
  if (project.images.length <= 1) return;

  projectSlideshowInterval = setInterval(() => {
    currentProjectImageIndex = (currentProjectImageIndex + 1) % project.images.length;

    const previewImg = document.getElementById('teletext-preview-img');
    const imgCurrentEl = document.getElementById('teletext-img-current');

    if (previewImg) previewImg.src = project.images[currentProjectImageIndex];
    if (imgCurrentEl) imgCurrentEl.textContent = currentProjectImageIndex + 1;
  }, 4000);
}

/**
 * Stop project image slideshow
 */
export function stopProjectSlideshow() {
  if (projectSlideshowInterval) {
    clearInterval(projectSlideshowInterval);
    projectSlideshowInterval = null;
  }
}

// ============================================
// PROJECT DISPLAY
// ============================================

/**
 * Show a specific project in the teletext UI
 * @param {number} index - Project index
 */
function showTeletextProject(index) {
  const project = projectsData[index];
  currentProjectIndex = index;
  currentProjectImageIndex = 0;

  if (triggerFlicker) triggerFlicker();
  playTeletextBeep();

  // Show OSD with page number
  const pageNum = 101 + index;
  if (showOSD) showOSD(`P.${pageNum}`);

  // Update DOM elements
  const pageNumEl = document.getElementById('teletext-page-num');
  const titleEl = document.getElementById('teletext-project-title');
  const previewImg = document.getElementById('teletext-preview-img');
  const imgCurrentEl = document.getElementById('teletext-img-current');
  const imgTotalEl = document.getElementById('teletext-img-total');
  const techEl = document.getElementById('teletext-tech');
  const descEl = document.getElementById('teletext-desc');
  const codeLink = document.getElementById('teletext-link-code');
  const liveLink = document.getElementById('teletext-link-live');

  if (pageNumEl) pageNumEl.textContent = pageNum;
  if (titleEl) titleEl.textContent = project.name.toUpperCase();
  if (previewImg) previewImg.src = project.images[0];
  if (imgCurrentEl) imgCurrentEl.textContent = '1';
  if (imgTotalEl) imgTotalEl.textContent = project.images.length;

  if (techEl) {
    techEl.textContent = '';
    const label = document.createElement('span');
    label.className = 'teletext-label';
    label.textContent = 'TECH:';
    techEl.appendChild(label);
    techEl.appendChild(document.createTextNode(' ' + project.tech));
  }

  if (descEl) descEl.textContent = project.description;
  if (codeLink) codeLink.href = project.github;
  if (liveLink) liveLink.href = project.live;

  startTeletextImageCycle();
}

/**
 * Navigate to next/previous project
 * @param {'next'|'prev'} direction
 */
function navigateTeletextProject(direction) {
  if (direction === 'next') {
    currentProjectIndex = (currentProjectIndex + 1) % projectsData.length;
  } else {
    currentProjectIndex = (currentProjectIndex - 1 + projectsData.length) % projectsData.length;
  }
  showTeletextProject(currentProjectIndex);
}

// ============================================
// LIGHTBOX
// ============================================

/**
 * Open the image lightbox
 */
function openLightbox() {
  const project = projectsData[currentProjectIndex];
  const lightbox = document.getElementById('teletext-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCurrent = document.getElementById('lightbox-current');
  const lightboxTotal = document.getElementById('lightbox-total');

  if (!lightbox || !lightboxImg) return;

  stopProjectSlideshow();

  lightboxImg.src = project.images[currentProjectImageIndex];
  if (lightboxCurrent) lightboxCurrent.textContent = currentProjectImageIndex + 1;
  if (lightboxTotal) lightboxTotal.textContent = project.images.length;

  lightbox.classList.add('active');
  lightboxOpen = true;
}

/**
 * Close the image lightbox
 */
function closeLightbox() {
  const lightbox = document.getElementById('teletext-lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    lightboxOpen = false;
    startTeletextImageCycle();
  }
}

/**
 * Navigate within the lightbox
 * @param {'next'|'prev'} direction
 */
function navigateLightbox(direction) {
  const project = projectsData[currentProjectIndex];
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCurrent = document.getElementById('lightbox-current');

  if (direction === 'next') {
    currentProjectImageIndex = (currentProjectImageIndex + 1) % project.images.length;
  } else {
    currentProjectImageIndex = (currentProjectImageIndex - 1 + project.images.length) % project.images.length;
  }

  if (lightboxImg) lightboxImg.src = project.images[currentProjectImageIndex];
  if (lightboxCurrent) lightboxCurrent.textContent = currentProjectImageIndex + 1;

  // Update preview thumbnail
  const previewImg = document.getElementById('teletext-preview-img');
  const imgCurrentEl = document.getElementById('teletext-img-current');
  if (previewImg) previewImg.src = project.images[currentProjectImageIndex];
  if (imgCurrentEl) imgCurrentEl.textContent = currentProjectImageIndex + 1;
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

/**
 * Handle keyboard navigation for teletext
 * @param {KeyboardEvent} e
 */
function handleTeletextKeyboard(e) {
  const projectsSection = document.getElementById('projects');
  if (!projectsSection || !projectsSection.classList.contains('active')) return;

  // Lightbox navigation
  if (lightboxOpen) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateLightbox('prev');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateLightbox('next');
    }
    return;
  }

  // Normal teletext navigation
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    navigateTeletextProject('prev');
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    navigateTeletextProject('next');
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the teletext project system
 */
export function initProjectChannelSystem() {
  if (projectChannelInitialized) return;
  projectChannelInitialized = true;

  // Show first project
  showTeletextProject(0);

  // Keyboard navigation
  teletextKeyboardHandler = handleTeletextKeyboard;
  document.addEventListener('keydown', teletextKeyboardHandler);

  // Touch swipe support
  const teletextContainer = document.querySelector('.teletext-container');
  if (teletextContainer) {
    let touchStartX = 0;

    teletextContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    teletextContainer.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diffX = touchStartX - touchEndX;
      const threshold = 50;

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          navigateTeletextProject('next');
        } else {
          navigateTeletextProject('prev');
        }
      }
    });
  }

  // Preview click to open lightbox
  const previewFrame = document.querySelector('.teletext-preview-frame');
  if (previewFrame) {
    previewFrame.addEventListener('click', openLightbox);
  }

  // Lightbox controls
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightbox = document.getElementById('teletext-lightbox');

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox('prev'));
  if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox('next'));

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Navigation buttons
  const teletextPrev = document.getElementById('teletext-prev');
  const teletextNext = document.getElementById('teletext-next');

  if (teletextPrev) {
    teletextPrev.addEventListener('click', () => navigateTeletextProject('prev'));
  }
  if (teletextNext) {
    teletextNext.addEventListener('click', () => navigateTeletextProject('next'));
  }

  startTeletextImageCycle();
}

/**
 * Cleanup teletext system (when leaving projects section)
 */
export function cleanupTeletext() {
  if (teletextKeyboardHandler) {
    document.removeEventListener('keydown', teletextKeyboardHandler);
    teletextKeyboardHandler = null;
    projectChannelInitialized = false;
  }
  stopProjectSlideshow();
}

/**
 * Check if teletext keyboard handler is active
 * @returns {boolean}
 */
export function isTeletextInitialized() {
  return projectChannelInitialized;
}
