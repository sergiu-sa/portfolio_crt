// ---------------------------------------------
// GLOBAL VARIABLES & SETUP
// ---------------------------------------------

// Fixed path to point to public folder
const collageImages = Array.from(
  { length: 16 },
  (_, i) => `/assets/collage/face${String(i + 1).padStart(2, "0")}.jpg`
);

let currentChannel = 1;
let currentImageIndex = 0;
let slideshowInterval = null;
let currentStream = null;
let contactIntroPlayed = false;
let galleryIntervals = [];

const maxChannels = 7;

// ---------------------------------------------
// PROJECT CHANNEL SYSTEM DATA
// ---------------------------------------------
const projectsData = [
  {
    id: 'square-eyes',
    name: 'Square Eyes',
    tech: 'HTML / CSS',
    description: 'Accessible film streaming site built with clean HTML and CSS.',
    github: 'https://github.com/sergiu-sa/pro-school-react.git',
    live: 'https://sergiu-sa.github.io/pro-school-react/',
    images: ['/assets/projects/square_eyes/new_home02.png']
  },
  {
    id: 'kid-bank',
    name: 'Kid Bank',
    tech: 'JavaScript / API',
    description: 'Banking app for teens with restricted purchases and barcode scanning.',
    github: 'https://github.com/sergiu-sa/kid_bank_.git',
    live: 'https://k1dbank.netlify.app',
    images: [
      '/assets/projects/kid_bank/kid_bank01.png',
      '/assets/projects/kid_bank/kid_bank02.png'
    ]
  },
  {
    id: 'ask-better',
    name: 'Ask Better',
    tech: 'AI / UX',
    description: 'Prompt-engineering app with mood, complexity, and intent refinements.',
    github: 'https://github.com/sergiu-sa/askbetter.git',
    live: 'https://askbetter.netlify.app',
    images: [
      '/assets/projects/ask_better/corporate_basic_01.png',
      '/assets/projects/ask_better/corporate_pro_01.png',
      '/assets/projects/ask_better/coffe_basic_02.png',
      '/assets/projects/ask_better/coffe_pro_02.png',
      '/assets/projects/ask_better/coffe_pro_03.png',
      '/assets/projects/ask_better/forest_basic_01.png',
      '/assets/projects/ask_better/forest_pro_02.png',
      '/assets/projects/ask_better/golden_basic_01.png',
      '/assets/projects/ask_better/golden_pro_01.png',
      '/assets/projects/ask_better/golden_pro_03.png',
      '/assets/projects/ask_better/deep_basic_01.png',
      '/assets/projects/ask_better/deep_pro_01.png',
      '/assets/projects/ask_better/zen_basic01.png',
      '/assets/projects/ask_better/zen_pro_01.png'
    ]
  }
];

let currentProjectIndex = 0;
let currentProjectImageIndex = 0;
let projectSlideshowInterval = null;
let projectChannelInitialized = false;
let dateInterval = null;
let teletextKeyboardHandler = null;

const tvImage = document.getElementById("tv-image");
const tvVideo = document.getElementById("tv-video");
const channelLabel = document.getElementById("channel-label");
const sections = document.querySelectorAll(".channel-screen");
const navButtons = document.querySelectorAll("nav button");

const typewriter = document.getElementById("typewriter-line");
const typeText = "> Developer. Explorer. Problem-solver.";
let typewriterIndex = 0;

// ---------------------------------------------
// TYPEWRITER EFFECT
// ---------------------------------------------

function typeWriterEffect() {
  if (!typewriter) return;
  if (typewriterIndex < typeText.length) {
    typewriter.textContent += typeText.charAt(typewriterIndex);
    typewriterIndex++;
    setTimeout(typeWriterEffect, 50);
  }
}

// ---------------------------------------------
// DECRYPTED EFFECT
// ---------------------------------------------
import { decryptedText } from "./js/decryptedText.js";

