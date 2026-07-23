/**
 * SARBU+ — the projects "streaming service".
 *
 * Renders two states into `#projects-body`:
 *   browse — the channel ident (signature over a wall of covers) + a filterable
 *            catalogue of every project
 *   detail — one project as a streaming "title page"
 *
 * The URL hash is the source of truth for which state is shown; this module renders what it is told and never reads the hash itself.
 * Routing lives in main.js.
 * Every in-panel navigation fires a short "signal-lock" glitch.
 */

import { projects } from '../data/projects.js';
import { initLightbox, openLightbox, isLightboxOpen } from './lightbox.js';

let showOSD = null;
let sectionController = null;
let currentProjectId = null;
let lastFocusedCardId = null;
let pendingAnnouncement = null;
let entering = false;
let glitchTimer = null;

export function setProjectsCallbacks(callbacks) {
  showOSD = callbacks.showOSD;
}

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape a value for interpolation into innerHTML, in text or attribute position.
 * Project copy is authored, not user input, but a single apostrophe in a name or brief would otherwise break out of an attribute.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Is #projects actually on screen? #projects-live lives inside it. */
function isSectionVisible() {
  return document.getElementById('projects')?.classList.contains('active') === true;
}

/**
 * Fire the CRT signal-lock glitch on the panel for a beat.
 * Transform + overlay only (see _projects.css), so it stays cheap.
 * No-op under reduced motion.
 */
function signalLock(duration = 460) {
  if (prefersReducedMotion()) return;
  const panel = document.querySelector('.sarbu');
  if (!panel) return;
  panel.classList.add('is-glitching');
  clearTimeout(glitchTimer);
  glitchTimer = setTimeout(() => panel.classList.remove('is-glitching'), duration);
}

/**
 * "Signal-lock" loading:
 * content images tune in like a CRT locking onto a channel;
 * scanline + chroma static (see _projects.css) resolves to a clean picture the moment the image loads.
 * Cached images (already decoded) skip the effect so a re-render doesn't flash.
 * No-op under reduced motion.
 * @param {ParentNode} root
 */
function armSignalLock(root) {
  if (prefersReducedMotion()) return;
  const shots = root.querySelectorAll('.sarbu-card-media, .sarbu-gallery-hero, .sarbu-thumb');
  shots.forEach((shot) => {
    const img = shot.querySelector('img');
    if (!img || (img.complete && img.naturalWidth > 0)) return;
    shot.classList.add('is-tuning');
    const reveal = (animate) => {
      shot.classList.remove('is-tuning');
      if (animate) shot.classList.add('is-lock-in');
    };
    img.addEventListener('load', () => reveal(true), { once: true });
    img.addEventListener('error', () => reveal(false), { once: true });
  });
}

/**
 * Announce a view change to screen readers.
 *
 * The region is cleared first: several screen readers drop an update whose text is identical to what is already there,
 * and browse → detail → browse navigation announces the same string repeatedly.
 *
 * A cross-section route renders ~150 ms before switchToSection sets `display: flex`, 
 * so this can run while #projects-live is still inside a `display: none` subtree — where live-region mutations are not conveyed to assistive technology at all.
 * In that case the message is held and replayed by flushAnnouncement() once the section is visible.
 */
function announce(message) {
  if (!isSectionVisible()) {
    pendingAnnouncement = message;
    return;
  }
  pendingAnnouncement = null;

  const live = document.getElementById('projects-live');
  if (!live) return;
  live.textContent = '';
  requestAnimationFrame(() => {
    live.textContent = message;
  });
}

/** Replay an announcement that was made while the section was hidden. */
function flushAnnouncement() {
  if (pendingAnnouncement === null) return;
  const message = pendingAnnouncement;
  pendingAnnouncement = null;
  announce(message);
}

/** Two-digit slot number for a project index. */
function slot(index) {
  return String(index + 1).padStart(2, '0');
}

/** Grid thumbnail for a project, tolerating a missing cover. */
function thumbFor(project) {
  return project.cover || (project.images && project.images[0]) || '';
}

/** Stack family used by the catalogue filter — derived from tags, no data change. */
function stackFamily(project) {
  const tags = (project.tags || []).map((t) => t.toLowerCase());
  if (tags.some((t) => t.includes('next') || t.includes('react'))) return 'react';
  if (tags.some((t) => t.includes('typescript'))) return 'typescript';
  return 'vanilla';
}

