/**
 * Channel System Module
 * Handles TV channel switching, video playback, webcam, and slideshow
 */

import { playChannelChange } from './audio.js';

// Channel state
let currentChannel = 1;
let currentImageIndex = 0;
let slideshowInterval = null;
let currentStream = null;

const MAX_CHANNELS = 8;
const YOUTUBE_VIDEO_ID = 'lNYcviXK4rg';

// YouTube player state
let ytPlayer = null;
let ytApiReady = false;

// Collage images for CH01
const collageImages = Array.from(
  { length: 16 },
  (_, i) => `/assets/collage/face${String(i + 1).padStart(2, '0')}.jpg`
);

// DOM element references (initialized on setup)
let tvImage = null;
let tvVideo = null;
let channelLabel = null;

/**
 * Initialize channel system with DOM references
 */
export function initChannelSystem() {
  tvImage = document.getElementById('tv-image');
  tvVideo = document.getElementById('tv-video');
  channelLabel = document.getElementById('channel-label');
}

/**
 * Get current YouTube player instance
 * @returns {Object|null}
 */
export function getYtPlayer() {
  return ytPlayer;
}

/**
 * Get current channel number
 * @returns {number}
 */
export function getCurrentChannel() {
  return currentChannel;
}

/**
 * Get maximum channel count
 * @returns {number}
 */
export function getMaxChannels() {
  return MAX_CHANNELS;
}

/**
 * Check if sound is enabled (for YouTube mute state)
 * @param {Function} isSoundEnabled - Function to check sound state
 */
let checkSoundEnabled = () => true;
export function setSoundEnabledChecker(fn) {
  checkSoundEnabled = fn;
}

// ============================================
// VHS CAMCORDER EFFECT
// ============================================

/**
 * Show VHS overlay effect (used on webcam channel)
 */
export function showVHSOverlay() {
  const vhsOverlay = document.getElementById('vhs-overlay');
  if (vhsOverlay) {
    vhsOverlay.classList.add('active');
  }
  if (tvVideo) {
    tvVideo.classList.add('vhs-effect');
  }
}

/**
 * Hide VHS overlay effect
 */
export function hideVHSOverlay() {
  const vhsOverlay = document.getElementById('vhs-overlay');
  if (vhsOverlay) {
    vhsOverlay.classList.remove('active');
  }
  if (tvVideo) {
    tvVideo.classList.remove('vhs-effect');
  }
}

// ============================================
// YOUTUBE CHANNEL (CH03)
// ============================================

/**
 * Load YouTube IFrame API
 * @returns {Promise<void>}
 */
function loadYouTubeAPI() {
  if (ytApiReady) return Promise.resolve();

  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      ytApiReady = true;
      resolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      resolve();
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  });
}

/**
 * Start YouTube channel playback
 * @param {Function} showOSD - Function to show OSD messages
 */
export async function startYouTubeChannel(showOSD) {
  const container = document.getElementById('youtube-container');
  if (!container) return;

  try {
    await loadYouTubeAPI();

    if (!ytPlayer) {
      ytPlayer = new YT.Player('youtube-container', {
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: checkSoundEnabled() ? 0 : 1,
          loop: 1,
          playlist: YOUTUBE_VIDEO_ID,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            if (!checkSoundEnabled()) {
              event.target.mute();
            }
            event.target.playVideo();
            const playerElement = document.getElementById('youtube-container');
            if (playerElement) {
              playerElement.classList.add('visible');
            }
          },
          onError: (event) => {
            console.warn('YouTube player error:', event.data);
            if (showOSD) showOSD('VIDEO ERROR');
          },
        },
      });
    } else {
      const playerElement = document.getElementById('youtube-container');
      if (playerElement) {
        playerElement.classList.add('visible');
      }
    }
  } catch (err) {
    console.warn('YouTube channel error:', err);
    if (showOSD) showOSD('VIDEO ERROR');
  }
}

/**
 * Stop YouTube channel playback
 */
export function stopYouTubeChannel() {
  const container = document.getElementById('youtube-container');
  if (!container) return;

  if (ytPlayer && ytPlayer.destroy) {
    ytPlayer.destroy();
    ytPlayer = null;
  }

  container.classList.remove('visible');
}

// ============================================
// SLIDESHOW (CH01)
// ============================================

