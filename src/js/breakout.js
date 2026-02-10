/**
 * Breakout Game Module
 * Retro Breakout arcade game rendered on canvas with classic Atari colors
 */

import {
  playBrickBreak,
  playGameOver,
  playVictory,
  playTeletextBeep,
  playNavigationClick,
  playStaticBurst,
} from './audio.js';

// ============================================
// CONSTANTS
// ============================================

// Classic Atari Breakout palette
const COLORS = {
  bg: '#0a0a14',
  paddle: '#e0e0e0',
  ball: '#ffffff',
  ballGlow: 'rgba(255, 255, 255, 0.12)',
  text: '#e0e0e0',
  textDim: 'rgba(224, 224, 224, 0.5)',
  scanline: 'rgba(0, 0, 0, 0.12)',
  // Brick rows — warm at top, cool at bottom 
  brickRows: [
    'rgb(255, 100, 100)',
    'rgb(255, 160, 80)',
    'rgb(255, 200, 100)',
    'rgb(100, 255, 150)',
    'rgb(100, 150, 255)',
  ],
};

const BRICK_COLS = 8;
const BRICK_ROWS = 5;
const BRICK_POINTS = [50, 40, 30, 20, 10];
const MAX_LIVES = 3;

// Normalized game dimensions (0–1 coordinate system)
const PADDLE_W = 0.12;
const PADDLE_H = 0.018;
const PADDLE_Y = 0.92;
const BALL_R = 0.008;
const BRICK_TOP = 0.12;
const BRICK_AREA_H = 0.22;
const BRICK_GAP = 0.006;
const BRICK_SIDE_PAD = 0.04;

// Speed (units per second in normalized coords)
const BALL_SPEED_INITIAL = 0.55;
const BALL_SPEED_INCREMENT = 0.003;
const BALL_SPEED_MAX = 1.0;
const PADDLE_SPEED = 0.9; // keyboard movement per second

// ============================================
// STATE
// ============================================

const STATES = { IDLE: 0, PLAYING: 1, GAME_OVER: 2, VICTORY: 3 };

let canvas = null;
let ctx = null;
let animFrameId = null;
let resizeObserver = null;
let lastTime = 0;

// Game state
let state = STATES.IDLE;
let score = 0;
let lives = MAX_LIVES;
let ballSpeed = BALL_SPEED_INITIAL;

// Paddle (normalized)
let paddleX = 0.5 - PADDLE_W / 2;

// Ball (normalized)
let ballX = 0.5;
let ballY = PADDLE_Y - BALL_R - 0.01;
let ballDX = 0;
let ballDY = 0;

// Bricks: 2D array of { alive: bool }
let bricks = [];

// Input tracking
let keysDown = {};
let pointerActive = false;
let pointerX = 0.5;

// Event handler references for cleanup
let onKeyDown = null;
let onKeyUp = null;
let onPointerMove = null;
let onPointerDown = null;
let onPointerUp = null;

// ============================================
// INITIALIZATION
// ============================================

function initBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    const row = [];
    for (let c = 0; c < BRICK_COLS; c++) {
      row.push({ alive: true });
    }
    bricks.push(row);
  }
}

function resetBall() {
  ballX = paddleX + PADDLE_W / 2;
  ballY = PADDLE_Y - BALL_R - 0.01;
  ballDX = 0;
  ballDY = 0;
}

function launchBall() {
  // Random angle between 30–60 degrees upward
  const angle = (Math.PI / 6) + Math.random() * (Math.PI / 6);
  const dir = Math.random() < 0.5 ? -1 : 1;
  ballDX = Math.cos(angle) * ballSpeed * dir;
  ballDY = -Math.sin(angle) * ballSpeed;
}

function resetGame() {
  score = 0;
  lives = MAX_LIVES;
  ballSpeed = BALL_SPEED_INITIAL;
  paddleX = 0.5 - PADDLE_W / 2;
  initBricks();
  resetBall();
  state = STATES.IDLE;
}

// ============================================
// INPUT
// ============================================

function bindInput() {
  onKeyDown = (e) => {
    // Don't consume keys needed by the main app
    if (['m', 'M', 'p', 'P', '?', 'Escape'].includes(e.key)) return;

    keysDown[e.key] = true;

    if (e.key === ' ') {
      e.preventDefault();
      if (state === STATES.IDLE) {
        state = STATES.PLAYING;
        launchBall();
      } else if (state === STATES.GAME_OVER || state === STATES.VICTORY) {
        resetGame();
      }
    }
  };

  onKeyUp = (e) => {
    delete keysDown[e.key];
  };

  // Bind pointer events on document so they work regardless of
  // z-index stacking
  onPointerMove = (e) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    pointerX = (x - rect.left) / rect.width;
    pointerActive = true;
  };

  onPointerDown = (e) => {
    // Ignore clicks on the remote control
    if (e.target.closest('.remote-control')) return;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    pointerX = (x - rect.left) / rect.width;
    pointerActive = true;

    if (state === STATES.IDLE) {
      state = STATES.PLAYING;
      launchBall();
    } else if (state === STATES.GAME_OVER || state === STATES.VICTORY) {
      resetGame();
    }
  };

  onPointerUp = () => {};

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('touchmove', onPointerMove, { passive: true });
  document.addEventListener('mousedown', onPointerDown);
  document.addEventListener('touchstart', onPointerDown, { passive: true });
  document.addEventListener('mouseup', onPointerUp);
  document.addEventListener('touchend', onPointerUp);
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
  if (onPointerUp) {
    document.removeEventListener('mouseup', onPointerUp);
    document.removeEventListener('touchend', onPointerUp);
  }
  onKeyDown = null;
  onKeyUp = null;
  onPointerMove = null;
  onPointerDown = null;
  onPointerUp = null;
  keysDown = {};
  pointerActive = false;
}

