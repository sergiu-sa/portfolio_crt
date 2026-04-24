/**
 * On-Air Capabilities for the About page.
 *
 * Schema:
 *   name   Display label (shown beside the signal bar).
 *   level  Signal strength 1–10 (drives bar fill width).
 *   tier   Visual tier: 'strong' (green), 'working' (yellow),
 *          'learning' (orange). Tune these honestly — they map
 *          directly to what a recruiter reads off the bars.
 *
 * Order is the order shown on screen. Earlier entries are
 * considered the strongest signals; put your most-used stack first.
 */

export const skills = [
  { name: 'HTML5', level: 9, tier: 'strong' },
  { name: 'CSS3', level: 9, tier: 'strong' },
  { name: 'JavaScript', level: 8, tier: 'strong' },
  { name: 'TypeScript', level: 7, tier: 'working' },
  { name: 'Tailwind CSS', level: 7, tier: 'working' },
  { name: 'Git', level: 8, tier: 'strong' },
  { name: 'Figma', level: 6, tier: 'working' },
  { name: 'Three.js', level: 5, tier: 'learning' },
];
