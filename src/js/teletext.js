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
      '/assets/projects/aucto/b_aucto_feed.jpg',
      '/assets/projects/aucto/c_aucto.png',
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
    images: [
      '/assets/projects/adventure_trails/adventure_intro.gif',
      '/assets/projects/adventure_trails/hike-min.png',
      '/assets/projects/adventure_trails/home-min.png',
      '/assets/projects/adventure_trails/about-min.png',
    ],
  },
  {
    id: 'square-eyes',
    name: 'Square Eyes',
    tags: ['HTML', 'CSS'],
    year: '2024',
    status: 'COMPLETE',
    description: 'Accessible film streaming site built with clean HTML and CSS.',
    github: 'https://github.com/sergiu-sa/pro-school-react.git',
    live: 'https://square-eyes-sa.netlify.app/',
    images: [
      '/assets/projects/square_eyes/new_home02.png',
      '/assets/projects/square_eyes/new_home01.png',
    ],
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
let signalTimer = null;

// Lightbox zoom/pan state
let zoomLevel = 1;
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.15;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panStartPanX = 0;
let panStartPanY = 0;
let zoomIndicatorTimeout = null;
let initialPinchDistance = null;
let initialPinchZoom = 1;

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
        const dir = i > currentProjectIndex ? 'next' : 'prev';
        currentProjectIndex = i;
        showTeletextProject(i, true, dir);
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
 * Update content area DOM elements with project data
 * @param {Object} project - Project data object
 */
function updateProjectDOM(project) {
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

  if (titleEl) titleEl.textContent = project.name.toUpperCase();
  if (previewImg) {
    previewImg.src = project.images[0];
    previewImg.alt = `${project.name} project preview`;
  }
  if (imgCurrentEl) imgCurrentEl.textContent = '1';
  if (imgTotalEl) imgTotalEl.textContent = project.images.length;
  if (tagsEl) renderTechTags(tagsEl, project.tags);

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
}

/**
 * Update frame elements (header, subheader, footer) outside the sliding content
 * @param {number} index - Project index
 */
function updateFrameElements(index) {
  const pageNum = 101 + index;
  const pageNumEl = document.getElementById('teletext-page-num');
  const counterEl = document.getElementById('teletext-project-counter');
  const pageRangeEl = document.getElementById('teletext-page-range');

  if (pageNumEl) pageNumEl.textContent = pageNum;
  if (counterEl) counterEl.textContent = `PROJECT ${index + 1} OF ${projectsData.length}`;
  if (pageRangeEl) pageRangeEl.textContent = `P.101-${100 + projectsData.length}`;

  updatePageDots(index);
}

/**
 * Reset container animation state
 * @param {HTMLElement} container - The teletext container element
 */
function resetContainerAnimation(container) {
  if (!container) return;
  container.classList.remove('signal-out', 'signal-in');
  container.style.removeProperty('--signal-dir');
}

/**
 * Show a specific project in the teletext UI
 * @param {number} index - Project index
 * @param {boolean} [animate=true] - Whether to play VHS glitch transition
 * @param {'next'|'prev'} [direction='next'] - Slide direction
 */
function showTeletextProject(index, animate = true, direction = 'next') {
  const project = projectsData[index];
  currentProjectIndex = index;
  currentProjectImageIndex = 0;

  const container = document.querySelector('.teletext-container');

  if (triggerFlicker) triggerFlicker();
  playTeletextBeep();
  if (animate) triggerVhsGlitch();

  // Show OSD with page number
  const pageNum = 101 + index;
  if (showOSD) showOSD(`P.${pageNum}`);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // No animation: instant swap
  if (!animate || !container || prefersReducedMotion) {
    if (signalTimer) {
      clearTimeout(signalTimer);
      signalTimer = null;
    }
    resetContainerAnimation(container);
    updateFrameElements(index);
    updateProjectDOM(project);
    startTeletextImageCycle();
    return;
  }

  // Cancel in-progress animation
  if (signalTimer) {
    clearTimeout(signalTimer);
    signalTimer = null;
    resetContainerAnimation(container);
  }

  // Direction: -1 = slide up (next), 1 = slide down (prev)
  container.style.setProperty('--signal-dir', direction === 'next' ? '-1' : '1');

  // Phase 1: Slide out with front-loaded glitch burst (220ms)
  container.classList.add('signal-out');

  signalTimer = setTimeout(() => {
    // Phase 2: DOM swap (container is off-screen and invisible)
    container.classList.remove('signal-out');
    updateFrameElements(index);
    updateProjectDOM(project);

    // Phase 3: Slide in with delayed lock-in glitch (260ms)
    container.classList.add('signal-in');
    startTeletextImageCycle();

    // Cleanup after entry completes
    signalTimer = setTimeout(() => {
      resetContainerAnimation(container);
      signalTimer = null;
    }, 260);
  }, 220);
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
  showTeletextProject(currentProjectIndex, true, direction);
}

// ============================================
// LIGHTBOX ZOOM / PAN
// ============================================

/**
 * Reset zoom to 1x and re-center the image
 */
function resetZoom() {
  zoomLevel = 1;
  panX = 0;
  panY = 0;
  const viewport = document.getElementById('lightbox-img-viewport');
  const img = document.getElementById('lightbox-img');

  if (viewport) {
    viewport.classList.remove('is-zoomed', 'is-panning');
  }
  if (img) {
    img.style.transition = 'transform 0.2s ease-out';
    img.style.transform = '';
    img.style.willChange = '';
  }
  isPanning = false;
  updateZoomIndicator();
}

/**
 * Clamp pan so the image stays within viewable bounds
 */
function clampPan() {
  const viewport = document.getElementById('lightbox-img-viewport');
  const img = document.getElementById('lightbox-img');
  if (!viewport || !img || !img.naturalWidth) return;

  const viewportRect = viewport.getBoundingClientRect();
  // offsetWidth/Height gives CSS layout size (unaffected by transform)
  const layoutW = img.offsetWidth;
  const layoutH = img.offsetHeight;
  const visualW = layoutW * zoomLevel;
  const visualH = layoutH * zoomLevel;

  const maxPanX = Math.max(0, (visualW - viewportRect.width) / 2);
  const maxPanY = Math.max(0, (visualH - viewportRect.height) / 2);

  panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
}

/**
 * Apply the current transform (zoom + pan) to the image
 * @param {boolean} smooth - Whether to use CSS transition
 */
function applyTransform(smooth) {
  const img = document.getElementById('lightbox-img');
  if (!img) return;

  clampPan();
  img.style.transition = smooth ? 'transform 0.2s ease-out' : 'none';
  img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  img.style.willChange = zoomLevel > 1 ? 'transform' : '';
}

/**
 * Apply zoom level, keeping the focal point stable under the cursor
 * @param {number} newZoom - Target zoom level
 * @param {number} clientX - Screen X of focal point (e.clientX)
 * @param {number} clientY - Screen Y of focal point (e.clientY)
 * @param {boolean} smooth - Whether to animate the transition
 */
function applyZoom(newZoom, clientX, clientY, smooth) {
  const viewport = document.getElementById('lightbox-img-viewport');
  const img = document.getElementById('lightbox-img');
  if (!viewport || !img || !img.naturalWidth) return;

  const prevZoom = zoomLevel;
  zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));

  if (zoomLevel <= 1) {
    resetZoom();
    return;
  }

  // Expand viewport FIRST so we compute focal point in the expanded rect
  viewport.classList.add('is-zoomed');

  // Read rect AFTER expansion (triggers synchronous reflow)
  const viewportRect = viewport.getBoundingClientRect();
  const focalX = clientX - viewportRect.left;
  const focalY = clientY - viewportRect.top;

  // Focal point relative to viewport center
  const focalFromCenterX = focalX - viewportRect.width / 2;
  const focalFromCenterY = focalY - viewportRect.height / 2;

  // Keep the point under the cursor stable
  const effectivePrevZoom = prevZoom <= 1 ? 1 : prevZoom;
  panX = focalFromCenterX - ((focalFromCenterX - panX) / effectivePrevZoom) * zoomLevel;
  panY = focalFromCenterY - ((focalFromCenterY - panY) / effectivePrevZoom) * zoomLevel;

  applyTransform(smooth);
  updateZoomIndicator();
}