/** Display form of a URL — protocol and trailing slash stripped. */
function prettyUrl(url) {
  return String(url).replace(/^https?:\/\//, '').replace(/\/$/, '');
}

const STACK_LABELS = {
  vanilla: 'Vanilla JS',
  typescript: 'TypeScript',
  react: 'React &middot; Next',
};

/**
 * Build the filter chips from the data so a project in a new year or stack never lands with no chip;
 * the "All" count already updates automatically.
 */
function filterChipsMarkup() {
  const years = [...new Set(projects.map((p) => p.year))].sort((a, b) => b.localeCompare(a));
  const stacks = ['vanilla', 'typescript', 'react'].filter((f) =>
    projects.some((p) => stackFamily(p) === f)
  );

  const yearChips = years
    .map(
      (y) =>
        `<button type="button" class="sarbu-chip" data-type="year" data-value="${escapeHtml(y)}" aria-pressed="false">${escapeHtml(y)}</button>`
    )
    .join('');
  const stackChips = stacks
    .map(
      (f) =>
        `<button type="button" class="sarbu-chip" data-type="stack" data-value="${f}" aria-pressed="false">${STACK_LABELS[f]}</button>`
    )
    .join('');

  return `<button type="button" class="sarbu-chip" data-type="all" aria-pressed="true">All</button>${yearChips}${stackChips}`;
}

/** One catalogue tile (also reused in the detail "more from the catalogue" row). */
function catItem(project, index) {
  const thumb = thumbFor(project);
  const media = thumb
    ? `<img src="${escapeHtml(thumb)}" alt="${escapeHtml(`${project.name} — cover`)}" width="800" height="450" loading="lazy" decoding="async">`
    : '';
  return `
    <li class="sarbu-cat-item" data-year="${escapeHtml(project.year)}" data-stack="${stackFamily(project)}">
      <a class="sarbu-card" href="#projects/${escapeHtml(project.id)}" data-id="${escapeHtml(project.id)}">
        <div class="sarbu-card-media">
          ${media}
          <div class="sarbu-card-preview">
            <p>${escapeHtml(project.brief || '')}</p>
            <span class="sarbu-card-cta">&#9654; Open project</span>
          </div>
        </div>
        <div class="sarbu-card-body">
          <span class="sarbu-card-index">${slot(index)}</span>
          <span class="sarbu-card-name" data-text="${escapeHtml(project.name)}">${escapeHtml(project.name)}</span>
          <span class="sarbu-card-meta"><span class="sarbu-status ${project.status === 'LIVE' ? 'is-live' : ''}">${escapeHtml(project.status)}</span> &middot; ${escapeHtml(project.year)} &middot; ${escapeHtml(project.role || '')}</span>
          <span class="sarbu-card-stack">${escapeHtml((project.tags || []).join(' · '))}</span>
        </div>
      </a>
    </li>`;
}

/** Wire the catalogue filter chips. Elements are discarded on the next render. */
function wireFilters(body) {
  const chips = body.querySelectorAll('.sarbu-chip');
  const items = body.querySelectorAll('.sarbu-catalogue > .sarbu-cat-item');
  const count = body.querySelector('#sarbu-filter-count');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');

      const { type, value } = chip.dataset;
      let shown = 0;
      items.forEach((item) => {
        const match =
          type === 'all' ||
          (type === 'year' && item.dataset.year === value) ||
          (type === 'stack' && item.dataset.stack === value);
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (count) {
        count.textContent = `${String(shown).padStart(2, '0')} ${shown === 1 ? 'TITLE' : 'TITLES'}`;
      }
    });
  });
}

/** Render the browse state (channel ident + catalogue) into #projects-body. */
function renderBrowse() {
  const body = document.getElementById('projects-body');
  const meta = document.getElementById('projects-head-meta');
  if (!body) return;

  const total = String(projects.length).padStart(2, '0');
  if (meta) meta.textContent = `${total} TITLES`;

  const wall = projects
    .map((p) => `<img src="${escapeHtml(thumbFor(p))}" alt="" decoding="async">`)
    .join('');

  body.className = 'sarbu-body is-browse';
  body.innerHTML = `
    <section class="sarbu-ident" aria-label="SARBU+ — the complete works">
      <div class="sarbu-wall" aria-hidden="true">${wall}</div>
      <div class="sarbu-ident-scrim" aria-hidden="true"></div>
      <div class="sarbu-ident-inner">
        <p class="sarbu-kicker">SARBU+ &middot; Now streaming</p>
        <span class="sarbu-sig" role="img" aria-label="Sergiu Sarbu"></span>
        <p class="sarbu-role-line">Front-end developer &middot; Oslo</p>
        <p class="sarbu-tagline"><b>In code we trust.</b> Everything else, we inspect.</p>
      </div>
    </section>

    <div class="sarbu-filter">
      <span class="sarbu-filter-label">Showing</span>
      <span class="sarbu-filter-count" id="sarbu-filter-count">${total} TITLES</span>
      <div class="sarbu-chips" role="group" aria-label="Filter projects">${filterChipsMarkup()}</div>
    </div>

    <div class="sarbu-cat-head"><span class="arrow">&#9656;</span> The catalogue</div>
    <ul class="sarbu-catalogue">${projects.map((p, i) => catItem(p, i)).join('')}</ul>
  `;

  wireFilters(body);
  armSignalLock(body);
  announce('Showing all projects');
}

