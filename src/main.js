// ---------------------------------------------
// GLOBAL VARIABLES & SETUP
// ---------------------------------------------

const collageImages = Array.from(
  { length: 16 },
  (_, i) => `/src/assets/collage/face${String(i + 1).padStart(2, "0")}.jpg`
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
  dateDisplay.textContent = `${
    months[now.getMonth()]
  } ${now.getDate()}, ${now.getFullYear()}`;
}

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
  tvVideo.classList.add("visible");
  tvVideo.play().catch((err) => console.error("Video play error:", err));
}

// ---------------------------------------------
// SECTION SWITCHING
// ---------------------------------------------

function showSection(sectionId) {
  sections.forEach((section) => {
    section.classList.remove("active");
    section.style.display = "none";
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.style.display = "flex";
    target.classList.add("active");
  }

  if (sectionId === "about" && typewriter) {
    typewriter.textContent = "> ";
    i = 0;
    setTimeout(typeWriterEffect, 300);
  }

  if (sectionId === "contact") {
    triggerTerminalSequence();
    startConsoleIntro();
    refreshFadeInObserver(); // 👈 add this
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
  const intro = document.createElement("div");
  intro.classList.add("terminal-line", "fade-in");
  intro.style.opacity = 0;
  intro.textContent = "";

  const container = document.querySelector("#contact");
  container.insertBefore(intro, container.querySelector(".contact-grid"));


  let i = 0;
  function typeChar() {
    if (i < text.length) {
      intro.textContent += text.charAt(i);
      i++;
      setTimeout(typeChar, 40);
    } else {
      intro.style.opacity = 1;
      intro.classList.add("visible");
    }
  }

  typeChar();
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

document.getElementById("prev-channel").addEventListener("click", () => {
  setChannel(currentChannel === 1 ? maxChannels : currentChannel - 1);
});

document.getElementById("next-channel").addEventListener("click", () => {
  setChannel(currentChannel === maxChannels ? 1 : currentChannel + 1);
});

document.getElementById("back-to-home").addEventListener("click", () => {
  showSection("intro");
});
document.getElementById("back-to-home-about").addEventListener("click", () => {
  showSection("intro");
});
document
  .getElementById("back-to-home-contact")
  .addEventListener("click", () => {
    showSection("intro");
  });

document.getElementById("ping-all").addEventListener("click", () => {
  alert("🔊 All contact protocols pinged. Awaiting response...");
});

document.getElementById("power-off").addEventListener("click", () => {
  document.body.classList.toggle("power-off");
});

document.querySelectorAll(".about-nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-jump");
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ---------------------------------------------
// CONTACT TERMINAL: Handle command input
// ---------------------------------------------

const contactInput = document.querySelector("#contact .contact-console input");

if (contactInput) {
  contactInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const command = contactInput.value.trim().toLowerCase();
      handleContactCommand(command);
      contactInput.value = "";
    }
  });
}

function handleContactCommand(cmd) {
  switch (cmd) {
    case "/email":
      window.location.href = "mailto:hello@sergiusarbu.dev";
      printResponse("📨 Opening email client...");
      return;

    case "/github":
      window.open("https://github.com/sergiu-sa", "_blank");
      printResponse("🔗 Opening GitHub...");
      return;

    case "/linkedin":
      window.open("https://linkedin.com/in/YOUR-ID", "_blank");
      printResponse("🔗 Opening LinkedIn...");
      return;

    case "/instagram":
      window.open("https://instagram.com/YOUR-ID", "_blank");
      printResponse("📸 Opening Instagram...");
      return;

    case "/discord":
      window.open("https://discord.com/users/YOUR-ID", "_blank");
      printResponse("🎮 Opening Discord...");
      return;

    case "/poweroff":
      document.body.classList.toggle("power-off");
      printResponse("🛑 CRT power toggled.");
      return;

    case "/ping":
      printResponse("📡 Contact signal sent successfully!");
      return;

    case "/clear":
      clearOutput();
      return;

    case "/help":
      printResponse(`📖 Available commands:
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
      printResponse("❌ Unknown command. Try /help");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const contactInput = document.querySelector(
    "#contact .contact-console input"
  );
  const output = document.querySelector("#contact .terminal-output");

  if (contactInput) {
    contactInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const command = contactInput.value.trim().toLowerCase();
        printCommand(command);
        handleContactCommand(command);
        contactInput.value = "";
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
    line.textContent = msg;
    output.appendChild(line);
  }

  function clearOutput() {
    if (output) output.innerHTML = "";
  }

  function handleContactCommand(cmd) {
    switch (cmd) {
      case "/email":
        window.location.href = "mailto:hello@sergiusarbu.dev";
        break;
      case "/github":
        window.open("https://github.com/sergiu-sa", "_blank");
        break;
      case "/linkedin":
        window.open("https://linkedin.com/in/YOUR-ID", "_blank");
        break;
      case "/instagram":
        window.open("https://instagram.com/YOUR-ID", "_blank");
        break;
      case "/discord":
        window.open("https://discord.com/users/YOUR-ID", "_blank");
        break;
      case "/poweroff":
        document.body.classList.toggle("power-off");
        printResponse("🛑 CRT power toggled.");
        break;
      case "/ping":
        printResponse("📡 Contact signal sent successfully!");
        break;
      case "/clear":
        clearOutput();
        break;
      case "/help":
        printResponse(
          "Available commands:\n/email\n/github\n/linkedin\n/instagram\n/discord\n/ping\n/poweroff\n/clear"
        );
        break;
      default:
        printResponse("❌ Unknown command. Try /help");
    }
  }
});

// ---------------------------------------------
// INIT
// ---------------------------------------------

updateDate();
setInterval(updateDate, 60000);
setChannel(1);
showSection("intro");
