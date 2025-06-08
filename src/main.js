// ---------------------------------------------
// GLOBAL VARIABLES & SETUP
// ---------------------------------------------

const collageImages = Array.from(
  { length: 16 },
  (_, i) => `/assets/collage/face${String(i + 1).padStart(2, "0")}.jpg`
);

let currentChannel = 1;
let currentImageIndex = 0;
let slideshowInterval = null;
let currentStream = null;
let contactIntroPlayed = false;

const maxChannels = 7;

const tvImage = document.getElementById("tv-image");
const tvVideo = document.getElementById("tv-video");
const channelLabel = document.getElementById("channel-label");
const dateDisplay = document.getElementById("date-display");
const sections = document.querySelectorAll(".channel-screen");
const navButtons = document.querySelectorAll("nav button");

const typewriter = document.getElementById("typewriter-line");
const typeText = "> Developer. Explorer. Problem-solver.";
let i = 0;

// ---------------------------------------------
// TYPEWRITER EFFECT
// ---------------------------------------------

function typeWriterEffect() {
  if (!typewriter) return;
  if (i < typeText.length) {
    typewriter.textContent += typeText.charAt(i);
    i++;
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
    if (output) output.innerHTML = "";
  }

  function handleContactCommand(cmd) {
    switch (cmd) {
      case "/email":
        window.location.href = "mailto:hello@sergiusarbu.dev";
        printResponse("[MAIL] Opening email client...");
        return;

      case "/github":
        window.open("https://github.com/sergiu-sa", "_blank");
        printResponse("[GIT] Opening GitHub...");
        return;

      case "/linkedin":
        window.open("https://linkedin.com/in/sergiu-sarbu", "_blank");
        printResponse("[NETWORK] Opening LinkedIn...");
        return;

      case "/instagram":
        window.open("https://instagram.com/sergiu.sarbu", "_blank");
        printResponse("[CAMERA] Opening Instagram...");
        return;

      case "/discord":
        window.open("https://discord.com/users/sergiu.sarbu", "_blank");
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
  setInterval(updateDate, 60000);
  setChannel(1);
  showSection("intro");
});

// Initialize project galleries when the DOM is fully loaded
initProjectGalleries();

// ---------------------------------------------
// CHANNEL HANDLING
// ---------------------------------------------

function setChannel(channel) {
  currentChannel = channel;
  channelLabel.textContent = `CH ${String(channel).padStart(2, "0")}`;
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
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    tvVideo.srcObject = stream;
    tvVideo.classList.add("visible");
    tvVideo.play();
    currentStream = stream;
  } catch (err) {
    console.error("Webcam error:", err);
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

  tvVideo.src = `/src/assets/retro/retro${videoNumber}.mp4`;
  tvVideo.loop = true;
  tvVideo.classList.add("visible");
  tvVideo.play().catch((err) => console.error("Video play error:", err));
}

// ---------------------------------------------
// SECTION SWITCHING
// ---------------------------------------------

function showSection(section) {
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
    i = 0;
    setTimeout(typeWriterEffect, 300);
    document.getElementById("about-text").innerHTML = "";
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
// CHANNEL FLICKER EFFECT
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

// ---------------------------------------------
// PROJECT GALLERY FUNCTIONALITY
// ---------------------------------------------

function initProjectGalleries() {
  const galleries = document.querySelectorAll(".project-gallery");
  const fullscreenView = document.querySelector(".fullscreen-view");
  const fullscreenImage = document.querySelector(".fullscreen-image");
  const fullscreenNav = document.querySelector(".fullscreen-nav");
  const closeFullscreen = document.querySelector(".close-fullscreen");
  const prevButton = document.querySelector(".fullscreen-arrow.prev");
  const nextButton = document.querySelector(".fullscreen-arrow.next");
  let currentGallery = null;

  galleries.forEach((gallery) => {
    const images = gallery.querySelectorAll("img");

    const galleryNav = gallery.parentElement
      ? gallery.parentElement.querySelector(".gallery-nav")
      : null;
    const dots = galleryNav ? galleryNav.querySelectorAll(".gallery-dot") : [];
    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    // Add click handlers to dots
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showImage(index);
      });
    });

    // Add click handler to gallery for fullscreen
    gallery.addEventListener("click", () => {
      openFullscreen(gallery);
    });

    // Add keyboard navigation
    gallery.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        showImage((currentIndex - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        showImage((currentIndex + 1) % images.length);
      }
    });

    // Add touch support for mobile
    gallery.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    gallery.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          showImage((currentIndex + 1) % images.length);
        } else {
          showImage((currentIndex - 1 + images.length) % images.length);
        }
      }
    }

    function showImage(index) {
      images[currentIndex].classList.remove("active");
      dots[currentIndex].classList.remove("active");

      currentIndex = index;

      images[currentIndex].classList.add("active");
      dots[currentIndex].classList.add("active");

      if (currentGallery === gallery) {
        updateFullscreen();
      }
    }

    if (images.length > 1) {
      setInterval(() => {
        if (currentGallery !== gallery) {
          showImage((currentIndex + 1) % images.length);
        }
      }, 5000);
    }
  });

  // Fullscreen functionality
  function openFullscreen(gallery) {
    currentGallery = gallery;
    fullscreenView.classList.add("active");
    updateFullscreen();
    document.body.style.overflow = "hidden";
  }

  function closeFullscreenView() {
    fullscreenView.classList.remove("active");
    currentGallery = null;
    document.body.style.overflow = "";
  }

  function updateFullscreen() {
    if (!currentGallery) return;

    const activeImage = currentGallery.querySelector("img.active");
    const images = currentGallery.querySelectorAll("img");
    // Get the parent .project-card, then find the .gallery-nav within it
    const galleryNav = currentGallery.parentElement
      ? currentGallery.parentElement.querySelector(".gallery-nav")
      : null;
    const dots = galleryNav ? galleryNav.querySelectorAll(".gallery-dot") : [];

    fullscreenImage.src = activeImage.src;
    fullscreenImage.alt = activeImage.alt;

    // Update fullscreen navigation dots
    fullscreenNav.innerHTML = "";
    images.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.className = `fullscreen-dot ${
        index === Array.from(images).indexOf(activeImage) ? "active" : ""
      }`;
      dot.addEventListener("click", () => {
        if (dots[index]) {
          dots[index].click();
        }
      });
      fullscreenNav.appendChild(dot);
    });

    if (images.length > 1) {
      prevButton.style.display = "flex";
      nextButton.style.display = "flex";
    } else {
      prevButton.style.display = "none";
      nextButton.style.display = "none";
    }
  }

  // Navigation arrow click handlers
  prevButton.addEventListener("click", () => {
    if (!currentGallery) return;
    const images = currentGallery.querySelectorAll("img");

    const galleryNav = currentGallery.parentElement
      ? currentGallery.parentElement.querySelector(".gallery-nav")
      : null;
    const dots = galleryNav ? galleryNav.querySelectorAll(".gallery-dot") : [];
    const currentIndex = Array.from(images).findIndex((img) =>
      img.classList.contains("active")
    );
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    if (dots[newIndex]) {
      dots[newIndex].click();
    }
  });

  nextButton.addEventListener("click", () => {
    if (!currentGallery) return;
    const images = currentGallery.querySelectorAll("img");

    const galleryNav = currentGallery.parentElement
      ? currentGallery.parentElement.querySelector(".gallery-nav")
      : null;
    const dots = galleryNav ? galleryNav.querySelectorAll(".gallery-dot") : [];
    const currentIndex = Array.from(images).findIndex((img) =>
      img.classList.contains("active")
    );
    const newIndex = (currentIndex + 1) % images.length;
    if (dots[newIndex]) {
      dots[newIndex].click();
    }
  });

  closeFullscreen.addEventListener("click", closeFullscreenView);
  fullscreenView.addEventListener("click", (e) => {
    if (e.target === fullscreenView) {
      closeFullscreenView();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!currentGallery) return;

    const images = currentGallery.querySelectorAll("img");

    const galleryNav = currentGallery.parentElement
      ? currentGallery.parentElement.querySelector(".gallery-nav")
      : null;
    const dots = galleryNav ? galleryNav.querySelectorAll(".gallery-dot") : [];
    const currentIndex = Array.from(images).findIndex((img) =>
      img.classList.contains("active")
    );

    if (e.key === "Escape") {
      closeFullscreenView();
    } else if (e.key === "ArrowLeft") {
      const newIndex = (currentIndex - 1 + images.length) % images.length;
      if (dots[newIndex]) {
        dots[newIndex].click();
      }
    } else if (e.key === "ArrowRight") {
      const newIndex = (currentIndex + 1) % images.length;
      if (dots[newIndex]) {
        dots[newIndex].click();
      }
    }
  });
}
