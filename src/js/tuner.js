/**
 * Dead Channel Tuner Module
 * Interactive TV tuner on CH07 — tune through static to discover hidden stations
 */

import {
  getAudioContext,
  isSoundEnabled,
  playTeletextBeep,
  playVictory,
} from './audio.js';

// ============================================
// CONSTANTS
// ============================================

const TUNING_SENSITIVITY = 0.06;
const LOCK_TIME = 1.5; // seconds to lock a station
const LOCK_THRESHOLD = 0.85;
const NOISE_SIZE = 256;

const STATIONS = [
  { freq: 0.15, label: 'COLOR BARS', tone: 440 },
  { freq: 0.40, label: 'TEST CARD', tone: 523 },
  { freq: 0.65, label: 'STANDBY', tone: 659 },
  { freq: 0.88, label: 'OFF AIR', tone: 784 },
];

// SMPTE color bar palette
const SMPTE_COLORS = [
  '#c0c0c0', '#c0c000', '#00c0c0', '#00c000',
  '#c000c0', '#c00000', '#0000c0',
];

const COLORS = {
  bg: '#0a0a14',
  text: '#e0e0e0',
  textDim: 'rgba(224, 224, 224, 0.4)',
  barBg: 'rgba(0, 0, 0, 0.6)',
  barCursor: '#00ffcc',
  barStation: '#ffcc00',
  barFound: '#00ff66',
  scanline: 'rgba(0, 0, 0, 0.12)',
};

// ============================================
// STATE
// ============================================

let canvas = null;
let ctx = null;
let animFrameId = null;
let resizeObserver = null;
let lastTime = 0;

let frequency = 0.5;
let signalStrength = 0;
let nearestStationIdx = -1;
let lockTimer = 0;
let lockTarget = -1;
let found = [false, false, false, false];
let allFound = false;
let showInstructions = true;
let instructionOpacity = 1;
let introTimer = 0;
let introPhase = 0; // 0 = "NO SIGNAL", 1 = interactive

// Noise texture
let noiseCanvas = null;
let noiseCtx = null;

// Station offscreen canvases
let stationCanvases = [];

// Audio nodes
let noiseSource = null;
let noiseGain = null;
let toneOsc = null;
let toneGain = null;
let audioStarted = false;

// Input
let keysDown = {};
let onKeyDown = null;
let onKeyUp = null;
let onPointerMove = null;
let onPointerDown = null;

// Callbacks (set by channels.js via setChannel)
let showOSD = null;

// ============================================
// NOISE TEXTURE
// ============================================

function createNoiseTexture() {
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = NOISE_SIZE;
  noiseCanvas.height = NOISE_SIZE;
  noiseCtx = noiseCanvas.getContext('2d');
  regenerateNoise();
}

function regenerateNoise() {
  const imageData = noiseCtx.createImageData(NOISE_SIZE, NOISE_SIZE);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  noiseCtx.putImageData(imageData, 0, 0);
}

// ============================================
// STATION RENDERERS
// ============================================

function preRenderStations(w, h) {
  stationCanvases = STATIONS.map((_, i) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const octx = offscreen.getContext('2d');

    if (i === 0) drawColorBars(octx, w, h);
    else if (i === 1) drawTestCard(octx, w, h);
    else if (i === 2) drawStandby(octx, w, h);
    else if (i === 3) drawOffAir(octx, w, h);

    return offscreen;
  });
}

function drawColorBars(c, w, h) {
  const barW = w / 7;
  const mainH = h * 0.75;

  // Main bars
  SMPTE_COLORS.forEach((color, i) => {
    c.fillStyle = color;
    c.fillRect(i * barW, 0, barW + 1, mainH);
  });

  // Bottom strip — reversed smaller bars
  const stripH = h * 0.08;
  const reversed = ['#0000c0', '#000000', '#c000c0', '#000000', '#00c0c0', '#000000', '#c0c0c0'];
  reversed.forEach((color, i) => {
    c.fillStyle = color;
    c.fillRect(i * barW, mainH, barW + 1, stripH);
  });

  // Bottom gradient strip
  const gradY = mainH + stripH;
  const gradH = h - gradY;
  for (let x = 0; x < w; x++) {
    const t = x / w;
    const v = Math.round(t * 255);
    c.fillStyle = `rgb(${v},${v},${v})`;
    c.fillRect(x, gradY, 1, gradH);
  }

  // Station ID text
  c.fillStyle = 'rgba(255, 255, 255, 0.7)';
  c.font = `${Math.max(12, h * 0.025)}px "Press Start 2P", monospace`;
  c.textAlign = 'center';
  c.fillText('SMPTE COLOR BARS', w / 2, h * 0.9);
}

