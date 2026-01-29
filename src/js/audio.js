/**
 * CRT Audio System Module
 * Handles all sound effects for the retro CRT TV experience
 */

// Audio state
let audioContext = null;
let soundEnabled = localStorage.getItem('crtSoundEnabled') !== 'false';
let hasPlayedStartupSound = sessionStorage.getItem('crtStartupPlayed') === 'true';

// Throttle helper for typing sound
let lastTypingSoundTime = 0;
const TYPING_SOUND_THROTTLE_MS = 25;

/**
 * Initialize or resume the AudioContext
 * Required due to browser autoplay policies
 */
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Play CRT turn-on sound sequence
 * Includes click, bass thump, and high-frequency whine
 */
export function playCRTTurnOn() {
  if (!soundEnabled) return;
  const ctx = initAudioContext();

  // Initial click
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'square';
  clickOsc.frequency.setValueAtTime(150, ctx.currentTime);
  clickGain.gain.setValueAtTime(0.3, ctx.currentTime);
  clickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);
  clickOsc.start(ctx.currentTime);
  clickOsc.stop(ctx.currentTime + 0.05);

  // Bass thump
  setTimeout(() => {
    const thumpOsc = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(80, ctx.currentTime);
    thumpOsc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.5);
    thumpGain.gain.setValueAtTime(0.35, ctx.currentTime);
    thumpGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thumpOsc.start(ctx.currentTime);
    thumpOsc.stop(ctx.currentTime + 0.6);
  }, 50);

  // High-frequency CRT whine
  setTimeout(() => {
    const whineOsc = ctx.createOscillator();
    const whineGain = ctx.createGain();
    whineOsc.type = 'sine';
    whineOsc.frequency.setValueAtTime(15700, ctx.currentTime);
    whineGain.gain.setValueAtTime(0.02, ctx.currentTime);
    whineGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.3);
    whineGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    whineOsc.connect(whineGain);
    whineGain.connect(ctx.destination);
    whineOsc.start(ctx.currentTime);
    whineOsc.stop(ctx.currentTime + 1.2);
  }, 100);

  // Static burst
  setTimeout(() => playStaticBurst(0.4, 0.15), 200);
}

/**
 * Play white noise static burst
 * @param {number} duration - Duration in seconds
 * @param {number} volume - Volume level (0-1)
 */
export function playStaticBurst(duration = 0.2, volume = 0.12) {
  if (!soundEnabled) return;
  const ctx = initAudioContext();

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2500;
  filter.Q.value = 0.7;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration * 0.7);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  whiteNoise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  whiteNoise.start(ctx.currentTime);
  whiteNoise.stop(ctx.currentTime + duration);
}

/**
 * Play channel change static sound
 */
export function playChannelChange() {
  if (!soundEnabled) return;
  playStaticBurst(0.25, 0.1);
}

/**
 * Play teletext navigation beep
 */
export function playTeletextBeep() {
  if (!soundEnabled) return;
  const ctx = initAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

/**
 * Play soft navigation click
 */
export function playNavigationClick() {
  if (!soundEnabled) return;
  const ctx = initAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.04);
}

/**
 * Play mechanical keyboard typing sound (throttled)
 */
export function playTypingSound() {
  if (!soundEnabled) return;

  // Throttle to prevent audio overlap on fast typing
  const now = performance.now();
  if (now - lastTypingSoundTime < TYPING_SOUND_THROTTLE_MS) return;
  lastTypingSoundTime = now;

  const ctx = initAudioContext();

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Main click tone with slight randomization
  osc.type = 'square';
  osc.frequency.setValueAtTime(1800 + Math.random() * 400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.02);

  // Secondary noise for texture
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(3000, ctx.currentTime);

  // High-pass filter for clicky feel
  filter.type = 'highpass';
  filter.frequency.value = 800;

  // Quick attack and decay envelope
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.025);
  osc2.stop(ctx.currentTime + 0.025);
}

/**
 * Toggle sound on/off
 * @param {Object|null} ytPlayer - YouTube player instance for mute sync
 */
export function toggleSound(ytPlayer = null) {
  soundEnabled = !soundEnabled;
  localStorage.setItem('crtSoundEnabled', soundEnabled);
  updateSoundButton();

  if (soundEnabled) {
    playStaticBurst(0.1, 0.08);
  }

  // Sync YouTube player mute state
  if (ytPlayer && typeof ytPlayer.mute === 'function') {
    if (soundEnabled) {
      ytPlayer.unMute();
    } else {
      ytPlayer.mute();
    }
  }
}

/**
 * Update sound toggle button UI state
 */
export function updateSoundButton() {
  const btn = document.getElementById('sound-toggle');
  if (!btn) return;

  const soundOn = btn.querySelector('.sound-on');
  const soundOff = btn.querySelector('.sound-off');

  if (soundEnabled) {
    btn.classList.remove('muted');
    btn.title = 'Mute CRT Sounds';
    if (soundOn) soundOn.style.display = 'block';
    if (soundOff) soundOff.style.display = 'none';
  } else {
    btn.classList.add('muted');
    btn.title = 'Unmute CRT Sounds';
    if (soundOn) soundOn.style.display = 'none';
    if (soundOff) soundOff.style.display = 'block';
  }
}

/**
 * Initialize the sound system
 * Sets up toggle button and startup sound
 * @param {Function} getYtPlayer - Function to get current YouTube player
 */
export function initSoundSystem(getYtPlayer = () => null) {
  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => toggleSound(getYtPlayer()));
  }
  updateSoundButton();

  // Play startup sound on first user interaction
  if (!hasPlayedStartupSound && soundEnabled) {
    const playStartup = () => {
      if (!hasPlayedStartupSound) {
        hasPlayedStartupSound = true;
        sessionStorage.setItem('crtStartupPlayed', 'true');
        playCRTTurnOn();
      }
      document.removeEventListener('click', playStartup);
      document.removeEventListener('keydown', playStartup);
    };

    document.addEventListener('click', playStartup, { once: true });
    document.addEventListener('keydown', playStartup, { once: true });
  }
}

/**
 * Check if sound is currently enabled
 * @returns {boolean}
 */
export function isSoundEnabled() {
  return soundEnabled;
}
