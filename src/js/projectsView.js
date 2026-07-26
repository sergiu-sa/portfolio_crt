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
import { playChannelChange, playStationIdent } from './audio.js';

let showOSD = null;
let sectionController = null;
let currentProjectId = null;
let lastFocusedCardId = null;
let pendingAnnouncement = null;
let entering = false;
let glitchTimer = null;

/** Hover is transient, a remote tune is committed — see the design doc. */
const TUNE_DWELL_MS = 120;
const TUNE_RETURN_MS = 600;

let tunedIndex = null; // null = at rest on the featured title
let heroFrozen = false; // focus inside the hero pins the current view
let dwellTimer = null;
let returnTimer = null;
let heroRetuneTimer = null;

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
  // Anything not on air transmits a test card rather than a screenshot.
  const offAir = project.status !== 'LIVE';
  const media = offAir
    ? `<span class="sarbu-offair">
         <span class="sarbu-offair-bars" aria-hidden="true"></span>
         <span class="sarbu-offair-grid" aria-hidden="true"></span>
         <span class="sarbu-offair-label">Transmission pending</span>
       </span>`
    : thumb
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

/** Total title count, zero-padded — the denominator in the hero slug. */
const TOTAL_SLOTS = String(projects.length).padStart(2, '0');

/** Every project index, in running order. */
function allIndices() {
  return projects.map((_, i) => i);
}

/**
 * Indices of catalogue items currently visible, in running order.
 * Falls back to every project before the catalogue has rendered.
 * The DOM is the source of truth so the filter chips do not need to be reimplemented here.
 */
function visibleIndices() {
  const items = document.querySelectorAll('.sarbu-catalogue > .sarbu-cat-item');
  const out = [];
  items.forEach((item, i) => {
    if (!item.hidden) out.push(i);
  });
  return out.length ? out : allIndices();
}

/** The three titles that follow `index` in running order, wrapping past the end. */
function upNextFor(index) {
  const visible = visibleIndices();
  const at = visible.indexOf(index);
  if (at === -1) return visible.slice(0, 3);
  return [...visible.slice(at + 1), ...visible.slice(0, at)].slice(0, 3);
}

/**
 * The "Visit live" / "View code" pair.
 * Shared by the browse hero and the title page so the two can never drift in wording, target or rel attributes.
 */