function drawTestCard(c, w, h) {
  c.fillStyle = '#1a1a2e';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.35;

  // Outer circle
  c.strokeStyle = '#e0e0e0';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.stroke();

  // Inner circle
  c.beginPath();
  c.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
  c.stroke();

  // Crosshair
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx - r, cy);
  c.lineTo(cx + r, cy);
  c.moveTo(cx, cy - r);
  c.lineTo(cx, cy + r);
  c.stroke();

  // Corner markers
  const gridColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44'];
  const corners = [
    [cx - r * 0.5, cy - r * 0.5],
    [cx + r * 0.5, cy - r * 0.5],
    [cx - r * 0.5, cy + r * 0.5],
    [cx + r * 0.5, cy + r * 0.5],
  ];
  corners.forEach(([x, y], i) => {
    c.fillStyle = gridColors[i];
    c.fillRect(x - 8, y - 8, 16, 16);
  });

  // Resolution wedges (diagonal lines)
  c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  c.lineWidth = 1;
  for (let a = 0; a < 8; a++) {
    const angle = (a / 8) * Math.PI * 2;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(angle) * r * 0.3, cy + Math.sin(angle) * r * 0.3);
    c.stroke();
  }

  // Center text
  c.fillStyle = '#e0e0e0';
  c.font = `bold ${Math.max(14, h * 0.04)}px "Press Start 2P", monospace`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('PM5544', cx, cy + r * 0.15);

  // Top text
  c.font = `${Math.max(10, h * 0.02)}px "Press Start 2P", monospace`;
  c.fillText('TEST CARD', cx, h * 0.08);

  // Frequency text
  c.fillStyle = 'rgba(255, 255, 255, 0.5)';
  c.fillText('625 LINES  50Hz', cx, h * 0.92);
}

function drawStandby(c, w, h) {
  // Dark gradient background
  const grad = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(1, '#0a0a14');
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);

  // Decorative border
  const pad = Math.min(w, h) * 0.08;
  c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  c.lineWidth = 2;
  c.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

  // Inner border
  c.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  c.lineWidth = 1;
  c.strokeRect(pad + 8, pad + 8, w - pad * 2 - 16, h - pad * 2 - 16);

  // Main text
  c.fillStyle = '#e0e0e0';
  c.font = `${Math.max(16, h * 0.06)}px "Press Start 2P", monospace`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('PLEASE', w / 2, h * 0.4);
  c.fillText('STAND BY', w / 2, h * 0.52);

  // Badge
  c.fillStyle = 'rgba(255, 255, 255, 0.4)';
  c.font = `${Math.max(8, h * 0.018)}px "Press Start 2P", monospace`;
  c.fillText('PORTFOLIO TV', w / 2, h * 0.72);

  // Horizontal line divider
  c.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(w * 0.3, h * 0.63);
  c.lineTo(w * 0.7, h * 0.63);
  c.stroke();
}

function drawOffAir(c, w, h) {
  c.fillStyle = '#0a0a14';
  c.fillRect(0, 0, w, h);

  // Main text
  c.fillStyle = '#e0e0e0';
  c.font = `${Math.max(20, h * 0.08)}px "Press Start 2P", monospace`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('OFF AIR', w / 2, h * 0.35);

  // Clock
  const now = new Date();
  const timeStr = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
  c.font = `${Math.max(14, h * 0.05)}px "Press Start 2P", monospace`;
  c.fillStyle = '#00ffcc';
  c.fillText(timeStr, w / 2, h * 0.55);

  // Channel ID
  c.fillStyle = 'rgba(255, 255, 255, 0.3)';
  c.font = `${Math.max(8, h * 0.018)}px "Press Start 2P", monospace`;
  c.fillText('CH 07  PORTFOLIO TV', w / 2, h * 0.75);

  // Blinking dot
  if (now.getSeconds() % 2 === 0) {
    c.fillStyle = '#ff4444';
    c.beginPath();
    c.arc(w / 2, h * 0.82, 4, 0, Math.PI * 2);
    c.fill();
  }
}

// ============================================
// AUDIO
// ============================================

