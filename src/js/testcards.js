/**
 * Test Cards Module
 * Procedural broadcast-style test cards for CH05 (SMPTE color bars) and
 * CH06 ("Please Stand By"). Static renders — redrawn only on resize — so
 * they add almost no runtime cost.
 *
 * Intended as placeholders until dedicated content is designed for these
 * channels. Replace by swapping `startTestCard(variant)` for a richer
 * channel module and wiring it in `channels.js`.
 */

// SMPTE primary bars (left to right): grey, yellow, cyan, green, magenta, red, blue
const SMPTE_PRIMARY = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
// Castellation row (below primary bars): blue, black, magenta, black, cyan, black, grey
const SMPTE_CASTELLATION = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'];
// Bottom row (PLUGE): dark blue, white, dark purple, then pluge strip
const SMPTE_PLUGE = ['#131366', '#ffffff', '#3c0a54', '#131313'];

let canvas = null;
let ctx = null;
let resizeObserver = null;
let currentVariant = null;

function getCanvas() {
  if (canvas) return canvas;
  canvas = document.getElementById('testcard-canvas');
  if (!canvas) return null;
  ctx = canvas.getContext('2d');
  return canvas;
}

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  if (!ctx || !canvas) return;
  if (currentVariant === 'smpte') drawSMPTE();
  else if (currentVariant === 'standby') drawStandby();
}

function drawSMPTE() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w === 0 || h === 0) return;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  // Primary bars — top 2/3
  const primaryH = h * 0.67;
  const barW = w / SMPTE_PRIMARY.length;
  SMPTE_PRIMARY.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * barW, 0, barW + 1, primaryH);
  });

  // Castellation row — ~8% of height
  const castY = primaryH;
  const castH = h * 0.08;
  SMPTE_CASTELLATION.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * barW, castY, barW + 1, castH);
  });

  // PLUGE row — bottom ~25%
  const plugeY = castY + castH;
  const plugeH = h - plugeY;
  // Split into 6 segments: 1/6 dark blue, 2/6 white, 1/6 dark purple,
  // then 3 narrow pluge strips in the remaining 2/6
  const segW = w / 6;
  ctx.fillStyle = SMPTE_PLUGE[0];
  ctx.fillRect(0, plugeY, segW, plugeH);
  ctx.fillStyle = SMPTE_PLUGE[1];
  ctx.fillRect(segW, plugeY, segW * 2, plugeH);
  ctx.fillStyle = SMPTE_PLUGE[2];
  ctx.fillRect(segW * 3, plugeY, segW, plugeH);
  // PLUGE: -4% | 0% | +4% grey bars
  const plugeStripW = (segW * 2) / 3;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(segW * 4, plugeY, plugeStripW, plugeH);
  ctx.fillStyle = SMPTE_PLUGE[3];
  ctx.fillRect(segW * 4 + plugeStripW, plugeY, plugeStripW, plugeH);
  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(segW * 4 + plugeStripW * 2, plugeY, plugeStripW, plugeH);

  // Label
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  const labelW = w * 0.22;
  const labelH = h * 0.08;
  const labelX = (w - labelW) / 2;
  const labelY = h * 0.30;
  ctx.fillRect(labelX, labelY, labelW, labelH);
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.max(10, Math.floor(h * 0.03))}px "IBM Plex Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SMPTE · CH05 · 1kHz', w / 2, labelY + labelH / 2);
}

function drawStandby() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w === 0 || h === 0) return;

  // Deep blue broadcast background
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
  gradient.addColorStop(0, '#0b1a38');
  gradient.addColorStop(1, '#03071a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.32;

  // Outer circle
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = Math.max(2, Math.floor(r * 0.012));
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Inner crosshair
  ctx.strokeStyle = 'rgba(255, 204, 0, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();

  // Tick marks around the circle (every 30°)
  ctx.strokeStyle = 'rgba(255, 204, 0, 0.9)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const tickLen = r * 0.08;
    const x1 = cx + Math.cos(angle) * (r - tickLen);
    const y1 = cy + Math.sin(angle) * (r - tickLen);
    const x2 = cx + Math.cos(angle) * r;
    const y2 = cy + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Main title
  ctx.fillStyle = '#ffcc00';
  ctx.font = `bold ${Math.max(16, Math.floor(h * 0.06))}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PLEASE STAND BY', cx, cy - r - h * 0.08);

  // Subtitle inside circle
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.max(10, Math.floor(h * 0.025))}px "IBM Plex Mono", monospace`;
  ctx.fillText('CH06 · TRANSMISSION PAUSED', cx, cy);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = `${Math.max(8, Math.floor(h * 0.018))}px "IBM Plex Mono", monospace`;
  ctx.fillText('NEW CONTENT COMING SOON', cx, cy + h * 0.035);

  // Bottom identifier
  ctx.fillStyle = 'rgba(255, 204, 0, 0.7)';
  ctx.font = `${Math.max(9, Math.floor(h * 0.022))}px "IBM Plex Mono", monospace`;
  ctx.fillText('PORTFOLIO BROADCAST SYSTEM', cx, cy + r + h * 0.08);
}

/**
 * Start a test card channel.
 * @param {'smpte' | 'standby'} variant
 */
export function startTestCard(variant) {
  if (!getCanvas()) return;
  currentVariant = variant;
  canvas.classList.add('visible');

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
  }
  resizeCanvas();
}

/**
 * Stop the test card channel.
 */
export function stopTestCard() {
  if (!canvas) return;
  canvas.classList.remove('visible');
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  currentVariant = null;
}