/**
 * Update the zoom indicator OSD
 */
function updateZoomIndicator() {
  const indicator = document.getElementById('lightbox-zoom-indicator');
  const valueEl = document.getElementById('lightbox-zoom-value');
  const fillEl = document.getElementById('lightbox-zoom-fill');

  if (!indicator) return;

  if (valueEl) valueEl.textContent = `${zoomLevel.toFixed(1)}x`;
  if (fillEl) {
    const pct = ((zoomLevel - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100;
    fillEl.style.width = `${pct}%`;
  }

  // Show indicator
  indicator.classList.add('visible');

  // Auto-hide after 1.5s of inactivity at 1x
  clearTimeout(zoomIndicatorTimeout);
  if (zoomLevel <= 1) {
    zoomIndicatorTimeout = setTimeout(() => {
      indicator.classList.remove('visible');
    }, 1500);
  }
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
  resetZoom();

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
    resetZoom();
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
  resetZoom();
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

  // Lightbox navigation + zoom
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
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const viewport = document.getElementById('lightbox-img-viewport');
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        applyZoom(zoomLevel + ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2, true);
      }
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      const viewport = document.getElementById('lightbox-img-viewport');
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        applyZoom(zoomLevel - ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2, true);
      }
    } else if (e.key === '0') {
      e.preventDefault();
      resetZoom();
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

    // Touch swipe support (horizontal only — ignore vertical scroll)
    const teletextContainer = document.querySelector('.teletext-container');
    if (teletextContainer) {
      let touchStartX = 0;
      let touchStartY = 0;

      teletextContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      });

      teletextContainer.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        const threshold = 50;

        // Only navigate if horizontal movement dominates vertical
        if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
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

    // Lightbox zoom/pan bindings
    const lightboxViewport = document.getElementById('lightbox-img-viewport');
    if (lightboxViewport) {
      // Mouse wheel zoom
      lightboxViewport.addEventListener(
        'wheel',
        (e) => {
          if (!lightboxOpen) return;
          e.preventDefault();
          const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
          applyZoom(zoomLevel + delta, e.clientX, e.clientY, false);
        },
        { passive: false }
      );

      // Mouse drag to pan when zoomed
      lightboxViewport.addEventListener('mousedown', (e) => {
        if (!lightboxOpen || zoomLevel <= 1) return;
        e.preventDefault();
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panStartPanX = panX;
        panStartPanY = panY;
        lightboxViewport.classList.add('is-panning');
      });

      document.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panX = panStartPanX + (e.clientX - panStartX);
        panY = panStartPanY + (e.clientY - panStartY);
        applyTransform(false);
      });

      document.addEventListener('mouseup', () => {
        if (isPanning) {
          isPanning = false;
          const vp = document.getElementById('lightbox-img-viewport');
          if (vp) vp.classList.remove('is-panning');
        }
      });

      // Double-click to toggle zoom
      lightboxViewport.addEventListener('dblclick', (e) => {
        if (!lightboxOpen) return;
        e.preventDefault();
        if (zoomLevel > 1) {
          resetZoom();
        } else {
          applyZoom(2.5, e.clientX, e.clientY, true);
        }
      });

      // Touch: pinch-to-zoom + single-finger pan
      lightboxViewport.addEventListener(
        'touchstart',
        (e) => {
          if (!lightboxOpen) return;
          if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDistance = Math.hypot(dx, dy);
            initialPinchZoom = zoomLevel;
          } else if (e.touches.length === 1 && zoomLevel > 1) {
            e.preventDefault();
            isPanning = true;
            panStartX = e.touches[0].clientX;
            panStartY = e.touches[0].clientY;
            panStartPanX = panX;
            panStartPanY = panY;
            lightboxViewport.classList.add('is-panning');
          }
        },
        { passive: false }
      );

      lightboxViewport.addEventListener(
        'touchmove',
        (e) => {
          if (!lightboxOpen) return;
          if (e.touches.length === 2 && initialPinchDistance !== null) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDist = Math.hypot(dx, dy);
            const scale = currentDist / initialPinchDistance;
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            applyZoom(initialPinchZoom * scale, midX, midY, false);
          } else if (e.touches.length === 1 && isPanning) {
            e.preventDefault();
            panX = panStartPanX + (e.touches[0].clientX - panStartX);
            panY = panStartPanY + (e.touches[0].clientY - panStartY);
            applyTransform(false);
          }
        },
        { passive: false }
      );

      lightboxViewport.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
          initialPinchDistance = null;
        }
        if (e.touches.length === 0) {
          isPanning = false;
          lightboxViewport.classList.remove('is-panning');
        }
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
  if (signalTimer) {
    clearTimeout(signalTimer);
    signalTimer = null;
  }
  resetContainerAnimation(document.querySelector('.teletext-container'));
  stopProjectSlideshow();
}