window.addEventListener("DOMContentLoaded", () => {
  const contactInput = document.querySelector(
    "#contact .contact-console input"
  );
  const output = document.querySelector("#contact .terminal-output");

  let commandHistory = [];
  let historyIndex = -1;

  if (contactInput) {
    contactInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const command = contactInput.value.trim();
        if (command) {
          printCommand(command);
          handleContactCommand(command.toLowerCase());
          commandHistory.push(command);
          historyIndex = commandHistory.length;
        }
        contactInput.value = "";
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          contactInput.value = commandHistory[historyIndex];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          contactInput.value = commandHistory[historyIndex];
        } else if (historyIndex === commandHistory.length - 1) {
          historyIndex++;
          contactInput.value = "";
        }
      }
    });
  }

  function printCommand(cmd) {
    if (!output) return;
    const line = document.createElement("div");
    line.classList.add("terminal-line");
    line.textContent = `> ${cmd}`;
    output.appendChild(line);
  }

  function printResponse(msg) {
    if (!output) return;
    const line = document.createElement("div");
    line.classList.add("terminal-line");
    output.appendChild(line);

    let i = 0;
    const speed = 20; // typing speed in milliseconds

    function typeChar() {
      if (i < msg.length) {
        line.textContent += msg.charAt(i);
        i++;
        setTimeout(typeChar, speed);
      }
    }
    typeChar();
  }

  function clearOutput() {
    if (output) output.textContent = "";
  }

  function handleContactCommand(cmd) {
    switch (cmd) {
      case "/email":
        window.location.href = "mailto:sergiudsarbu@gmail.com";
        printResponse("[MAIL] Opening email client...");
        return;

      case "/github":
        window.open("https://github.com/sergiu-sa", "_blank");
        printResponse("[GIT] Opening GitHub...");
        return;

      case "/linkedin":
        window.open(
          "https://www.linkedin.com/in/sergiu-sarbu-39154226a",
          "_blank"
        );
        printResponse("[NETWORK] Opening LinkedIn...");
        return;

      case "/instagram":
        window.open("https://www.instagram.com/sergiu_sarbu_/", "_blank");
        printResponse("[CAMERA] Opening Instagram...");
        return;

      case "/discord":
        window.open("https://discord.com/users/1275872993859342348", "_blank");
        printResponse("[CHAT] Opening Discord...");
        return;

      case "/poweroff":
        document.body.classList.toggle("power-off");
        printResponse("[POWER] CRT power toggled.");
        return;

      case "/ping":
        printResponse("[SIGNAL] Contact signal sent successfully!");
        return;

      case "/clear":
        clearOutput();
        return;

      case "/help":
        printResponse(`[HELP] Available commands:
  /email
  /github
  /linkedin
  /instagram
  /discord
  /ping
  /poweroff
  /clear`);
        return;

      default:
        printResponse("[ERROR] Unknown command. Try /help");
    }
  }

  // ---------------------------------------------
  // DATE DISPLAY
  // ---------------------------------------------
  function updateDate() {
    const now = new Date();
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    document.getElementById("current-date").textContent = `${
      months[now.getMonth()]
    } ${now.getDate()}, ${now.getFullYear()}`;
  }

  updateDate();
  dateInterval = setInterval(updateDate, 60000);
  setChannel(1);
  showSection("intro");
});


// ---------------------------------------------
// CHANNEL HANDLING
// ---------------------------------------------

function setChannel(channel) {
  currentChannel = channel;
  const channelText = `CH ${String(channel).padStart(2, "0")}`;
  channelLabel.textContent = channelText;

  // Show OSD channel indicator
  showOSD(channelText);

  triggerChannelFlicker();

  stopSlideshow();
  stopWebcam();

  tvVideo.pause();
  tvVideo.classList.remove("visible");
  tvVideo.removeAttribute("src");
  tvVideo.srcObject = null;

  if (channel === 1) startSlideshow();
  else if (channel === 2) startWebcam();
  else if (channel >= 3 && channel <= maxChannels) playRetroVideo(channel - 2);
}

// ---------------------------------------------
// SLIDESHOW (CH01)
// ---------------------------------------------

function startSlideshow() {
  tvImage.classList.add("visible");
  tvImage.src = collageImages[currentImageIndex];

  slideshowInterval = setInterval(() => {
    currentImageIndex = (currentImageIndex + 1) % collageImages.length;
    tvImage.classList.remove("visible");
    setTimeout(() => {
      tvImage.src = collageImages[currentImageIndex];
      tvImage.classList.add("visible");
    }, 150);
  }, 4000);
}

function stopSlideshow() {
  clearInterval(slideshowInterval);
  slideshowInterval = null;
  tvImage.classList.remove("visible");
}

// ---------------------------------------------
// WEBCAM (CH02)
// ---------------------------------------------

