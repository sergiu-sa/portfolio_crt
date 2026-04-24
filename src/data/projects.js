/**
 * Portfolio project data.
 *
 * To add a project: append an entry to `projects` and drop images into
 * `public/assets/projects/<slug>/`. Schema:
 *
 *   id           Slug (lowercase-kebab) — used as stable identifier.
 *   name         Display name (shown uppercased in the teletext UI).
 *   tags         Up to ~4 tech tags. Colors rotate: red → green → yellow → blue.
 *   year         YYYY.
 *   status       'LIVE' (deployed) or 'COMPLETE' (finished but not live).
 *   brief        One-sentence elevator pitch. Keep ≤ 140 chars.
 *   role         Short phrase: 'Solo build', 'Team of N', 'Exam project', etc.
 *   highlights   2–4 scannable bullets. Each ≤ 80 chars.
 *   description  (legacy — no longer rendered, kept for reference.)
 *   github       Repo URL.
 *   live         Deployment URL (empty string if not live).
 *   images       Array of paths under `/assets/projects/<slug>/`. First entry
 *                is the preview; all are browsable in the lightbox.
 */

export const projects = [
  {
    id: 'aucto',
    name: 'Aucto',
    tags: ['TypeScript', 'Tailwind', 'API'],
    year: '2025',
    status: 'LIVE',
    brief: 'Live auction marketplace where you bid on items with in-app credits.',
    role: 'Solo — Noroff Semester Project 2',
    highlights: [
      'Real-time bidding flow with optimistic UI updates',
      'JWT auth + credit management via Noroff API v2',
      'Brutalist visual system built from scratch',
    ],
    description:
      'Brutalist auction platform with real-time bidding, JWT auth, and credit management via Noroff API v2.',
    github: 'https://github.com/sergiu-sa/auction_house_sp2',
    live: 'https://auctohouse.netlify.app/',
    images: [
      '/assets/projects/aucto/aucto_intro.gif',
      '/assets/projects/aucto/b_aucto_feed.jpg',
      '/assets/projects/aucto/c_aucto.png',
      '/assets/projects/aucto/d_aucto_profile.png',
      '/assets/projects/aucto/e_aucto_catalog.jpg',
      '/assets/projects/aucto/f_aucto_login.png',
      '/assets/projects/aucto/g_aucto_register.png',
    ],
  },
  {
    id: 'linka',
    name: 'Linka',
    tags: ['TypeScript', 'Three.js', 'API'],
    year: '2025',
    status: 'LIVE',
    brief: 'Social platform with a Three.js intro scene and a real-time feed.',
    role: 'Team build',
    highlights: [
      'Three.js landing scene as the entry experience',
      'Emoji reactions, threaded comments, live-search feed',
      'Dark / light theming across every screen',
    ],
    description:
      'Social media platform with 3D intro, emoji reactions, comments, and real-time search. Team-built with Three.js and Tailwind.',
    github: 'https://github.com/sergiu-sa/linka-social-media',
    live: 'https://linka-social.netlify.app/',
    images: [
      '/assets/projects/linka/linka_intro_light.gif',
      '/assets/projects/linka/linka_intro_dark.gif',
      '/assets/projects/linka/linka_feed_light.png',
      '/assets/projects/linka/linka_feed_dark.png',
      '/assets/projects/linka/linka_profile_light.png',
      '/assets/projects/linka/linka_profile_dark.png',
    ],
  },
  {
    id: 'adventure-trails',
    name: 'Adventure Trails',
    tags: ['HTML', 'CSS'],
    year: '2024',
    status: 'COMPLETE',
    brief: 'Marketing site for guided hiking expeditions — pure HTML and CSS.',
    role: 'Solo build',
    highlights: [
      'Fully responsive across mobile / tablet / desktop',
      'Accessible gallery + SEO metadata',
      'Zero JavaScript — markup and styling only',
    ],
    description:
      'Marketing site for guided hiking expeditions with responsive design, gallery, and SEO optimization. Pure HTML and CSS.',
    github: 'https://github.com/sergiu-sa/adventure_trails_hikes',
    live: 'https://adventuretrailshikes.netlify.app/',
    images: [
      '/assets/projects/adventure_trails/adventure_intro.gif',
      '/assets/projects/adventure_trails/hike-min.png',
      '/assets/projects/adventure_trails/home-min.png',
      '/assets/projects/adventure_trails/about-min.png',
    ],
  },
  {
    id: 'square-eyes',
    name: 'Square Eyes',
    tags: ['HTML', 'CSS'],
    year: '2024',
    status: 'COMPLETE',
    brief: 'Accessible film-streaming concept, built with clean HTML and CSS.',
    role: 'Solo build',
    highlights: [
      'WCAG-conscious color + typography choices',
      'Semantic markup, no frameworks',
      'Mobile-first responsive layout',
    ],
    description: 'Accessible film streaming site built with clean HTML and CSS.',
    github: 'https://github.com/sergiu-sa/pro-school-react.git',
    live: 'https://square-eyes-sa.netlify.app/',
    images: [
      '/assets/projects/square_eyes/new_home02.jpg',
      '/assets/projects/square_eyes/new_home01.jpg',
    ],
  },
  {
    id: 'kid-bank',
    name: 'Kid Bank',
    tags: ['JavaScript', 'API', 'CSS'],
    year: '2024',
    status: 'LIVE',
    brief: 'Teen banking app with spending guardrails and barcode scanning.',
    role: 'Solo build',
    highlights: [
      'Barcode scanning for product-level purchase rules',
      'Parent-set spending categories and limits',
      'Lightweight vanilla JS stack',
    ],
    description: 'Banking app for teens with restricted purchases and barcode scanning.',
    github: 'https://github.com/sergiu-sa/kid_bank_.git',
    live: 'https://k1dbank.netlify.app',
    images: [
      '/assets/projects/kid_bank/kid_bank01.png',
      '/assets/projects/kid_bank/kid_bank02.png',
    ],
  },
];
