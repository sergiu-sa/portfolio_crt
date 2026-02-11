/**
 * Teletext Module
 * Handles project navigation, lightbox, and teletext-style UI
 */

import { playTeletextBeep } from './audio.js';

// Tag color rotation (teletext fastext palette)
const TAG_COLORS = ['tag-red', 'tag-green', 'tag-yellow', 'tag-blue'];

// Project data
const projectsData = [
  {
    id: 'aucto',
    name: 'Aucto',
    tags: ['TypeScript', 'Tailwind', 'API'],
    year: '2025',
    status: 'LIVE',
    description:
      'Brutalist auction platform with real-time bidding, JWT auth, and credit management via Noroff API v2.',
    github: 'https://github.com/sergiu-sa/auction_house_sp2',
    live: 'https://auctohouse.netlify.app/',
    images: [
      '/assets/projects/aucto/aucto_intro.gif',
      '/assets/projects/aucto/b_aucto_feed.png',
      '/assets/projects/aucto/c_aucto_item.png',
      '/assets/projects/aucto/d_aucto_profile.png',
      '/assets/projects/aucto/e_aucto_catalog.jpg',
      '/assets/projects/aucto/f_aucto_login.png',
      '/assets/projects/aucto/g_aucto_register.png',
    ],
  },
  {
    id: 'linka',
    name: 'Linka',
    tags: ['TypeScript', 'Three.js', 'API'],
    year: '2025',
    status: 'LIVE',
    description:
      'Social media platform with 3D intro, emoji reactions, comments, and real-time search. Team-built with Three.js and Tailwind.',
    github: 'https://github.com/sergiu-sa/linka-social-media',
    live: 'https://linka-social.netlify.app/',
    images: [
      '/assets/projects/linka/linka_intro_light.gif',
      '/assets/projects/linka/linka_intro_dark.gif',
      '/assets/projects/linka/linka_feed_light.png',
      '/assets/projects/linka/linka_feed_dark.png',
      '/assets/projects/linka/linka_profile_light.png',
      '/assets/projects/linka/linka_profile_dark.png',
    ],
  },
  {
    id: 'adventure-trails',
    name: 'Adventure Trails',
    tags: ['HTML', 'CSS'],
    year: '2024',
    status: 'COMPLETE',
    description:
      'Marketing site for guided hiking expeditions with responsive design, gallery, and SEO optimization. Pure HTML and CSS.',
    github: 'https://github.com/sergiu-sa/adventure_trails_hikes',
    live: 'https://adventuretrailshikes.netlify.app/',
    images: ['/assets/projects/adventure_trails/adventure_trails_01.png'],
  },
  {
    id: 'square-eyes',
    name: 'Square Eyes',
    tags: ['HTML', 'CSS'],
    year: '2024',
    status: 'COMPLETE',
    description: 'Accessible film streaming site built with clean HTML and CSS.',
    github: 'https://github.com/sergiu-sa/pro-school-react.git',
    live: 'https://sergiu-sa.github.io/pro-school-react/',
    images: ['/assets/projects/square_eyes/new_home02.png'],
  },
  {
    id: 'kid-bank',
    name: 'Kid Bank',
    tags: ['JavaScript', 'API', 'CSS'],
    year: '2024',
    status: 'LIVE',
    description: 'Banking app for teens with restricted purchases and barcode scanning.',
    github: 'https://github.com/sergiu-sa/kid_bank_.git',
    live: 'https://k1dbank.netlify.app',
    images: [
      '/assets/projects/kid_bank/kid_bank01.png',
      '/assets/projects/kid_bank/kid_bank02.png',
    ],
  },
  {
    id: 'ask-better',
    name: 'Ask Better',
    tags: ['AI', 'UX', 'JavaScript'],
    year: '2025',
    status: 'LIVE',
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
      '/assets/projects/ask_better/zen_pro_01.png',
    ],
  },
];

// Teletext state
let currentProjectIndex = 0;
let currentProjectImageIndex = 0;
let projectSlideshowInterval = null;
let projectChannelInitialized = false;
let teletextKeyboardHandler = null;
let lightboxOpen = false;
let vhsGlitchTimeout = null;

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

    if (previewImg) {
      previewImg.classList.add('img-fade');
      setTimeout(() => {
        previewImg.src = project.images[currentProjectImageIndex];
        previewImg.classList.remove('img-fade');
      }, 150);
    }
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
// VHS GLITCH EFFECT
// ============================================
function triggerVhsGlitch() {
  const glitch = document.querySelector('.teletext-container .vhs-glitch');
  if (!glitch) return;

  clearTimeout(vhsGlitchTimeout);
  glitch.classList.remove('active');
  void glitch.offsetWidth;
  glitch.classList.add('active');

  vhsGlitchTimeout = setTimeout(() => glitch.classList.remove('active'), 350);
}

// ============================================
// PAGE DOTS
// ============================================