function startAudio() {
  if (!isSoundEnabled() || audioStarted) return;

  try {
    const actx = getAudioContext();

    // Continuous noise
    const bufferSize = Math.floor(actx.sampleRate * 5);
    const noiseBuffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    noiseSource = actx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = actx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    noiseGain = actx.createGain();
    noiseGain.gain.value = 0.08;

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(actx.destination);
    noiseSource.start();

    // Carrier tone
    toneOsc = actx.createOscillator();
    toneOsc.type = 'sine';
    toneOsc.frequency.value = 440;

    toneGain = actx.createGain();
    toneGain.gain.value = 0;

    toneOsc.connect(toneGain);
    toneGain.connect(actx.destination);
    toneOsc.start();

    audioStarted = true;
  } catch (e) {
    console.warn('Tuner audio error:', e);
  }
}

function stopAudio() {
  try {
    if (noiseSource) {
      noiseSource.stop();
      noiseSource.disconnect();
      noiseSource = null;
    }
    if (noiseGain) {
      noiseGain.disconnect();
      noiseGain = null;
    }
    if (toneOsc) {
      toneOsc.stop();
      toneOsc.disconnect();
      toneOsc = null;
    }
    if (toneGain) {
      toneGain.disconnect();
      toneGain = null;
    }
  } catch (e) {
    // Nodes may already be disconnected
  }
  audioStarted = false;
}

function updateAudio() {
  if (!audioStarted) {
    if (isSoundEnabled()) startAudio();
    return;
  }
  if (!isSoundEnabled()) {
    stopAudio();
    return;
  }

  if (noiseGain) {
    noiseGain.gain.value = 0.08 * (1 - signalStrength * 0.85);
  }
  if (toneGain && toneOsc) {
    toneGain.gain.value = 0.06 * signalStrength;
    if (nearestStationIdx >= 0) {
      toneOsc.frequency.value = STATIONS[nearestStationIdx].tone;
    }
  }
}

// ============================================
// INPUT
// ============================================