// ============================================
// PHYSICS
// ============================================

function updatePaddle(dt) {
  if (pointerActive) {
    paddleX = pointerX - PADDLE_W / 2;
  }

  if (keysDown['ArrowLeft']) {
    paddleX -= PADDLE_SPEED * dt;
  }
  if (keysDown['ArrowRight']) {
    paddleX += PADDLE_SPEED * dt;
  }

  // Clamp
  paddleX = Math.max(0, Math.min(1 - PADDLE_W, paddleX));

  // Ball follows paddle in idle
  if (state === STATES.IDLE) {
    ballX = paddleX + PADDLE_W / 2;
    ballY = PADDLE_Y - BALL_R - 0.01;
  }
}

function updateBall(dt) {
  if (state !== STATES.PLAYING) return;

  ballX += ballDX * dt;
  ballY += ballDY * dt;

  // Wall collisions
  if (ballX - BALL_R <= 0) {
    ballX = BALL_R;
    ballDX = Math.abs(ballDX);
    playNavigationClick();
  } else if (ballX + BALL_R >= 1) {
    ballX = 1 - BALL_R;
    ballDX = -Math.abs(ballDX);
    playNavigationClick();
  }

  if (ballY - BALL_R <= 0) {
    ballY = BALL_R;
    ballDY = Math.abs(ballDY);
    playNavigationClick();
  }

  // Paddle collision
  if (
    ballDY > 0 &&
    ballY + BALL_R >= PADDLE_Y &&
    ballY + BALL_R <= PADDLE_Y + PADDLE_H + 0.02 &&
    ballX >= paddleX &&
    ballX <= paddleX + PADDLE_W
  ) {
    // Hit position on paddle: -1 (left edge) to +1 (right edge)
    const hitPos = ((ballX - paddleX) / PADDLE_W) * 2 - 1;
    // Reflect angle: center = straight up, edges = sharper angle
    const maxAngle = Math.PI / 3; // 60 degrees
    const angle = hitPos * maxAngle;

    ballDX = Math.sin(angle) * ballSpeed;
    ballDY = -Math.cos(angle) * ballSpeed;
    ballY = PADDLE_Y - BALL_R;

    playTeletextBeep();
  }

  // Ball lost below paddle
  if (ballY - BALL_R > 1) {
    lives--;
    playStaticBurst(0.2, 0.1);

    if (lives <= 0) {
      state = STATES.GAME_OVER;
      playGameOver();
    } else {
      resetBall();
      state = STATES.IDLE;
    }
    return;
  }

  // Brick collisions
  checkBrickCollisions();
}

function checkBrickCollisions() {
  const brickW = (1 - BRICK_SIDE_PAD * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
  const brickH = (BRICK_AREA_H - BRICK_GAP * (BRICK_ROWS - 1)) / BRICK_ROWS;

  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (!bricks[r][c].alive) continue;

      const bx = BRICK_SIDE_PAD + c * (brickW + BRICK_GAP);
      const by = BRICK_TOP + r * (brickH + BRICK_GAP);

      // AABB vs circle
      const closestX = Math.max(bx, Math.min(ballX, bx + brickW));
      const closestY = Math.max(by, Math.min(ballY, by + brickH));
      const dx = ballX - closestX;
      const dy = ballY - closestY;

      if (dx * dx + dy * dy <= BALL_R * BALL_R) {
        bricks[r][c].alive = false;
        score += BRICK_POINTS[r];

        // Determine reflection axis
        const overlapLeft = (ballX + BALL_R) - bx;
        const overlapRight = (bx + brickW) - (ballX - BALL_R);
        const overlapTop = (ballY + BALL_R) - by;
        const overlapBottom = (by + brickH) - (ballY - BALL_R);

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          ballDX = -ballDX;
        } else {
          ballDY = -ballDY;
        }

        // Speed up
        ballSpeed = Math.min(BALL_SPEED_MAX, ballSpeed + BALL_SPEED_INCREMENT);
        // Normalize velocity to new speed
        const mag = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
        if (mag > 0) {
          ballDX = (ballDX / mag) * ballSpeed;
          ballDY = (ballDY / mag) * ballSpeed;
        }

        playBrickBreak();

        // Check victory
        const allCleared = bricks.every((row) => row.every((b) => !b.alive));
        if (allCleared) {
          state = STATES.VICTORY;
          playVictory();
        }

        return; // Only one collision per frame
      }
    }
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

  // Draw bricks
  drawBricks(w, h);

  // Draw paddle
  drawPaddle(w, h);

  // Draw ball
  drawBall(w, h);

  // Draw HUD
  drawHUD(w, h);

  // Draw scanlines
  drawScanlines(w, h);

  // Draw state overlays
  const isTouchDevice = 'ontouchstart' in window;
  const startMsg = isTouchDevice ? 'TAP TO START' : 'PRESS SPACE TO START';
  const restartMsg = isTouchDevice ? 'TAP TO RESTART' : 'PRESS SPACE TO RESTART';

  if (state === STATES.IDLE) {
    drawCenteredText(w, h, startMsg, 0.028);
    if (lives < MAX_LIVES) {
      drawCenteredText(w, h, `LIVES: ${lives}`, 0.022, 0.06);
    }
    // Control hints
    const moveHint = isTouchDevice ? 'DRAG TO MOVE' : 'MOUSE or ← → TO MOVE';
    drawHintText(w, h, moveHint, 0.015, 0.82);
    drawHintText(w, h, 'HOME or CH+/- TO EXIT', 0.015, 0.87);
  } else if (state === STATES.GAME_OVER) {
    drawCenteredText(w, h, 'GAME OVER', 0.05);
    drawCenteredText(w, h, `SCORE: ${score}`, 0.03, 0.07);
    drawCenteredText(w, h, restartMsg, 0.02, 0.13);
    drawHintText(w, h, 'HOME or CH+/- TO EXIT', 0.015, 0.87);
  } else if (state === STATES.VICTORY) {
    drawCenteredText(w, h, 'YOU WIN!', 0.05);
    drawCenteredText(w, h, `SCORE: ${score}`, 0.03, 0.07);
    drawCenteredText(w, h, restartMsg, 0.02, 0.13);
    drawHintText(w, h, 'HOME or CH+/- TO EXIT', 0.015, 0.87);
  }
}

