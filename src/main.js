// /src/main.js

const collageImages = Array.from(
  { length: 16 },
  (_, i) => `/src/assets/collage/face${String(i + 1).padStart(2, "0")}.jpg`
);

let currentChannel = 1;
let currentImageIndex = 0;
let slideshowInterval = null;
let currentStream = null;
const maxChannels = 7;

const tvImage = document.getElementById("tv-image");
const tvVideo = document.getElementById("tv-video");
const channelLabel = document.getElementById("channel-label");
const dateDisplay = document.getElementById("date-display");
const sections = document.querySelectorAll(".channel-screen");
const navButtons = document.querySelectorAll("nav button");

// Typewriter setup
const typeText = "> Developer. Explorer. Problem-solver.";
let typewriter = document.getElementById("typewriter-line");
let i = 0;

function typeWriterEffect() {
  if (!typewriter) return; // avoid errors if not present
  if (i < typeText.length) {
    typewriter.textContent += typeText.charAt(i);
    i++;
    setTimeout(typeWriterEffect, 50);
  }
}

// Clock/date
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

// Channel logic
function setChannel(channel) {
  currentChannel = channel;
  channelLabel.textContent = `CH ${String(channel).padStart(2, "0")}`;

  stopSlideshow();
  stopWebcam();

  tvVideo.pause();
  tvVideo.classList.remove("visible");
  tvVideo.removeAttribute("src");
  tvVideo.srcObject = null;

  if (channel === 1) {
    startSlideshow();
  } else if (channel === 2) {
    startWebcam();
  } else if (channel >= 3 && channel <= 7) {
    playRetroVideo(channel - 2);
  }
}

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

function playRetroVideo(videoNumber) {
  tvImage.classList.remove("visible");
  tvVideo.srcObject = null;

  tvVideo.src = `/src/assets/retro/retro${videoNumber}.mp4`;
  tvVideo.classList.add("visible");
  tvVideo.play().catch((err) => console.error("Video play error:", err));
}

function showSection(sectionId) {
  sections.forEach((section) => {
    section.classList.toggle("hidden", section.id !== sectionId);
    section.classList.toggle("active", section.id === sectionId);
  });

  // Reset and trigger typewriter when "about" is shown
  if (sectionId === "about" && typewriter) {
    typewriter.textContent = "> ";
    i = 0;
    setTimeout(typeWriterEffect, 300);
  }
}

// Scroll-fade animation
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

// Event Listeners
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

// About page internal jump buttons
document.querySelectorAll(".about-nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-jump");
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});


// Init
updateDate();
setInterval(updateDate, 60000);
setChannel(1);
showSection("intro");