function bindInput() {
  onKeyDown = (e) => {
    if (['m', 'M', 'p', 'P', '?', 'Escape'].includes(e.key)) return;
    keysDown[e.key] = true;
  };

  onKeyUp = (e) => {
    delete keysDown[e.key];
  };

  onPointerMove = (e) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    frequency = Math.max(0, Math.min(1, (x - rect.left) / rect.width));


    if (showInstructions) {
      showInstructions = false;
    }
  };

  onPointerDown = (e) => {
    if (e.target.closest('.remote-control')) return;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    frequency = Math.max(0, Math.min(1, (x - rect.left) / rect.width));


    if (showInstructions) {
      showInstructions = false;
    }

    // Start audio on first interaction (browser policy)
    if (!audioStarted && isSoundEnabled()) {
      startAudio();
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('touchmove', onPointerMove, { passive: true });
  document.addEventListener('mousedown', onPointerDown);
  document.addEventListener('touchstart', onPointerDown, { passive: true });
}

function unbindInput() {
  if (onKeyDown) document.removeEventListener('keydown', onKeyDown);
  if (onKeyUp) document.removeEventListener('keyup', onKeyUp);
  if (onPointerMove) {
    document.removeEventListener('mousemove', onPointerMove);
    document.removeEventListener('touchmove', onPointerMove);
  }
  if (onPointerDown) {
    document.removeEventListener('mousedown', onPointerDown);
    document.removeEventListener('touchstart', onPointerDown);
  }
  onKeyDown = null;
  onKeyUp = null;
  onPointerMove = null;
  onPointerDown = null;
  keysDown = {};
}

// ============================================
// UPDATE
// ============================================

function calcSignalStrength() {
  let bestStrength = 0;
  let bestIdx = -1;

  for (let i = 0; i < STATIONS.length; i++) {
    const dist = Math.abs(frequency - STATIONS[i].freq);
    const strength = Math.max(0, 1 - dist / TUNING_SENSITIVITY);
    if (strength > bestStrength) {
      bestStrength = strength;
      bestIdx = i;
    }
  }

  signalStrength = bestStrength;
  nearestStationIdx = bestIdx;
}

function updateLock(dt) {
  if (signalStrength >= LOCK_THRESHOLD && nearestStationIdx >= 0) {
    if (lockTarget !== nearestStationIdx) {
      lockTarget = nearestStationIdx;
      lockTimer = 0;
    }

    if (!found[nearestStationIdx]) {
      lockTimer += dt;
      if (lockTimer >= LOCK_TIME) {
        found[nearestStationIdx] = true;
        sessionStorage.setItem('tunerFound', JSON.stringify(found));
        playTeletextBeep();
        if (showOSD) showOSD('SIGNAL LOCKED');

        if (!allFound && found.every(Boolean)) {
          allFound = true;
          setTimeout(() => {
            playVictory();
            if (showOSD) showOSD('ALL STATIONS FOUND');
          }, 500);
        }
      }
    }
  } else {
    lockTimer = 0;
    lockTarget = -1;
  }
}

function updateKeyboardInput(dt) {
  if (keysDown['ArrowLeft']) {
    frequency = Math.max(0, frequency - 0.3 * dt);
    if (showInstructions) showInstructions = false;
  }
  if (keysDown['ArrowRight']) {
    frequency = Math.min(1, frequency + 0.3 * dt);
    if (showInstructions) showInstructions = false;
  }
}

// ============================================
// RENDERING
// ============================================

function render() {
  if (!ctx || !canvas) return;

  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  if (introPhase === 0) {
    drawNoSignal(w, h);
    drawScanlines(w, h);
    return;
  }

  // Static noise
  drawNoise(w, h);

  // Station content
  if (signalStrength > 0 && nearestStationIdx >= 0) {
    drawStation(w, h);
  }

  // Interference bands
  drawInterference(w, h);

  // Scanlines
  drawScanlines(w, h);

  // Frequency indicator bar
  drawFreqBar(w, h);

  // Instructions
  if (showInstructions && instructionOpacity > 0) {
    drawInstructions(w, h);
  }
}

function drawNoSignal(w, h) {
  // Mild static
  drawNoise(w, h);

  ctx.fillStyle = COLORS.text;
  ctx.font = `${Math.max(16, h * 0.05)}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NO SIGNAL', w / 2, h / 2);
}

function drawNoise(w, h) {
  if (!noiseCanvas) return;

  const noiseOpacity = 1 - signalStrength * 0.7;
  ctx.globalAlpha = noiseOpacity;

  // Tile noise texture with random offset for animation
  const ox = Math.random() * NOISE_SIZE;
  const oy = Math.random() * NOISE_SIZE;

  // Scale noise to fill canvas (tiles naturally via repeated draws)
  const scale = Math.max(2, Math.ceil(Math.max(w, h) / NOISE_SIZE));
  for (let ty = -1; ty <= scale; ty++) {
    for (let tx = -1; tx <= scale; tx++) {
      ctx.drawImage(
        noiseCanvas,
        ox + tx * NOISE_SIZE,
        oy + ty * NOISE_SIZE,
        NOISE_SIZE,
        NOISE_SIZE
      );
    }
  }

  ctx.globalAlpha = 1;

  // Regenerate noise occasionally for variation
  if (Math.random() < 0.1) {
    regenerateNoise();
  }
}

function drawStation(w, h) {
  // Re-render off-air station each frame for live clock
  if (nearestStationIdx === 3 && stationCanvases[3]) {
    const offCtx = stationCanvases[3].getContext('2d');
    drawOffAir(offCtx, w, h);
  }

  const stationCanvas = stationCanvases[nearestStationIdx];
  if (!stationCanvas) return;

  ctx.globalAlpha = signalStrength;
  ctx.drawImage(stationCanvas, 0, 0, w, h);
  ctx.globalAlpha = 1;
}

function drawInterference(w, h) {
  const intensity = 1 - signalStrength;
  if (intensity < 0.05) return;

  ctx.globalAlpha = intensity * 0.4;

  // 2-3 horizontal interference bands that drift
  const time = performance.now() / 1000;
  for (let i = 0; i < 3; i++) {
    const y = ((time * (0.3 + i * 0.15) + i * 0.33) % 1) * h;
    const bandH = 2 + Math.random() * 4;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`;
    ctx.fillRect(0, y, w, bandH);
  }

  ctx.globalAlpha = 1;
}

function drawScanlines(w, h) {
  ctx.fillStyle = COLORS.scanline;
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
}

