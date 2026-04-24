/**
 * News Network Channel (CH05)
 *
 * Live tech headlines from the Hacker News API, rendered as an editorial
 * late-night broadcast. One headline at a time, rotating every 6s.
 * Scrolling ticker at the bottom. AbortController cancels the in-flight
 * fetch if the user leaves the channel mid-request.
 *
 * Falls back to a curated list of evergreen web-dev links when the API
 * fails (network, offline, CORS glitch, rate limit).
 *
 * Sets `body.news-active` so the `#intro` section steps aside and the
 * headline owns the screen.
 */

const HN_TOP = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const HN_ITEM = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const STORY_COUNT = 12;
const ROTATION_MS = 6000;

const FALLBACK_STORIES = [
  { title: 'MDN Web Docs — the reference for web standards', by: 'mozilla', url: 'https://developer.mozilla.org/' },
  { title: 'web.dev — guidance from the Chrome DevRel team', by: 'google', url: 'https://web.dev/' },
  { title: 'Can I Use — compatibility tables for modern browsers', by: 'fyrd', url: 'https://caniuse.com/' },
  { title: 'TypeScript handbook and playground', by: 'microsoft', url: 'https://www.typescriptlang.org/docs/' },
  { title: 'Vite — next-generation frontend tooling', by: 'evanyou', url: 'https://vite.dev/' },
  { title: 'Tailwind CSS — utility-first styling at scale', by: 'adamwathan', url: 'https://tailwindcss.com/' },
  { title: 'Three.js gallery — WebGL rendered in the browser', by: 'mrdoob', url: 'https://threejs.org/' },
  { title: 'State of JS — annual survey of the JavaScript ecosystem', by: 'sacha', url: 'https://stateofjs.com/' },
  { title: 'CSS-Tricks — deep dives on selectors, grid, animations', by: 'chriscoyier', url: 'https://css-tricks.com/' },
  { title: 'Smashing Magazine — essays on frontend craft', by: 'smashing', url: 'https://www.smashingmagazine.com/' },
  { title: 'Lighthouse — performance, a11y and SEO audits', by: 'google', url: 'https://developer.chrome.com/docs/lighthouse/' },
  { title: 'The A11y Project — a practical web accessibility checklist', by: 'a11yproject', url: 'https://www.a11yproject.com/' },
];

let container = null;
let stories = [];
let currentIndex = 0;
let rotationTimer = null;
let listenerController = null;
let active = false;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function formatStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${date} · ${time}`;
}

// ---------------------------------------------------------------
// Networking — AbortController-aware
// ---------------------------------------------------------------

async function fetchStories(signal) {
  const topRes = await fetch(HN_TOP, { signal });
  if (!topRes.ok) throw new Error(`HN top: HTTP ${topRes.status}`);
  const ids = await topRes.json();
  const picks = Array.isArray(ids) ? ids.slice(0, STORY_COUNT) : [];

  const items = await Promise.all(
    picks.map((id) =>
      fetch(HN_ITEM(id), { signal })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  return items
    .filter((s) => s && typeof s.title === 'string')
    .map((s) => ({
      title: s.title,
      by: s.by || 'anonymous',
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      score: typeof s.score === 'number' ? s.score : 0,
    }));
}

// ---------------------------------------------------------------
// Rendering — minimal editorial composition
// ---------------------------------------------------------------

function renderLoading() {
  container.innerHTML = `
    <section class="news">
      <header class="news-strip">
        <span class="news-tag"><span class="news-dot"></span>NEWS</span>
        <span class="news-stamp">${formatStamp()}</span>
      </header>
      <div class="news-stage news-stage--loading" aria-busy="true">
        <span class="news-loading-label">Tuning in</span>
        <span class="news-loading-dots"><span></span><span></span><span></span></span>
      </div>
    </section>
  `;
}

function render() {
  if (!container || stories.length === 0) return;

  const story = stories[currentIndex];
  const tickerItems = stories
    .map((s) => `<span class="news-ticker-item">${escapeHtml(s.title)}</span>`)
    .join('<span class="news-ticker-sep">·</span>');

  const scoreLabel = story.score
    ? `<span class="news-attr-separator">·</span><span class="news-score">${story.score} upvotes</span>`
    : '';

  container.innerHTML = `
    <section class="news">
      <header class="news-strip">
        <span class="news-tag"><span class="news-dot"></span>NEWS</span>
        <span class="news-stamp">${formatStamp()}</span>
      </header>

      <div class="news-stage" role="link" tabindex="0" aria-label="Open current story">
        <span class="news-index">${String(currentIndex + 1).padStart(2, '0')} / ${String(stories.length).padStart(2, '0')}</span>
        <h2 class="news-headline">${escapeHtml(story.title)}</h2>
        <div class="news-attr">
          <span class="news-source">${escapeHtml(story.by)}</span>
          ${scoreLabel}
        </div>
      </div>

      <div class="news-ticker" aria-hidden="true">
        <div class="news-ticker-track">${tickerItems}<span class="news-ticker-sep">·</span>${tickerItems}</div>
      </div>
    </section>
  `;
}

// ---------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------

function scheduleRotation() {
  clearTimeout(rotationTimer);
  rotationTimer = setTimeout(() => {
    currentIndex = (currentIndex + 1) % stories.length;
    render();
    scheduleRotation();
  }, ROTATION_MS);
}

function next() {
  if (stories.length === 0) return;
  currentIndex = (currentIndex + 1) % stories.length;
  render();
  scheduleRotation();
}

function prev() {
  if (stories.length === 0) return;
  currentIndex = (currentIndex - 1 + stories.length) % stories.length;
  render();
  scheduleRotation();
}

function openCurrent() {
  const story = stories[currentIndex];
  if (story && story.url) {
    window.open(story.url, '_blank', 'noopener,noreferrer');
  }
}

// ---------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------

export function startNewsChannel() {
  container = document.getElementById('news-channel');
  if (!container || active) return;

  active = true;
  container.classList.add('visible');
  document.body.classList.add('news-active');

  listenerController = new AbortController();
  const { signal } = listenerController;

  container.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('.remote-control')) return;
      if (e.target.closest('.news-stage')) openCurrent();
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

  renderLoading();
  currentIndex = 0;

  fetchStories(signal)
    .then((fresh) => {
      if (!active) return;
      stories = fresh.length > 0 ? fresh : FALLBACK_STORIES;
      render();
      scheduleRotation();
    })
    .catch((err) => {
      if (err && err.name === 'AbortError') return;
      if (!active) return;
      console.debug('News fetch failed, using fallback:', err.message);
      stories = FALLBACK_STORIES;
      render();
      scheduleRotation();
    });
}

export function stopNewsChannel() {
  if (!active) return;
  active = false;
  clearTimeout(rotationTimer);
  rotationTimer = null;
  if (listenerController) {
    listenerController.abort();
    listenerController = null;
  }
  if (container) {
    container.classList.remove('visible');
    container.innerHTML = '';
  }
  document.body.classList.remove('news-active');
  stories = [];
  currentIndex = 0;
}
