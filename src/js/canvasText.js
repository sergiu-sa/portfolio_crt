/**
 * Canvas Text Sizing
 * Shared by the canvas channels (CH04 Breakout, CH07 Tuner).
 *
 * Sizing from canvas height alone works on a landscape desktop but breaks on a
 * tall narrow phone: at 379x1146 a 0.028 ratio gave a ~32px font, running
 * centred strings off both edges of the tube. Sizing from the *shorter* axis
 * keeps type proportional to the visible screen — the same basis the geometry
 * already uses (see BALL_R in breakout.js) — and the measure pass then
 * guarantees the string fits the width it was handed.
 */

const FACE = '"Press Start 2P", monospace';

/**
 * Set `ctx.font` so `text` fits inside a fraction of the canvas width.
 *
 * Sizes are in the caller's drawing units. Both canvas channels set
 * `canvas.width = rect.width * devicePixelRatio` and never call `ctx.scale`, so
 * today that means device px — `min` floors included.
 *
 * @param {CanvasRenderingContext2D} ctx - context whose font is being set
 * @param {string} text - the string about to be drawn
 * @param {number} w - canvas width, in the caller's drawing units
 * @param {number} h - canvas height, in the caller's drawing units
 * @param {number} ratio - desired size as a fraction of the shorter axis
 * @param {object} [options]
 * @param {number} [options.min=8] - smallest size to fall back to, in px
 * @param {number} [options.maxWidthFraction=0.9] - share of `w` the text may occupy
 * @param {string} [options.weight] - optional weight, e.g. `'bold'`
 * @returns {number} the size actually applied, for callers that lay out from it
 */
export function setFittedFont(ctx, text, w, h, ratio, options = {}) {
  const { min = 8, maxWidthFraction = 0.9, weight = '' } = options;
  const prefix = weight ? `${weight} ` : '';
  const limit = w * maxWidthFraction;

  let size = Math.max(min, Math.min(w, h) * ratio);
  ctx.font = `${prefix}${size}px ${FACE}`;

  const measured = ctx.measureText(text).width;
  if (measured <= limit) return size;

  // Press Start 2P advances are uniform, so one proportional step lands within
  // a pixel. The loop covers fallback faces, whose metrics don't.
  size = Math.max(min, size * (limit / measured));
  ctx.font = `${prefix}${size}px ${FACE}`;

  while (size > min && ctx.measureText(text).width > limit) {
    size = Math.max(min, size - 0.5);
    ctx.font = `${prefix}${size}px ${FACE}`;
  }

  return size;
}