function drawFreqBar(w, h) {
  const barH = 6;
  const barY = 40;
  const barX = w * 0.1;
  const barW = w * 0.8;

  // Background
  ctx.fillStyle = COLORS.barBg;
  ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);

  // Bar track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(barX, barY, barW, barH);

  // Station markers
  STATIONS.forEach((station, i) => {
    const sx = barX + station.freq * barW;
    if (found[i]) {
      // Discovered — bright dot
      ctx.fillStyle = COLORS.barFound;
      ctx.beginPath();
      ctx.arc(sx, barY + barH / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Undiscovered — dim tick
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(sx - 0.5, barY - 2, 1, barH + 4);
    }
  });

  // Cursor
  const cursorX = barX + frequency * barW;

  // Glow when near station
  if (signalStrength > 0) {
    ctx.fillStyle = `rgba(0, 255, 204, ${signalStrength * 0.4})`;
    ctx.beginPath();
    ctx.arc(cursorX, barY + barH / 2, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cursor line
  ctx.fillStyle = COLORS.barCursor;
  ctx.fillRect(cursorX - 1.5, barY - 6, 3, barH + 12);

  // Lock progress indicator
  if (lockTimer > 0 && lockTarget >= 0 && !found[lockTarget]) {
    const progress = Math.min(1, lockTimer / LOCK_TIME);
    ctx.strokeStyle = COLORS.barFound;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cursorX, barY + barH / 2, 10, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();
  }

  // Discovery counter
  const foundCount = found.filter(Boolean).length;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = `${Math.max(8, h * 0.014)}px "Press Start 2P", monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`${foundCount}/${STATIONS.length} FOUND`, barX + barW, barY + barH + 10);
}

function drawInstructions(w, h) {
  ctx.globalAlpha = instructionOpacity;

  const isTouchDevice = 'ontouchstart' in window;
  const text = isTouchDevice ? 'DRAG TO TUNE' : 'MOVE TO TUNE';

  ctx.fillStyle = COLORS.text;
  ctx.font = `${Math.max(12, h * 0.028)}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  const hintText = isTouchDevice ? 'FIND HIDDEN STATIONS' : 'ARROW KEYS FOR FINE TUNING';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = `${Math.max(8, h * 0.016)}px "Press Start 2P", monospace`;
  ctx.fillText(hintText, w / 2, h / 2 + h * 0.06);
  ctx.fillText('HOME or CH+/- TO EXIT', w / 2, h * 0.75);

  ctx.globalAlpha = 1;
}

// ============================================
// RESIZE
// ============================================

function handleResize() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx = canvas.getContext('2d');

  // Re-render station canvases at new size
  preRenderStations(canvas.width, canvas.height);
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop(timestamp) {
  if (!canvas) return;

  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
  lastTime = timestamp;

  // Intro phase
  if (introPhase === 0) {
    introTimer += dt;
    if (introTimer >= 1.2) {
      introPhase = 1;
      if (showOSD) showOSD('NO SIGNAL');
    }
  }

  // Fade instructions
  if (!showInstructions && instructionOpacity > 0) {
    instructionOpacity = Math.max(0, instructionOpacity - dt * 2);
  }

  if (introPhase === 1) {
    updateKeyboardInput(dt);
    calcSignalStrength();
    updateLock(dt);
    updateAudio();
  }

  render();

  animFrameId = requestAnimationFrame(gameLoop);
}

// ============================================
// PUBLIC API
// ============================================

export function setTunerCallbacks(callbacks) {
  if (callbacks.showOSD) showOSD = callbacks.showOSD;
}

export function startTuner() {
  canvas = document.getElementById('tuner-canvas');
  if (!canvas) return;

  // Load discovery state
  try {
    const saved = JSON.parse(sessionStorage.getItem('tunerFound'));
    if (Array.isArray(saved) && saved.length === 4) {
      found = saved;
      allFound = found.every(Boolean);
    }
  } catch (e) {
    found = [false, false, false, false];
    allFound = false;
  }

  document.body.classList.add('tuner-active');
  canvas.classList.add('visible');
  handleResize();

  // Reset state
  frequency = 0.5;
  signalStrength = 0;
  nearestStationIdx = -1;
  lockTimer = 0;
  lockTarget = -1;
  showInstructions = true;
  instructionOpacity = 1;
  introTimer = 0;
  introPhase = 0;

  createNoiseTexture();
  bindInput();

  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(canvas);

  lastTime = 0;
  animFrameId = requestAnimationFrame(gameLoop);
}

export function stopTuner() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  unbindInput();
  stopAudio();

  if (canvas) {
    canvas.classList.remove('visible');
  }

  document.body.classList.remove('tuner-active');
  canvas = null;
  ctx = null;
  lastTime = 0;
  noiseCanvas = null;
  noiseCtx = null;
  stationCanvases = [];
}
