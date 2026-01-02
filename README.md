# Sergiu Sarbu — Developer Portfolio (CRT Edition)

This is my personal portfolio site built as part of the Noroff Front-End Development 1 curriculum. It showcases three core projects from my first year and is presented through a custom visual interface inspired by retro **CRT** (Cathode Ray Tube) displays — the analog screens used in old televisions and monitors.

Rather than a traditional layout, this portfolio uses a fullscreen "TV screen" background that mimics changing channels, static noise, scanlines, and flicker effects to create an immersive, nostalgic user experience.

---

## Project Purpose

The goal of this portfolio is to:

- Present three development projects using a clear, visual card layout
- Reflect my personality and problem-solving style
- Experiment with alternative user interfaces and creative theming
- Fulfill the required deliverables of the FED1 portfolio brief

---

## What Is CRT?

CRT stands for **Cathode Ray Tube**, a technology once used in old televisions and monitors, and is used here to evoke a retro-futuristic atmosphere.

---

## Technologies Used

- HTML5, CSS3, Vanilla JavaScript
- Vite (for fast development and bundling)
- Web APIs (e.g. `getUserMedia` for webcam access)
- Custom CSS animations (flicker, scanlines, glitch, terminal text effects)

---

## Key Features

- **Channel-based CRT interface**: User can switch channels that control the animated background (looped videos, static, webcam)
- **Live Webcam Mode**: One channel activates the user’s camera feed with retro filters
- **Project Showcase**: Each project is displayed as a card with title, description, screenshot, and links
- **About & Contact Sections**: Styled with typewriter animation, terminal layout, and responsive design
- **Fully responsive** for both desktop and mobile screens

## Folder Structure

```bash
portfolio_crt/
├── public/
│   └── assets/
│       ├── collage/          (move from src/assets/collage/)
│       ├── projects/         (move from src/assets/projects/)
│       └── retro/           (move from src/assets/retro/)
├── src/
│   ├── style/
│   ├── js/
│   └── main.js
└── index.html
```

---

## Status

The project is fully functional and deployed. Webcam functionality is supported in modern browsers only and requires permission.

---

## Author

**Sergiu Sarbu**  
Front-End Development student at Noroff School of Technology and Digital Media

GitHub: [https://github.com/sergiu-sa](https://github.com/sergiu-sa)