/**
 * Create page indicator dots for direct project navigation
 */
function createPageDots() {
  const container = document.getElementById('teletext-page-dots');
  if (!container) return;

  container.innerHTML = '';
  projectsData.forEach((project, i) => {
    const dot = document.createElement('button');
    dot.className = `page-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Go to project ${i + 1}: ${project.name}`);
    dot.addEventListener('click', () => {
      if (i !== currentProjectIndex) {
        currentProjectIndex = i;
        showTeletextProject(i);
      }
    });
    container.appendChild(dot);
  });
}

/**
 * Update active state of page dots
 * @param {number} index - Active project index
 */
function updatePageDots(index) {
  const dots = document.querySelectorAll('.page-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

// ============================================
// PROJECT DISPLAY
// ============================================

/**
 * Render tech tags as colored badges
 * @param {HTMLElement} container - Tags container element
 * @param {string[]} tags - Array of tech tag names
 */
function renderTechTags(container, tags) {
  container.innerHTML = '';
  tags.forEach((tag, i) => {
    const span = document.createElement('span');
    span.className = `teletext-tag ${TAG_COLORS[i % TAG_COLORS.length]}`;
    span.textContent = tag;
    container.appendChild(span);
  });
}

/**
 * Show a specific project in the teletext UI
 * @param {number} index - Project index
 * @param {boolean} [animate=true] - Whether to play VHS glitch transition
 */
function showTeletextProject(index, animate = true) {
  const project = projectsData[index];
  currentProjectIndex = index;
  currentProjectImageIndex = 0;

  if (triggerFlicker) triggerFlicker();
  playTeletextBeep();

  if (animate) triggerVhsGlitch();

  // Show OSD with page number
  const pageNum = 101 + index;
  if (showOSD) showOSD(`P.${pageNum}`);

  // Update DOM elements
  const pageNumEl = document.getElementById('teletext-page-num');
  const counterEl = document.getElementById('teletext-project-counter');
  const pageRangeEl = document.getElementById('teletext-page-range');
  const titleEl = document.getElementById('teletext-project-title');
  const previewImg = document.getElementById('teletext-preview-img');
  const imgCurrentEl = document.getElementById('teletext-img-current');
  const imgTotalEl = document.getElementById('teletext-img-total');
  const tagsEl = document.getElementById('teletext-tags');
  const descEl = document.getElementById('teletext-desc');
  const codeLink = document.getElementById('teletext-link-code');
  const liveLink = document.getElementById('teletext-link-live');
  const statusEl = document.getElementById('teletext-status');
  const yearEl = document.getElementById('teletext-year');

  if (pageNumEl) pageNumEl.textContent = pageNum;
  if (counterEl) counterEl.textContent = `PROJECT ${index + 1} OF ${projectsData.length}`;
  if (pageRangeEl) pageRangeEl.textContent = `P.101-${100 + projectsData.length}`;
  if (titleEl) titleEl.textContent = project.name.toUpperCase();
  if (previewImg) previewImg.src = project.images[0];
  if (imgCurrentEl) imgCurrentEl.textContent = '1';
  if (imgTotalEl) imgTotalEl.textContent = project.images.length;

  // Render tech tags as colored badges
  if (tagsEl) renderTechTags(tagsEl, project.tags);

  // Update status and year
  if (statusEl) {
    statusEl.innerHTML = '';
    const dot = document.createElement('span');
    dot.className = project.status === 'LIVE' ? 'status-blink live' : 'status-blink';
    statusEl.appendChild(dot);
    statusEl.appendChild(document.createTextNode(` ${project.status}`));
  }

  if (yearEl) yearEl.textContent = project.year;

  if (descEl) descEl.textContent = project.description;
  if (codeLink) codeLink.href = project.github;
  if (liveLink) liveLink.href = project.live;

  // Update page dots
  updatePageDots(index);

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
    currentProjectImageIndex =
      (currentProjectImageIndex - 1 + project.images.length) % project.images.length;
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
  // One-time DOM binding
  if (!projectChannelInitialized) {
    projectChannelInitialized = true;

    createPageDots();

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

    // Preview click/keyboard to open lightbox
    const previewFrame = document.querySelector('.teletext-preview-frame');
    if (previewFrame) {
      previewFrame.addEventListener('click', openLightbox);
      previewFrame.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox();
        }
      });
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
  }

  // Per-activation setup (runs every time the section is shown)
  showTeletextProject(currentProjectIndex, false);

  teletextKeyboardHandler = handleTeletextKeyboard;
  document.addEventListener('keydown', teletextKeyboardHandler);

  startTeletextImageCycle();
}

/**
 * Cleanup teletext system
 */
export function cleanupTeletext() {
  if (teletextKeyboardHandler) {
    document.removeEventListener('keydown', teletextKeyboardHandler);
    teletextKeyboardHandler = null;
  }
  stopProjectSlideshow();
}
