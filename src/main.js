// /src/main.js

const collageImages = Array.from(
  { length: 16 },
  (_, i) => `/src/assets/collage/face${String(i + 1).padStart(2, "0")}.jpg`
);

let currentChannel = 1;
let currentImageIndex = 0;
let slideshowInterval = null;
let currentStream = null;
const maxChannels = 4;

const tvImage = document.getElementById("tv-image");
const tvVideo = document.getElementById("tv-video");
const channelLabel = document.getElementById("channel-label");
const dateDisplay = document.getElementById("date-display");
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
  stopSlideshow();
  stopWebcam();

  if (channel === 1) {
    startSlideshow();
  } else if (channel === 2) {
    startWebcam();
  } else if (channel === 3 || channel === 4) {
    tvImage.classList.remove("visible");
    tvVideo.srcObject = null;
    tvVideo.src = `/src/assets/retro/retro${channel - 2}.mp4`;
    tvVideo.load();
    tvVideo.style.display = "block";
    tvVideo.play();
  }
}

function startSlideshow() {
  if (!collageImages.length) return;

  tvVideo.style.display = "none";
  tvVideo.srcObject = null;
  tvImage.classList.add("visible");
  tvImage.src = collageImages[currentImageIndex];

  slideshowInterval = setInterval(() => {
    currentImageIndex = (currentImageIndex + 1) % collageImages.length;
    tvImage.classList.remove("visible");
    setTimeout(() => {
      tvImage.src = collageImages[currentImageIndex];
      tvImage.classList.add("visible");
    }, 200);
  }, 4000);
}

function stopSlideshow() {
  clearInterval(slideshowInterval);
  slideshowInterval = null;
  tvImage.classList.remove("visible");
}

async function startWebcam() {
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
    tvVideo.srcObject = currentStream;
    tvImage.classList.remove("visible");
    tvVideo.src = "";
    tvVideo.style.display = "block";
    tvVideo.play();
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
  tvVideo.style.display = "none";
}

function showSection(sectionId) {
  sections.forEach((section) => {
    section.classList.toggle("hidden", section.id !== sectionId);
    section.classList.toggle("active", section.id === sectionId);
  });
}

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

// Init
updateDate();
setInterval(updateDate, 60000);
setChannel(1);
showSection("intro");
