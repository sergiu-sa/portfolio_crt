/**
 * Commercial Break Channel (CH06)
 *
 * Each project in `src/data/projects.js` becomes a ten-second animated
 * full-screen "commercial". The data is the single source of truth —
 * a new project in projects.js becomes a new commercial automatically.
 *
 * Sets `body.commercial-active` while running so the `#intro` section
 * gets out of the way and the channel is the hero.
 */

import { projects } from '../data/projects.js';

const COMMERCIAL_DURATION_MS = 10000;
const TAG_COLORS = ['tag-red', 'tag-green', 'tag-yellow', 'tag-blue'];

let container = null;
let currentIndex = 0;
let cycleTimer = null;
let listenerController = null;
let active = false;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function escapeCssUrl(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function render(index) {
  if (!container) return;
  const project = projects[index];
  if (!project) return;

  const tagsHtml = project.tags
    .map(
      (t, i) =>
        `<span class="commercial-tag ${TAG_COLORS[i % TAG_COLORS.length]}">${escapeHtml(t)}</span>`
    )
    .join('');

  const imageUrl = (project.images && project.images[0]) || '';

  // Tip: description is kept to one breathing line, no labels, no counter.
  container.innerHTML = `
    <article class="commercial" aria-label="${escapeHtml(project.name)}">
      <div class="commercial-hero" style="background-image: url('${escapeCssUrl(imageUrl)}')" aria-hidden="true"></div>
      <div class="commercial-overlay" aria-hidden="true"></div>
      <div class="commercial-content">
        <div class="commercial-tags">${tagsHtml}</div>
        <h2 class="commercial-title">${escapeHtml(project.name.toUpperCase())}</h2>
        <p class="commercial-desc">${escapeHtml(project.description)}</p>
        <div class="commercial-action">
          <span class="commercial-action-arrow" aria-hidden="true">&rarr;</span>
          <span class="commercial-action-text">VISIT</span>
        </div>
      </div>
      <div class="commercial-progress" aria-hidden="true"></div>
    </article>
  `;
}

function scheduleCycle() {
  clearTimeout(cycleTimer);
  cycleTimer = setTimeout(() => {
    currentIndex = (currentIndex + 1) % projects.length;
    render(currentIndex);
    scheduleCycle();
  }, COMMERCIAL_DURATION_MS);
}

function next() {
  currentIndex = (currentIndex + 1) % projects.length;
  render(currentIndex);
  scheduleCycle();
}

function prev() {
  currentIndex = (currentIndex - 1 + projects.length) % projects.length;
  render(currentIndex);
  scheduleCycle();
}

function openCurrent() {
  const project = projects[currentIndex];
  if (!project) return;
  const url = project.live || project.github;
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

export function startCommercials() {
  container = document.getElementById('commercial-channel');
  if (!container || active || projects.length === 0) return;

  active = true;
  container.classList.add('visible');
  document.body.classList.add('commercial-active');

  listenerController = new AbortController();
  const { signal } = listenerController;

  container.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('.remote-control')) return;
      openCurrent();
    },
    { signal }
  );

  document.addEventListener(
    'keydown',
    (e) => {
      if (['m', 'M', 'p', 'P', '?', 'Escape'].includes(e.key)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        openCurrent();
      }
    },
    { signal }
  );

  currentIndex = 0;
  render(currentIndex);
  scheduleCycle();
}

export function stopCommercials() {
  if (!active) return;
  active = false;
  clearTimeout(cycleTimer);
  cycleTimer = null;
  if (listenerController) {
    listenerController.abort();
    listenerController = null;
  }
  if (container) {
    container.classList.remove('visible');
    container.innerHTML = '';
  }
  document.body.classList.remove('commercial-active');
}