function projectActions(project) {
  return `
    ${project.live ? `<a class="sarbu-btn sarbu-btn-play" href="${escapeHtml(project.live)}" target="_blank" rel="noopener noreferrer">&#9654; Visit live</a>` : ''}
    ${project.github ? `<a class="sarbu-btn sarbu-btn-ghost" href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer">&#65291; View code</a>` : ''}
  `;
}

/** Inner content of the hero for one project. `mode` is 'featured' or 'preview'. */
function heroMarkup(index, mode) {
  const project = projects[index];
  const next = upNextFor(index);
  const label = mode === 'preview' ? 'Previewing' : 'Now showing';

  const nextRows = next
    .map(
      (i) =>
        `<span class="sarbu-next-row"><b>${slot(i)}</b> ${escapeHtml(projects[i].name)}</span>`
    )
    .join('');

  // Separators are explicit rather than a flex gap: the meta groups read as one run-on line without them, and the tag list already uses "·" internally.
  const meta = [
    `<span>${escapeHtml(project.year)}</span>`,
    `<span class="sarbu-status ${project.status === 'LIVE' ? 'is-live' : ''}">${escapeHtml(project.status)}</span>`,
    project.role ? `<span>${escapeHtml(project.role)}</span>` : '',
    (project.tags || []).length ? `<span>${escapeHtml(project.tags.join(' · '))}</span>` : '',
  ]
    .filter(Boolean)
    .join('<span class="sarbu-hero-sep" aria-hidden="true">&middot;</span>');

  return `
    <div class="sarbu-hero-main">
      <p class="sarbu-slug">
        <span class="sarbu-slug-bug">SARBU+</span>
        ${label}
        <span class="sarbu-slug-n">${slot(index)} / ${TOTAL_SLOTS}</span>
      </p>
      <h2 class="sarbu-hero-title">${escapeHtml(project.name)}</h2>
      <p class="sarbu-hero-meta">${meta}</p>
      <span class="sarbu-hero-cta">${projectActions(project)}</span>
    </div>
    ${nextRows ? `<div class="sarbu-hero-next"><span class="sarbu-next-h">Up next</span>${nextRows}</div>` : ''}
  `;
}

/** Which project the hero rests on — the tuned one, else the featured title. */
function heroIndex() {
  return tunedIndex ?? 0;
}

/** Slug wording for the hero's resting state. */
function heroMode() {
  return tunedIndex === null ? 'featured' : 'preview';
}

/**
 * Point the hero at a project.
 * `mode` is 'featured' (at rest) or 'preview' (hover / focus / tune).
 * A no-op when nothing would change, so sweeping across one card does not rebuild.
 */
function setHero(index, mode) {
  const hero = document.querySelector('.sarbu-hero');
  const inner = hero?.querySelector('.sarbu-hero-inner');
  const bg = hero?.querySelector('.sarbu-hero-bg');
  if (!hero || !inner || !bg) return;

  if (hero.dataset.index === String(index) && hero.dataset.mode === mode) return;
  hero.dataset.index = String(index);
  hero.dataset.mode = mode;

  bg.style.backgroundImage = `url('${thumbFor(projects[index])}')`;
  inner.innerHTML = heroMarkup(index, mode);

  if (prefersReducedMotion()) return;
  hero.classList.remove('is-retune');
  void hero.offsetWidth;
  hero.classList.add('is-retune');
  clearTimeout(heroRetuneTimer);
  heroRetuneTimer = setTimeout(() => hero.classList.remove('is-retune'), 280);
}

/**
 * Hover and keyboard focus drive the hero;
 * both are transient and fall back to the featured title.
 * A remote tune (tunedIndex) is sticky and is not cleared here.
 * Focus landing inside the hero freezes it, so the CTA a keyboard user is reaching for cannot change target underneath them.
 */
function wireHeroTuning(body) {
  const cards = body.querySelectorAll('.sarbu-catalogue .sarbu-card');
  const hero = body.querySelector('.sarbu-hero');

  const preview = (index) => {
    if (heroFrozen) return;
    clearTimeout(returnTimer);
    clearTimeout(dwellTimer);
    dwellTimer = setTimeout(() => setHero(index, 'preview'), TUNE_DWELL_MS);
  };

  const release = (delay) => {
    if (heroFrozen) return;
    clearTimeout(dwellTimer);
    clearTimeout(returnTimer);
    returnTimer = setTimeout(() => setHero(heroIndex(), heroMode()), delay);
  };

  cards.forEach((card) => {
    const index = projects.findIndex((p) => p.id === card.dataset.id);
    if (index === -1) return;

    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      preview(index);
    });
    card.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      release(TUNE_RETURN_MS);
    });
    card.addEventListener('focus', () => preview(index));
    card.addEventListener('blur', () => release(0));
  });

  if (hero) {
    hero.addEventListener('focusin', () => {
      heroFrozen = true;
      clearTimeout(returnTimer);
      clearTimeout(dwellTimer);
    });
    hero.addEventListener('focusout', (e) => {
      if (hero.contains(e.relatedTarget)) return;
      heroFrozen = false;
      release(0);
    });
  }
}

/** Render the browse state (preview-monitor hero + catalogue) into #projects-body. */
function renderBrowse() {
  const body = document.getElementById('projects-body');
  const meta = document.getElementById('projects-head-meta');
  if (!body) return;

  stopTimecode();

  if (meta) meta.textContent = `${TOTAL_SLOTS} TITLES`;

  // A tune survives a trip into a title page and back, so the hero is rebuilt
  // from the tuning state rather than always resetting to the featured title.
  const index = heroIndex();
  const mode = heroMode();

  body.className = 'sarbu-body is-browse';
  body.innerHTML = `
    <section class="sarbu-hero" aria-label="Featured project" data-index="${index}" data-mode="${mode}">
      <div class="sarbu-hero-bg" style="background-image:url('${escapeHtml(thumbFor(projects[index]))}')" aria-hidden="true"></div>
      <div class="sarbu-hero-scrim" aria-hidden="true"></div>
      <div class="sarbu-hero-inner">${heroMarkup(index, mode)}</div>
    </section>

    <div class="sarbu-filter">
      <span class="sarbu-filter-label">Showing</span>
      <span class="sarbu-filter-count" id="sarbu-filter-count">${TOTAL_SLOTS} TITLES</span>
      <div class="sarbu-chips" role="group" aria-label="Filter projects">${filterChipsMarkup()}</div>
    </div>

    <div class="sarbu-cat-head"><span class="arrow">&#9656;</span> The catalogue</div>
    <ul class="sarbu-catalogue">${projects.map((p, i) => catItem(p, i)).join('')}</ul>
  `;

  wireFilters(body);
  wireHeroTuning(body);
  armSignalLock(body);
  announce('Showing all projects');
}

let timecodeRaf = null;
let timecodeElapsed = 0;
let timecodeLastFrame = 0;
let timecodeLast = '';

/* Any gap longer than this between frames is a stall, not playback;
the tab was hidden (rAF stops entirely), the machine slept, or the CRT was powered off. */
const TIMECODE_STALL_MS = 250;

/** Format elapsed milliseconds as HH:MM:SS:FF at 25fps (PAL). */
function formatTimecode(ms) {
  const total = Math.max(0, Math.floor(ms));
  const frames = Math.floor((total % 1000) / 40);
  const seconds = Math.floor(total / 1000) % 60;
  const minutes = Math.floor(total / 60000) % 60;
  const hours = Math.floor(total / 3600000);
  return [hours, minutes, seconds, frames].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * Run the title-page timecode. Halts when the section is torn down or the TV is off;
 * a detail view left behind a powered-off CRT must not keep ticking.
 */
function startTimecode() {
  stopTimecode();
  const el = document.getElementById('sarbu-timecode');
  if (!el) return;

  if (prefersReducedMotion()) {
    el.textContent = formatTimecode(0);
    return;
  }

  timecodeElapsed = 0;
  timecodeLastFrame = performance.now();
  timecodeLast = '';

  const tick = () => {
    const now = performance.now();
    const delta = now - timecodeLastFrame;
    timecodeLastFrame = now;

    // The tape only advances while it is actually playing.
    // A powered-off CRT or a hidden section holds it; so does any frame gap long enough to be a stall rather than playback.
    const playing =
      !document.body.classList.contains('tv-powered-off') &&
      isSectionVisible() &&
      delta <= TIMECODE_STALL_MS;

    if (playing) {
      timecodeElapsed += delta;
      const next = formatTimecode(timecodeElapsed);
      if (next !== timecodeLast) {
        timecodeLast = next;
        el.textContent = next;
      }
    }
    timecodeRaf = requestAnimationFrame(tick);
  };
  timecodeRaf = requestAnimationFrame(tick);
}

function stopTimecode() {
  if (timecodeRaf !== null) {
    cancelAnimationFrame(timecodeRaf);
    timecodeRaf = null;
  }
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
  if (meta) {
    meta.innerHTML = `${slot(index)} / ${escapeHtml(project.name)} <span class="sarbu-timecode" id="sarbu-timecode">00:00:00:00</span>`;
  }

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
        <div class="sarbu-detail-actions">${projectActions(project)}</div>
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
  startTimecode();
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
      // On browse the arrows tune the hero; on a detail page they surf projects.
      if (!currentProjectId) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          tuneProjectsHero(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          tuneProjectsHero(1);
        }
        return;
      }

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

  // Section entry only — showProjectView handles in-panel moves and stays silent.
  if (!prefersReducedMotion()) playStationIdent();

  // `entering` suppresses the signal-lock glitch on section entry;
  //  the global CRT channel-switch already plays there; the glitch is for in-panel moves.
  entering = true;
  showProjectView(projectId);
  entering = false;
  focusCurrentView();
}

/**
 * Step the hero by `delta` through the visible titles, wrapping.
 * Keyboard only (ArrowLeft / ArrowRight).
 * @param {number} delta -1 or 1
 * @returns {boolean} true when handled
 */
function tuneProjectsHero(delta) {
  if (!isSectionVisible()) return false;

  const visible = visibleIndices();
  if (!visible.length) return false;

  const at = visible.indexOf(heroIndex());
  const from = at === -1 ? 0 : at;
  const to = visible[((from + delta) % visible.length + visible.length) % visible.length];

  tunedIndex = to;
  heroFrozen = false;
  clearTimeout(dwellTimer);
  clearTimeout(returnTimer);
  setHero(to, 'preview');
  playChannelChange();

  if (showOSD) showOSD(`${slot(to)} ${(projects[to].name || '').toUpperCase()}`);
  announce(`Previewing ${projects[to].name}`);
  return true;
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

  clearTimeout(dwellTimer);
  clearTimeout(returnTimer);
  clearTimeout(heroRetuneTimer);
  stopTimecode();
  tunedIndex = null;
  heroFrozen = false;
}
