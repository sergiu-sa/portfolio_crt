/**
 * Lightbox Module
 * Standalone image viewer with zoom, pan, pinch and keyboard support.
 *
 * Knows nothing about projects: callers pass an image array, a start index and a label.
 * Listeners bound by initLightbox() live for the page lifetime;
 * the lightbox never unmounts — so there is no teardown export and no AbortController here by design.
 */

// Lightbox state
let lightboxOpen = false;
let images = [];
let currentIndex = 0;
let label = '';
let onCloseCallback = null;
let bound = false;

// Zoom/pan state
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

// ============================================
// ZOOM / PAN
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
 * Paint the current image and counter into the lightbox DOM
 */
function renderCurrent() {
  const lightboxImg = document.getElementById('lightbox-img');
  const currentEl = document.getElementById('lightbox-current');
  const totalEl = document.getElementById('lightbox-total');

  if (lightboxImg) {
    lightboxImg.src = images[currentIndex];
    lightboxImg.alt = `${label} — image ${currentIndex + 1} of ${images.length}`;
  }
  if (currentEl) currentEl.textContent = currentIndex + 1;
  if (totalEl) totalEl.textContent = images.length;
}

/**
 * Open the image lightbox.
 * @param {string[]} imageList - Image paths to browse.
 * @param {number} [startIndex=0] - Index to open at.
 * @param {string} [labelText=''] - Human label used in alt text.
 * @param {Function} [onClose] - Called after the lightbox closes.
 */
export function openLightbox(imageList, startIndex = 0, labelText = '', onClose = null) {
  if (!imageList || imageList.length === 0) return;

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (!lightbox || !lightboxImg) return;

  images = imageList;
  currentIndex = Math.max(0, Math.min(startIndex, images.length - 1));
  label = labelText;
  onCloseCallback = onClose;

  resetZoom();
  renderCurrent();

  lightbox.classList.add('active');
  document.body.classList.add('lightbox-open');
  lightboxOpen = true;

  const closeBtn = document.getElementById('lightbox-close');
  if (closeBtn) closeBtn.focus();
}

/**
 * Close the image lightbox
 */
export function closeLightbox() {
  if (!lightboxOpen) return;

  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  resetZoom();
  lightbox.classList.remove('active');
  document.body.classList.remove('lightbox-open');
  lightboxOpen = false;

  // Fire once and release: a stale callback would otherwise re-fire on a later close and restart whatever the previous opener was doing.
  const callback = onCloseCallback;
  onCloseCallback = null;
  if (callback) callback();
}

/**
 * Whether the lightbox is currently open
 * @returns {boolean}
 */
export function isLightboxOpen() {
  return lightboxOpen;
}

/**
 * Navigate within the lightbox
 * @param {'next'|'prev'} direction
 */
function navigateLightbox(direction) {
  resetZoom();
  currentIndex =
    direction === 'next'
      ? (currentIndex + 1) % images.length
      : (currentIndex - 1 + images.length) % images.length;
  renderCurrent();
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Bind lightbox controls, zoom/pan gestures and keyboard shortcuts.
 * Idempotent — safe to call on every section entry.
 */
export function initLightbox() {
  if (bound) return;
  bound = true;

  // Lightbox controls
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightbox = document.getElementById('lightbox');

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

  // Keyboard: the lightbox owns its own keys while open
  const OWNED_KEYS = ['Escape', 'ArrowLeft', 'ArrowRight', '+', '=', '-', '_', '0'];
  document.addEventListener('keydown', (e) => {
    if (!lightboxOpen) return;

    // This listener is registered before the section-level handlers, so stopping immediate propagation keeps them from also acting on a key the lightbox owns
    // e.g. Escape must only close the lightbox, not also route the detail view back to the catalogue.
    if (OWNED_KEYS.includes(e.key)) e.stopImmediatePropagation();

    const viewport = document.getElementById('lightbox-img-viewport');

    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateLightbox('prev');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateLightbox('next');
    } else if ((e.key === '+' || e.key === '=') && viewport) {
      e.preventDefault();
      const r = viewport.getBoundingClientRect();
      applyZoom(zoomLevel + ZOOM_STEP, r.left + r.width / 2, r.top + r.height / 2, true);
    } else if ((e.key === '-' || e.key === '_') && viewport) {
      e.preventDefault();
      const r = viewport.getBoundingClientRect();
      applyZoom(zoomLevel - ZOOM_STEP, r.left + r.width / 2, r.top + r.height / 2, true);
    } else if (e.key === '0') {
      e.preventDefault();
      resetZoom();
    }
  });
}