/**
 * Start photo slideshow
 */
export function startSlideshow() {
  if (!tvImage) return;

  tvImage.classList.add('visible');
  tvImage.src = collageImages[currentImageIndex];

  slideshowInterval = setInterval(() => {
    currentImageIndex = (currentImageIndex + 1) % collageImages.length;
    tvImage.classList.remove('visible');
    setTimeout(() => {
      tvImage.src = collageImages[currentImageIndex];
      tvImage.classList.add('visible');
    }, 150);
  }, 4000);
}

/**
 * Stop photo slideshow
 */
export function stopSlideshow() {
  clearInterval(slideshowInterval);
  slideshowInterval = null;
  if (tvImage) {
    tvImage.classList.remove('visible');
  }
}

// ============================================
// WEBCAM (CH02)
// ============================================

/**
 * Start webcam feed with VHS effect
 * @param {Function} showOSD - Function to show OSD messages
 */
export async function startWebcam(showOSD) {
  const loadingIndicator = document.getElementById('loading-indicator');

  try {
    if (loadingIndicator) loadingIndicator.classList.add('active');

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    tvVideo.srcObject = stream;
    tvVideo.classList.add('visible');
    tvVideo.play();
    currentStream = stream;

    if (loadingIndicator) loadingIndicator.classList.remove('active');

    showVHSOverlay();
  } catch (err) {
    console.error('Webcam error:', err);
    if (loadingIndicator) loadingIndicator.classList.remove('active');
    if (showOSD) showOSD('CAMERA ERROR');
  }
}

/**
 * Stop webcam feed
 */
export function stopWebcam() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
  }
  if (tvVideo) {
    tvVideo.srcObject = null;
    tvVideo.classList.remove('visible');
  }
  hideVHSOverlay();
}

// ============================================
// RETRO VIDEO (CH04-CH08)
// ============================================

/**
 * Play retro video loop
 * @param {number} videoNumber - Video number (1-5)
 */
export function playRetroVideo(videoNumber) {
  if (!tvImage || !tvVideo) return;

  tvImage.classList.remove('visible');
  tvVideo.srcObject = null;
  tvVideo.src = `/assets/retro/retro${videoNumber}.mp4`;
  tvVideo.loop = true;
  tvVideo.classList.add('visible');
  tvVideo.play().catch((err) => console.error('Video play error:', err));
}

// ============================================
// CHANNEL SWITCHING
// ============================================

/**
 * Set current channel and start appropriate media
 * @param {number} channel - Channel number (1-8)
 * @param {Object} callbacks - Callback functions
 * @param {Function} callbacks.showOSD - Show OSD message
 * @param {Function} callbacks.triggerFlicker - Trigger channel flicker effect
 */
export function setChannel(channel, { showOSD, triggerFlicker }) {
  currentChannel = channel;
  const channelText = `CH ${String(channel).padStart(2, '0')}`;

  if (channelLabel) {
    channelLabel.textContent = channelText;
  }

  if (showOSD) showOSD(channelText);
  if (triggerFlicker) triggerFlicker();
  playChannelChange();

  // Stop all channel types
  stopSlideshow();
  stopWebcam();
  stopYouTubeChannel();

  if (tvVideo) {
    tvVideo.pause();
    tvVideo.classList.remove('visible');
    tvVideo.removeAttribute('src');
    tvVideo.srcObject = null;
  }

  // Channel routing
  if (channel === 1) {
    startSlideshow();
  } else if (channel === 2) {
    startWebcam(showOSD).catch(() => {});
  } else if (channel === 3) {
    startYouTubeChannel(showOSD).catch(() => {});
  } else if (channel >= 4 && channel <= MAX_CHANNELS) {
    playRetroVideo(channel - 3);
  }
}

/**
 * Navigate to previous channel
 * @param {Object} callbacks - Callback functions
 */
export function prevChannel(callbacks) {
  setChannel(currentChannel === 1 ? MAX_CHANNELS : currentChannel - 1, callbacks);
}

/**
 * Navigate to next channel
 * @param {Object} callbacks - Callback functions
 */
export function nextChannel(callbacks) {
  setChannel(currentChannel === MAX_CHANNELS ? 1 : currentChannel + 1, callbacks);
}