async function startWebcam() {
  const loadingIndicator = document.getElementById("loading-indicator");

  try {
    // Show loading indicator
    if (loadingIndicator) loadingIndicator.classList.add("active");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    tvVideo.srcObject = stream;
    tvVideo.classList.add("visible");
    tvVideo.play();
    currentStream = stream;

    // Hide loading indicator
    if (loadingIndicator) loadingIndicator.classList.remove("active");
  } catch (err) {
    console.error("Webcam error:", err);

    // Hide loading and show error feedback
    if (loadingIndicator) loadingIndicator.classList.remove("active");
    showOSD("CAMERA ERROR");
  }
}

function stopWebcam() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
  }
  tvVideo.srcObject = null;
  tvVideo.classList.remove("visible");
}

// ---------------------------------------------
// RETRO VIDEO (CH03–CH07)
// ---------------------------------------------

function playRetroVideo(videoNumber) {
  tvImage.classList.remove("visible");
  tvVideo.srcObject = null;

  // Updated path to point to public folder
  tvVideo.src = `/assets/retro/retro${videoNumber}.mp4`;
  tvVideo.loop = true;
  tvVideo.classList.add("visible");
  tvVideo.play().catch((err) => console.error("Video play error:", err));
}

// ---------------------------------------------
// SECTION SWITCHING
// ---------------------------------------------

function showSection(section) {
  // Clear all gallery intervals when switching sections
  galleryIntervals.forEach(interval => clearInterval(interval));
  galleryIntervals = [];

  // Stop project slideshow when leaving projects section
  stopProjectSlideshow();

  // Clean up teletext keyboard handler when leaving projects
  if (teletextKeyboardHandler) {
    document.removeEventListener('keydown', teletextKeyboardHandler);
    teletextKeyboardHandler = null;
    projectChannelInitialized = false;
  }

  sections.forEach((s) => {
    s.classList.remove("active");
    s.style.display = "none";
  });

  const target = document.getElementById(section);
  if (target) {
    target.style.display = "flex";
    target.classList.add("active");
  }

  if (section === "about") {
    typewriter.textContent = "> ";
    typewriterIndex = 0;
    setTimeout(typeWriterEffect, 300);
    document.getElementById("about-text").textContent = "";
    decryptedText({
      elementId: "about-text",
      text: [
        `I'm a front-end developer, creative explorer, and occasional chaos mechanic with a mind wired for problem-solving.`,
        `My work usually begins with a feeling. Sometimes it's curiosity, other times it's tension or instinct. I build through trial and error, letting the process guide the result rather than forcing it into place.`,
        `Creating something new, even if it's strange or unfinished, is where I feel most at home. If it feels honest or unexpectedly useful, I know I'm moving in the right direction.`,
        `Lately I've been exploring how people interact with AI, how digital tools can support mental clarity, and how retro aesthetics can inspire modern expression. This portfolio is one of those experiments.`,
      ],
      speed: 15,
      revealDirection: "start",
    });
  }

  if (section === "contact") {
    triggerTerminalSequence();
    startConsoleIntro();
    refreshFadeInObserver();
  }

  if (section === "projects") {
    initProjectChannelSystem();
  }
}

// ---------------------------------------------
// FADE-IN OBSERVER (SCROLL ANIMATION)
// ---------------------------------------------

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

function refreshFadeInObserver() {
  document.querySelectorAll(".fade-in").forEach((el) => {
    observer.observe(el);
  });
}

// ---------------------------------------------
// TERMINAL SEQUENCE (CONTACT SECTION)
// ---------------------------------------------

function triggerTerminalSequence() {
  const lines = document.querySelectorAll("#contact .terminal-line");
  lines.forEach((line, index) => {
    setTimeout(() => {
      line.classList.add("visible");
    }, index * 200);
  });
}

// ---------------------------------------------
// CHANNEL FLICKER EFFECT & OSD
// ---------------------------------------------

function triggerChannelFlicker() {
  const flicker = document.getElementById("channel-flicker");
  flicker.style.animation = "channelGlitch 0.4s ease-out";
  flicker.style.opacity = "1";

  setTimeout(() => {
    flicker.style.animation = "none";
    flicker.style.opacity = "0";
  }, 400);
}

function showOSD(text) {
  const osd = document.getElementById("channel-indicator");
  const osdText = document.getElementById("osd-channel");

  if (!osd || !osdText) return;

  osdText.textContent = text;
  osd.classList.remove("show");

  // Force reflow to restart animation
  void osd.offsetWidth;

  osd.classList.add("show");

  // Remove class after animation completes
  setTimeout(() => {
    osd.classList.remove("show");
  }, 2000);
}

