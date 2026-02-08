// Track active intervals for cleanup
const activeIntervals = [];

export function decryptedText({
  elementId,
  text: textChunks,
  speed = 15,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+',
  revealDirection = 'start',
}) {
  const el = document.getElementById(elementId);
  if (!el) return;

  cleanupDecryptedText();
  el.innerHTML = '';

  textChunks.forEach((paragraphText) => {
    const p = document.createElement('p');
    p.classList.add('crt-text', 'decrypted-text');
    el.appendChild(p);

    _animateSingleDecryptedText({
      element: p,
      text: paragraphText,
      speed,
      characters,
      revealDirection,
    });
  });
}

export function cleanupDecryptedText() {
  activeIntervals.forEach((id) => clearInterval(id));
  activeIntervals.length = 0;
}

function _animateSingleDecryptedText({ element, text, speed, characters, revealDirection }) {
  const revealed = new Set();
  let interval;

  function getNextIndex() {
    switch (revealDirection) {
      case 'center': {
        const middle = Math.floor(text.length / 2);
        const offset = Math.floor(revealed.size / 2);
        const idx = revealed.size % 2 === 0 ? middle + offset : middle - offset - 1;
        return !revealed.has(idx)
          ? idx
          : [...Array(text.length).keys()].find((i) => !revealed.has(i));
      }
      case 'end':
        return text.length - 1 - revealed.size;
      case 'start':
      default:
        return revealed.size;
    }
  }

  function scramble() {
    const scrambled = text.split('').map((char, i) => {
      if (char === ' ') return ' ';
      if (revealed.has(i)) return char;
      return characters[Math.floor(Math.random() * characters.length)];
    });

    element.innerHTML = scrambled
      .map((char, i) => {
        const spanClass = revealed.has(i) ? 'revealed-char' : 'encrypted-char';
        return `<span class="${spanClass}">${char}</span>`;
      })
      .join('');
  }

  interval = setInterval(() => {
    if (revealed.size >= text.length) {
      clearInterval(interval);
      return;
    }
    const nextIndex = getNextIndex();
    if (nextIndex === undefined) {
      clearInterval(interval);
      return;
    }
    revealed.add(nextIndex);
    scramble();
  }, speed);
  activeIntervals.push(interval);
}
