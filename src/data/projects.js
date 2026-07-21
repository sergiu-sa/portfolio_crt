/**
 * Portfolio project data.
 *
 * Source of truth for the copy is `docs/PROJECTS.md` (gitignored).
 * Update that first, then reflect it here.
 *
 * To add a project: append an entry and drop images into
 * `public/assets/projects/<slug>/`. Schema:
 *
 *   id           Slug (lowercase-kebab) — stable identifier, used in the
 *                `#projects/<id>` deep link. Changing it breaks shared URLs.
 *   name         Display name.
 *   tags         Up to ~4 tech tags.
 *   year         YYYY.
 *   status       'LIVE' (deployed) or 'COMPLETE' (finished but not live).
 *   cover        Grid thumbnail — small 16:9 still. Keep it light; the index
 *                loads every cover at once.
 *   brief        One-sentence elevator pitch. Keep ≤ 140 chars.
 *   role         Short phrase: 'Solo — Project Exam 2', 'Team — Agency 1'.
 *   highlights   2–4 scannable bullets. Each ≤ 80 chars.
 *   github       Repo URL.
 *   live         Deployment URL (empty string if not live).
 *   images       Array of paths under `/assets/projects/<slug>/`, in display
 *                order. images[0] is the detail-view hero; all are browsable
 *                in the lightbox. Use `cover` — not images[0] — for the grid.
 *                Still images only (webp/png/jpg/gif) — the lightbox renders
 *                every entry into a single <img>, so a video path would show
 *                in the detail gallery and then fail to load in the lightbox.
 *
 * Order below is the grid order: strongest work first, archive after.
 */