function startConsoleIntro() {
  if (contactIntroPlayed) return;
  contactIntroPlayed = true;

  const text = "Establishing connection with Sergiu...";
  printResponse(text);
}

// ---------------------------------------------
// EVENT LISTENERS
// ---------------------------------------------

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.getAttribute("data-section");
    showSection(section);
  });
});

document.getElementById("channel-prev").addEventListener("click", () => {
  setChannel(currentChannel === 1 ? maxChannels : currentChannel - 1);
});

document.getElementById("channel-next").addEventListener("click", () => {
  setChannel(currentChannel === maxChannels ? 1 : currentChannel + 1);
});

document.getElementById("home-link").addEventListener("click", () => {
  showSection("intro");
});

document.getElementById("ping-all").addEventListener("click", () => {
  alert("[SYSTEM] All contact protocols pinged. Awaiting response...");
});

document.getElementById("power-off").addEventListener("click", () => {
  document.body.classList.toggle("power-off");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("power-off")) {
    document.body.classList.remove("power-off");
  }
});

// Keyboard shortcuts modal
const keyboardHintBtn = document.getElementById("keyboard-hint");
const shortcutsModal = document.getElementById("shortcuts-modal");
const modalClose = document.querySelector(".modal-close");

if (keyboardHintBtn) {
  keyboardHintBtn.addEventListener("click", () => {
    shortcutsModal.classList.add("active");
  });
}

if (modalClose) {
  modalClose.addEventListener("click", () => {
    shortcutsModal.classList.remove("active");
  });
}

if (shortcutsModal) {
  shortcutsModal.addEventListener("click", (e) => {
    if (e.target === shortcutsModal) {
      shortcutsModal.classList.remove("active");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && shortcutsModal.classList.contains("active")) {
      shortcutsModal.classList.remove("active");
    }
  });
}

// ---------------------------------------------
// TELETEXT PROJECT SYSTEM
// ---------------------------------------------

let lightboxOpen = false;

function initProjectChannelSystem() {
  if (projectChannelInitialized) return;
  projectChannelInitialized = true;

  // Show first project
  showTeletextProject(0);

  // Keyboard navigation for Teletext - store reference for cleanup
  teletextKeyboardHandler = handleTeletextKeyboard;
  document.addEventListener('keydown', teletextKeyboardHandler);

  // Touch swipe support for mobile
  const teletextContainer = document.querySelector('.teletext-container');
  if (teletextContainer) {
    let touchStartX = 0;

    teletextContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    teletextContainer.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diffX = touchStartX - touchEndX;
      const threshold = 50;

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          // Swipe left - next project
          navigateTeletextProject('next');
        } else {
          // Swipe right - previous project
          navigateTeletextProject('prev');
        }
      }
    });
  }

  // Click on preview image to open lightbox
  const previewFrame = document.querySelector('.teletext-preview-frame');
  if (previewFrame) {
    previewFrame.addEventListener('click', openLightbox);
  }

  // Lightbox controls
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightbox = document.getElementById('teletext-lightbox');

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox('prev'));
  if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox('next'));

  // Close lightbox when clicking outside the image
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Teletext navigation buttons
  const teletextPrev = document.getElementById('teletext-prev');
  const teletextNext = document.getElementById('teletext-next');

  if (teletextPrev) {
    teletextPrev.addEventListener('click', () => navigateTeletextProject('prev'));
  }
  if (teletextNext) {
    teletextNext.addEventListener('click', () => navigateTeletextProject('next'));
  }

  // Start image auto-cycle for projects with multiple images
  startTeletextImageCycle();
}

function handleTeletextKeyboard(e) {
  const projectsSection = document.getElementById('projects');
  if (!projectsSection || !projectsSection.classList.contains('active')) return;

  // If lightbox is open, handle lightbox navigation
  if (lightboxOpen) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateLightbox('prev');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateLightbox('next');
    }
    return;
  }

  // Normal teletext navigation
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    navigateTeletextProject('prev');
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    navigateTeletextProject('next');
  }
}