/**
 * Render one project as a streaming title page.
 * An unknown id falls back to the browse state rather than erroring.
 * @param {string} projectId
 */
function renderDetail(projectId) {
  const body = document.getElementById('projects-body');
  const meta = document.getElementById('projects-head-meta');
  if (!body) return;

  const index = projects.findIndex((p) => p.id === projectId);
  if (index === -1) {
    currentProjectId = null;
    renderBrowse();
    return;
  }

  const project = projects[index];
  const images = project.images || [];
  const hero = images[0] || project.cover || '';
  if (meta) meta.textContent = `${slot(index)} / ${project.name}`;

  const related = [];
  for (let k = 1; k <= 4 && k < projects.length; k += 1) {
    related.push(projects[(index + k) % projects.length]);
  }

  body.className = 'sarbu-body is-detail';
  body.innerHTML = `
    <div class="sarbu-back">
      <a class="sarbu-back-btn" href="#projects">&#9664; All projects</a>
      <span class="sarbu-crumb"><b>All projects</b> / ${escapeHtml(project.name)}</span>
    </div>

    <section class="sarbu-detail-hero">
      ${hero ? `<div class="sarbu-detail-bg" style="background-image:url('${escapeHtml(hero)}')"></div>` : ''}
      <div class="sarbu-detail-scrim"></div>
      <div class="sarbu-detail-inner">
        <p class="sarbu-kicker">${escapeHtml(project.role || '')}</p>
        <h2 class="sarbu-detail-title" id="project-detail-title" tabindex="-1">${escapeHtml(project.name)}</h2>
        <div class="sarbu-detail-meta">
          <span>${escapeHtml(project.year)}</span>
          <span class="sarbu-status ${project.status === 'LIVE' ? 'is-live' : ''}">${escapeHtml(project.status)}</span>
          <span class="sarbu-genres">${escapeHtml((project.tags || []).join(' · '))}</span>
        </div>
        <div class="sarbu-detail-actions">
          ${project.live ? `<a class="sarbu-btn sarbu-btn-play" href="${escapeHtml(project.live)}" target="_blank" rel="noopener noreferrer">&#9654; Visit live</a>` : ''}
          ${project.github ? `<a class="sarbu-btn sarbu-btn-ghost" href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer">&#65291; View code</a>` : ''}
        </div>
      </div>
    </section>

    <div class="sarbu-detail-body">
      <div class="sarbu-synopsis">
        <h3>Synopsis</h3>
        <p class="sarbu-lede">${escapeHtml(project.brief || '')}</p>
        ${
          project.highlights && project.highlights.length
            ? `<ul class="sarbu-highlights">${project.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`
            : ''
        }
      </div>
      <aside class="sarbu-facts">
        <h3>Details</h3>
        <dl>
          <dt>Role</dt><dd>${escapeHtml(project.role || '—')}</dd>
          <dt>Year</dt><dd>${escapeHtml(project.year)}</dd>
          <dt>Stack</dt><dd>${escapeHtml((project.tags || []).join(' · '))}</dd>
          ${project.live ? `<dt>Live</dt><dd><a href="${escapeHtml(project.live)}" target="_blank" rel="noopener noreferrer">${escapeHtml(prettyUrl(project.live))} &#8599;</a></dd>` : ''}
          ${project.github ? `<dt>Code</dt><dd><a href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer">${escapeHtml(prettyUrl(project.github))} &#8599;</a></dd>` : ''}
        </dl>
      </aside>
    </div>

    ${
      images.length
        ? `<section class="sarbu-gallery">
      <h3>Gallery <span class="hint">&mdash; ${images.length} still${images.length > 1 ? 's' : ''}, click to enlarge</span></h3>
      <div class="sarbu-gallery-lead">
        <button type="button" class="sarbu-gallery-hero" data-index="0" aria-label="Open image 1 of ${images.length}">
          <img src="${escapeHtml(images[0])}" alt="" loading="lazy" decoding="async">
          <span class="sarbu-gallery-expand">&#10530; Expand</span>
        </button>
        ${
          images.length > 1
            ? `<div class="sarbu-gallery-strip">
          ${images
            .slice(1)
            .map((src, k) => {
              const i = k + 1;
              return `
          <button type="button" class="sarbu-thumb" data-index="${i}" aria-label="Open image ${i + 1} of ${images.length}">
            <img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async">
            <span class="idx">${slot(i)}</span>
          </button>`;
            })
            .join('')}
        </div>`
            : ''
        }
      </div>
    </section>`
        : ''
    }

    ${
      related.length
        ? `<section class="sarbu-related">
      <div class="sarbu-related-head"><span class="arrow">&#9656;</span> More from the catalogue</div>
      <ul class="sarbu-related-row">${related.map((p) => catItem(p, projects.indexOf(p))).join('')}</ul>
    </section>`
        : ''
    }
  `;

  // Gallery lead + strip thumbs open the lightbox at their own index.
  // Bound on freshly-created elements the next render discards, so no AbortController is needed.
  body.querySelectorAll('.sarbu-gallery [data-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openLightbox(images, Number(btn.dataset.index), project.name);
    });
  });

  armSignalLock(body);
  document.getElementById('project-detail-title')?.focus();

  announce(`Showing ${project.name}`);
  if (showOSD) showOSD(`${slot(index)} ${(project.name || '').toUpperCase()}`);
}

/**
 * Show the browse state (projectId null) or a project detail view.
 * Idempotent — re-rendering the state already on screen is a no-op.
 * Fires the signal-lock glitch on a real in-panel change (not on first section entry, where the CRT channel-switch already plays).
 * @param {string|null} projectId
 */
export function showProjectView(projectId) {
  const normalized = projectId || null;
  const body = document.getElementById('projects-body');
  if (normalized === currentProjectId && body?.innerHTML) return;

  const changed = normalized !== currentProjectId;
  currentProjectId = normalized;
  if (changed && !entering && isSectionVisible()) signalLock();

  if (!normalized) {
    renderBrowse();
    restoreCardFocus();
    return;
  }
  renderDetail(normalized);
}

/**
 * Return focus to the card that was opened, after coming back from detail.
 * The id is consumed only when focus actually lands: a render that happens
 * while #projects is still hidden makes focus() a silent no-op, and discarding
 * the id there would leave focusCurrentView() nothing to restore.
 */
function restoreCardFocus() {
  if (!lastFocusedCardId) return;
  const card = document.querySelector(`.sarbu-card[data-id="${lastFocusedCardId}"]`);
  if (!card) return;
  card.focus();
  if (document.activeElement === card) lastFocusedCardId = null;
}

/**
 * Put focus on the current view's entry point, and replay any announcement made while the section was hidden.
 * Needed on section entry: the render happens while #projects is still display:none, where focus() and live-region updates
 * are no-ops, so both are reapplied once the section is visible.
 */
function focusCurrentView() {
  if (currentProjectId) {
    document.getElementById('project-detail-title')?.focus();
  } else {
    restoreCardFocus();
  }
  flushAnnouncement();
}

/**
 * Wire up the section and render a view.
 * The caller passes the id from the reconciled hash;
 * the default only covers a re-init with no routing information, where the current state is correct.
 * @param {string|null} [projectId]
 */
export function initProjectsSection(projectId = currentProjectId) {
  initLightbox();

  if (sectionController) sectionController.abort();
  sectionController = new AbortController();

  // Remember which card was opened so focus can return to it.
  document.addEventListener(
    'click',
    (e) => {
      const card = e.target.closest('.sarbu-card');
      if (card) lastFocusedCardId = card.dataset.id;
    },
    { signal: sectionController.signal }
  );

  // Detail-view keys. These write the hash rather than rendering directly, so every transition goes through the one routing path and lands in history.
  document.addEventListener(
    'keydown',
    (e) => {
      const section = document.getElementById('projects');
      if (!section || !section.classList.contains('active')) return;
      // Overlays own the keys while they are up — Escape must close them, not route.
      if (isLightboxOpen()) return;
      if (document.getElementById('shortcuts-modal')?.classList.contains('active')) return;
      if (!currentProjectId) return;

      const index = projects.findIndex((p) => p.id === currentProjectId);
      if (index === -1) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        window.location.hash = '#projects';
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        window.location.hash = `#projects/${projects[(index - 1 + projects.length) % projects.length].id}`;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        window.location.hash = `#projects/${projects[(index + 1) % projects.length].id}`;
      }
    },
    { signal: sectionController.signal }
  );

  // `entering` suppresses the signal-lock glitch on section entry;
  //  the global CRT channel-switch already plays there; the glitch is for in-panel moves.
  entering = true;
  showProjectView(projectId);
  entering = false;
  focusCurrentView();
}

export function cleanupProjects() {
  if (sectionController) {
    sectionController.abort();
    sectionController = null;
  }

  // Card focus restoration is for returning from a detail view, not for arriving
  // from another section — otherwise navigating in from ABOUT would drop focus
  // mid-grid on whatever card was last opened.
  lastFocusedCardId = null;
}