function drawBricks(w, h) {
  const brickW = (1 - BRICK_SIDE_PAD * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
  const brickH = (BRICK_AREA_H - BRICK_GAP * (BRICK_ROWS - 1)) / BRICK_ROWS;

  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (!bricks[r][c].alive) continue;

      const bx = BRICK_SIDE_PAD + c * (brickW + BRICK_GAP);
      const by = BRICK_TOP + r * (brickH + BRICK_GAP);

      ctx.fillStyle = COLORS.brickRows[r];
      ctx.fillRect(bx * w, by * h, brickW * w, brickH * h);

      // Inner highlight for 3D feel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(bx * w, by * h, brickW * w, 2);
      ctx.fillRect(bx * w, by * h, 2, brickH * h);
    }
  }
}

function drawPaddle(w, h) {
  const px = paddleX * w;
  const py = PADDLE_Y * h;
  const pw = PADDLE_W * w;
  const ph = PADDLE_H * h;

  // Glow
  ctx.fillStyle = COLORS.ballGlow;
  ctx.fillRect(px - 4, py - 2, pw + 8, ph + 4);

  // Paddle
  ctx.fillStyle = COLORS.paddle;
  ctx.fillRect(px, py, pw, ph);
}

function drawBall(w, h) {
  const bx = ballX * w;
  const by = ballY * h;
  const br = BALL_R * Math.min(w, h);

  // Glow
  ctx.beginPath();
  ctx.arc(bx, by, br * 3, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ballGlow;
  ctx.fill();

  // Ball
  ctx.beginPath();
  ctx.arc(bx, by, br, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ball;
  ctx.fill();
}

function drawHUD(w, h) {
  const fontSize = Math.max(12, h * 0.025);
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.fillStyle = COLORS.text;

  // Score (left)
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score}`, w * 0.04, h * 0.06);

  // Lives (right)
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES ${lives}`, w * 0.96, h * 0.06);
}

function drawScanlines(w, h) {
  ctx.fillStyle = COLORS.scanline;
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
}

function drawCenteredText(w, h, text, sizeRatio, yOffset = 0) {
  const fontSize = Math.max(10, h * sizeRatio);
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + h * yOffset);
}

function drawHintText(w, h, text, sizeRatio, yPos) {
  const fontSize = Math.max(8, h * sizeRatio);
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.fillStyle = COLORS.textDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h * yPos);
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop(timestamp) {
  if (!canvas) return;

  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
  lastTime = timestamp;

  updatePaddle(dt);
  updateBall(dt);
  render();

  animFrameId = requestAnimationFrame(gameLoop);
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
}

// ============================================
// PUBLIC API
// ============================================

export function startBreakout() {
  canvas = document.getElementById('breakout-canvas');
  if (!canvas) return;

  document.body.classList.add('breakout-active');
  canvas.classList.add('visible');
  handleResize();

  resetGame();
  initBricks();

  bindInput();

  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(canvas);

  lastTime = 0;
  animFrameId = requestAnimationFrame(gameLoop);
}

export function stopBreakout() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  unbindInput();

  if (canvas) {
    canvas.classList.remove('visible');
  }

  document.body.classList.remove('breakout-active');
  state = STATES.IDLE;
  canvas = null;
  ctx = null;
  lastTime = 0;
}