function openLightbox() {
  const project = projectsData[currentProjectIndex];
  const lightbox = document.getElementById('teletext-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCurrent = document.getElementById('lightbox-current');
  const lightboxTotal = document.getElementById('lightbox-total');

  if (!lightbox || !lightboxImg) return;

  // Pause auto-cycle while lightbox is open
  stopProjectSlideshow();

  lightboxImg.src = project.images[currentProjectImageIndex];
  if (lightboxCurrent) lightboxCurrent.textContent = currentProjectImageIndex + 1;
  if (lightboxTotal) lightboxTotal.textContent = project.images.length;

  lightbox.classList.add('active');
  lightboxOpen = true;
}

function closeLightbox() {
  const lightbox = document.getElementById('teletext-lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    lightboxOpen = false;
    // Resume auto-cycle
    startTeletextImageCycle();
  }
}

function navigateLightbox(direction) {
  const project = projectsData[currentProjectIndex];
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCurrent = document.getElementById('lightbox-current');

  if (direction === 'next') {
    currentProjectImageIndex = (currentProjectImageIndex + 1) % project.images.length;
  } else {
    currentProjectImageIndex = (currentProjectImageIndex - 1 + project.images.length) % project.images.length;
  }

  if (lightboxImg) lightboxImg.src = project.images[currentProjectImageIndex];
  if (lightboxCurrent) lightboxCurrent.textContent = currentProjectImageIndex + 1;

  // Also update the preview thumbnail
  const previewImg = document.getElementById('teletext-preview-img');
  const imgCurrentEl = document.getElementById('teletext-img-current');
  if (previewImg) previewImg.src = project.images[currentProjectImageIndex];
  if (imgCurrentEl) imgCurrentEl.textContent = currentProjectImageIndex + 1;
}

function navigateTeletextProject(direction) {
  if (direction === 'next') {
    currentProjectIndex = (currentProjectIndex + 1) % projectsData.length;
  } else {
    currentProjectIndex = (currentProjectIndex - 1 + projectsData.length) % projectsData.length;
  }
  showTeletextProject(currentProjectIndex);
}

function showTeletextProject(index) {
  const project = projectsData[index];
  currentProjectIndex = index;
  currentProjectImageIndex = 0;

  // Trigger channel flicker effect
  triggerChannelFlicker();

  // Show OSD with page number
  const pageNum = 101 + index;
  showOSD(`P.${pageNum}`);

  // Update Teletext elements
  const pageNumEl = document.getElementById('teletext-page-num');
  const titleEl = document.getElementById('teletext-project-title');
  const previewImg = document.getElementById('teletext-preview-img');
  const imgCurrentEl = document.getElementById('teletext-img-current');
  const imgTotalEl = document.getElementById('teletext-img-total');
  const techEl = document.getElementById('teletext-tech');
  const descEl = document.getElementById('teletext-desc');
  const codeLink = document.getElementById('teletext-link-code');
  const liveLink = document.getElementById('teletext-link-live');

  if (pageNumEl) pageNumEl.textContent = pageNum;
  if (titleEl) titleEl.textContent = project.name.toUpperCase();
  if (previewImg) previewImg.src = project.images[0];
  if (imgCurrentEl) imgCurrentEl.textContent = '1';
  if (imgTotalEl) imgTotalEl.textContent = project.images.length;
  if (techEl) {
    techEl.textContent = '';
    const label = document.createElement('span');
    label.className = 'teletext-label';
    label.textContent = 'TECH:';
    techEl.appendChild(label);
    techEl.appendChild(document.createTextNode(' ' + project.tech));
  }
  if (descEl) descEl.textContent = project.description;
  if (codeLink) codeLink.href = project.github;
  if (liveLink) liveLink.href = project.live;

  // Restart image cycle
  startTeletextImageCycle();
}

function startTeletextImageCycle() {
  // Stop any existing slideshow
  stopProjectSlideshow();

  const project = projectsData[currentProjectIndex];
  if (project.images.length <= 1) return;

  projectSlideshowInterval = setInterval(() => {
    currentProjectImageIndex = (currentProjectImageIndex + 1) % project.images.length;

    const previewImg = document.getElementById('teletext-preview-img');
    const imgCurrentEl = document.getElementById('teletext-img-current');

    if (previewImg) previewImg.src = project.images[currentProjectImageIndex];
    if (imgCurrentEl) imgCurrentEl.textContent = currentProjectImageIndex + 1;
  }, 4000);
}

function stopProjectSlideshow() {
  if (projectSlideshowInterval) {
    clearInterval(projectSlideshowInterval);
    projectSlideshowInterval = null;
  }
}

