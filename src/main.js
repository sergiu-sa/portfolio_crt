// /src/main.js

const collageImages = Array.from(
  { length: 16 },
  (_, i) => `/src/assets/collage/face${String(i + 1).padStart(2, "0")}.webp`
);

let currentChannel = 1;
let currentImageIndex = 0;
let currentStream = null;
const maxChannels = 4;

const tvVideo = document.getElementById("tv-video");
const tvOverlay = document.getElementById("tv-overlay");
const channelLabel = document.getElementById("channel-label");
const dateDisplay = document.getElementById("date-display");
const prevButton = document.getElementById("prev-channel");
const nextButton = document.getElementById("next-channel");

const sections = document.querySelectorAll(".channel-screen");
const navButtons = document.querySelectorAll("nav button");

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

function setChannel(channel) {
  currentChannel = channel;
  channelLabel.textContent = `CH ${String(channel).padStart(2, "0")}`;
  stopStream();

  if (channel === 1) {
    startSlideshow();
  } else if (channel === 2) {
    startWebcam();
  } else if (channel === 3 || channel === 4) {
    tvVideo.src = `/src/assets/retro/retro${channel - 2}.mp4`;
    tvVideo.play();
  }

  if (channel !== 1) {
    clearInterval(slideshowInterval);
  }
}

let slideshowInterval;
function startSlideshow() {
  tvVideo.src = collageImages[currentImageIndex];
  tvVideo.load();

  slideshowInterval = setInterval(() => {
    currentImageIndex = (currentImageIndex + 1) % collageImages.length;
    tvVideo.src = collageImages[currentImageIndex];
    tvVideo.load();
  }, 4000);
}

async function startWebcam() {
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    tvVideo.srcObject = currentStream;
    tvVideo.play();
  } catch (error) {
    console.error("Webcam access denied:", error);
  }
}

function stopStream() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
  }
  tvVideo.srcObject = null;
}

function showSection(sectionId) {
  sections.forEach((section) => {
    section.classList.toggle("hidden", section.id !== sectionId);
    section.classList.toggle("active", section.id === sectionId);
  });
}

prevButton.addEventListener("click", () => {
  setChannel(currentChannel === 1 ? maxChannels : currentChannel - 1);
});

nextButton.addEventListener("click", () => {
  setChannel(currentChannel === maxChannels ? 1 : currentChannel + 1);
});

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.getAttribute("data-section");
    showSection(section);
  });
});

// Init
updateDate();
setInterval(updateDate, 60000);
setChannel(1);
showSection("intro");