export const projects = [
  {
    id: 'nordic-art',
    name: 'Nordic Art',
    tags: ['JavaScript', 'API', 'Auth', 'Tested'],
    year: '2026',
    status: 'LIVE',
    brief:
      'An artworks archive on the Noroff API, styled as a printed catalogue. Browse the feed, open a work, log in to file your own.',
    role: 'Solo — Exam Project 1',
    highlights: [
      'Vanilla JS, no framework and no build step — commits are what ships',
      'Client-side search, medium filters, grid and index views, load-more',
      'Ink-stain SVG filters over real text — the type stays selectable',
      '313 unit tests, a Playwright smoke test, W3C-valid markup',
    ],
    github: 'https://github.com/sergiu-sa/nordic_art_exam_1',
    live: 'https://nordicartarchive.netlify.app/',
    cover: '/assets/projects/nordic_art/fig1.webp',
    images: [
      '/assets/projects/nordic_art/fig1.webp',
      '/assets/projects/nordic_art/fig2.webp',
      '/assets/projects/nordic_art/fig3.webp',
      '/assets/projects/nordic_art/fig4.webp',
      '/assets/projects/nordic_art/amend1.webp',
      '/assets/projects/nordic_art/amend2.webp',
    ],
  },
  {
    id: 'aucto',
    name: 'Aucto',
    tags: ['TypeScript', 'Tailwind', 'API', 'Auth'],
    year: '2026',
    status: 'LIVE',
    brief:
      'A brutalist online auction platform. Browse live lots, place bids, list your own. The products lead, not the chrome.',
    role: 'Solo — Semester Project 2',
    highlights: [
      'Eight pages, each its own Vite entry, no framework and no router',
      'Single typed API client centralising auth and error handling',
      'Bento grid and 3px borders — items carry the weight, not decoration',
      'Built against real API data from day one, not tidy mockups',
    ],
    github: 'https://github.com/sergiu-sa/auction_house_sp2',
    live: 'https://auctohouse.netlify.app/',
    cover: '/assets/projects/aucto/fig1.webp',
    images: [
      '/assets/projects/aucto/fig1.webp',
      '/assets/projects/aucto/fig2.webp',
      '/assets/projects/aucto/fig3.webp',
      '/assets/projects/aucto/fig4.webp',
      '/assets/projects/aucto/amend_1.webp',
      '/assets/projects/aucto/amend_2.webp',
    ],
  },
  {
    id: 'linka',
    name: 'Linka',
    tags: ['TypeScript', 'Tailwind', 'Three.js', 'API'],
    year: '2025',
    status: 'LIVE',
    brief:
      'A social feed on the Noroff API. Editorial single-column layout, a 3D star intro, reading-mode posts, dark and light themes.',
    role: 'Solo rebuild — CSS Frameworks',
    highlights: [
      'Took over a group project and rebuilt the styling from scratch solo',
      '3D star intro — drag it and it spins, click it and it breaks apart',
      'Posts open in a reading-mode modal instead of expanding inline',
      'One theme source of truth recolours the 3D mesh and background live',
    ],
    github: 'https://github.com/sergiu-sa/linka-social-media',
    live: 'https://linka-social.netlify.app/',
    cover: '/assets/projects/linka/fig1.webp',
    images: [
      '/assets/projects/linka/fig1.webp',
      '/assets/projects/linka/fig2.webp',
      '/assets/projects/linka/fig3.webp',
      '/assets/projects/linka/fig4.webp',
      '/assets/projects/linka/amend2.webp',
    ],
  },
  {
    id: 'filmood',
    name: 'Filmood',
    tags: ['Next.js', 'Supabase', 'Realtime', 'TMDB'],
    year: '2026',
    status: 'LIVE',
    brief:
      'A film picker that starts from a mood, not a catalogue. Pick a feeling and get matching films, solo or as a group vote.',
    role: 'Solo rebuild — Agency 2',
    highlights: [
      'Asks how you want to feel, then refines by runtime, language, genre',
      'Group sessions: a six-character code, private picks merged to one deck',
      'Live updates over Supabase Realtime with a polling fallback',
      'Votes tallied into tiers so a group lands on one pick without arguing',
    ],
    github: 'https://github.com/sergiu-sa/filmood',
    live: 'https://filmood-pi.vercel.app/',
    cover: '/assets/projects/filmood/fig1.webp',
    images: [
      '/assets/projects/filmood/fig1.webp',
      '/assets/projects/filmood/fig2.webp',
      '/assets/projects/filmood/fig3.webp',
      '/assets/projects/filmood/fig4.webp',
      '/assets/projects/filmood/amend2.webp',
    ],
  },
  {
    id: 'holidaze',
    name: 'Holidaze',
    tags: ['TypeScript', 'React', 'Zod', 'API'],
    year: '2026',
    status: 'LIVE',
    brief:
      'An accommodation booking site on the Noroff API, styled as a printed travel magazine. Browse venues, book stays, list your own.',
    role: 'Solo — Project Exam 2',
    highlights: [
      'Three audiences in one interface: guests, customers, venue managers',
      'No state library — a small hook per feature over native fetch',
      'Every API response validated with Zod, which also generates the types',
      'WCAG 2.1 AA: focus rings, real buttons in calendars, native dialogs',
    ],
    github: 'https://github.com/sergiu-sa/holidaze_pe',
    live: 'https://holidaze-black.vercel.app/',
    cover: '/assets/projects/holidaze/fig1.webp',
    images: [
      '/assets/projects/holidaze/fig1.webp',
      '/assets/projects/holidaze/fig2.webp',
      '/assets/projects/holidaze/fig3.webp',
      '/assets/projects/holidaze/fig4.webp',
      '/assets/projects/holidaze/amend1.webp',
      '/assets/projects/holidaze/amend2.webp',
    ],
  },
  {
    id: 'adventure-trails',
    name: 'Adventure Trails',
    tags: ['HTML', 'CSS', 'JavaScript', 'A11y'],
    year: '2025',
    status: 'LIVE',
    brief:
      'A site for a fictional extreme-hiking outfitter, hand-built in HTML, CSS and vanilla JavaScript. No framework, no build step.',
    role: 'Solo — Semester Project 1',
    highlights: [
      'Rebuilt for the resit: full redesign plus vanilla JS, no build step',
      'Hike and gallery filters done purely in CSS via sibling selectors',
      'Cartographic palette where every colour has exactly one job',
      'Skip link, focus rings, ARIA roles, reduced-motion transitions',
    ],
    github: 'https://github.com/sergiu-sa/adventure_trails_hikes',
    live: 'https://adventuretrailshikes.netlify.app/',
    cover: '/assets/projects/adventure_trails/FIG1_home.webp',
    images: [
      '/assets/projects/adventure_trails/FIG1_home.webp',
      '/assets/projects/adventure_trails/FIG2_hikes.webp',
      '/assets/projects/adventure_trails/FIG3_gallery.webp',
      '/assets/projects/adventure_trails/fig4.webp',
    ],
  },
  {
    id: 'kid-bank',
    name: 'Kid Bank',
    tags: ['JavaScript', 'Vite', 'API', 'Netlify'],
    year: '2025',
    status: 'LIVE',
    brief:
      'A money app for teenagers. Track a budget, earn from chores, save toward goals, and scan barcodes that block age-restricted buys.',
    role: 'Team — Agency 1',
    highlights: [
      'My part: the barcode scanner, online shop, navigation and Vite setup',
      'Scans products and blocks age-restricted buys via Open Food Facts',
      'Netlify Functions proxy to get around the API CORS limits',
      'Native BarcodeDetector, with a ZXing fallback for older browsers',
    ],
    github: 'https://github.com/sergiu-sa/kid_bank_',
    live: 'https://k1dbank.netlify.app/',
    cover: '/assets/projects/kid_bank/fig1.webp',
    images: [
      '/assets/projects/kid_bank/fig1.webp',
      '/assets/projects/kid_bank/fig2.webp',
      '/assets/projects/kid_bank/fig3.webp',
      '/assets/projects/kid_bank/fig4.webp',
    ],
  },
  {
    id: 'ecom-store',
    name: 'eCom Store',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'API'],
    year: '2026',
    status: 'LIVE',
    brief:
      'An online store on the Noroff API. Search products, add to cart, and run a full checkout. Built on Next.js and React.',
    role: 'Solo — JavaScript Frameworks',
    highlights: [
      'Debounced live search, memoised, with skeletons and empty states',
      'Cart in React context with a reducer, persisted to localStorage',
      'Server-fetched pages handing interactive parts to client components',
      'Checkout runs from shipping details through to confirmation',
    ],
    github: 'https://github.com/sergiu-sa/js_frameworks_ca_online_shop',
    live: 'https://js-frameworks-ca-online-shop.vercel.app/',
    cover: '/assets/projects/e-com_shop/fig1.webp',
    images: [
      '/assets/projects/e-com_shop/fig1.webp',
      '/assets/projects/e-com_shop/fig2.webp',
      '/assets/projects/e-com_shop/fig3.webp',
      '/assets/projects/e-com_shop/fig4.webp',
      '/assets/projects/e-com_shop/amend1.webp',
      '/assets/projects/e-com_shop/amend2.webp',
    ],
  },
];
