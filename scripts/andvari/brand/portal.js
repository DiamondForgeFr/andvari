#!/usr/bin/env node
/* eslint-disable no-console */
// Andvari's mark, "the rune portal" (owner's decision on issue #19), on a 64 × 64 grid.
// Drawn from Andvari's door in the DiamondForge site game: a gold-banded stone ring carved
// with runes, around a centre that shows the vault's state.
//
//   portal("open", colours)    the water surface with its ripples: the vault is unlocked
//   portal("locked", colours)  an iris of six blades held by a cog: the vault is locked
//
// Flat, two colours only (gold and ink): no gradient, glow or reflection.
// CLI: `node portal.js open|locked [gold] [ink]` prints a standalone SVG.
const TAU = Math.PI * 2;
const C = 32;
const GOLD = "#E3B341";
const INK = "#111317";

// The centre's disc, inside the inner gold band.
const R_IN = 17.6;

const f = (n) => +n.toFixed(2);
const polar = (r, a, cx = C, cy = C) => [f(cx + Math.cos(a) * r), f(cy + Math.sin(a) * r)];
const circle = (r, fill) => `<circle cx="${C}" cy="${C}" r="${r}" fill="${fill}"/>`;

// Rune strokes: generic drawn signs, not a copied alphabet (same strokes as the game's door).
const RUNES = [
  [
    [0, -3, 0, 3],
    [0, -3, 2.2, -1.2],
    [0, 0, 2.2, 1.8],
  ],
  [
    [0, -3, 0, 3],
    [-2, -1.5, 2, 1.5],
  ],
  [
    [-1.6, 3, 0, -3],
    [0, -3, 1.6, 3],
    [-0.8, 0.5, 0.8, 0.5],
  ],
  [
    [0, -3, 0, 3],
    [-2, -2.5, 0, -0.5],
    [2, -2.5, 0, -0.5],
  ],
  [
    [-2, -3, 2, 3],
    [2, -3, -2, 3],
  ],
];

// Twelve runes standing towards the centre, with a gold stud between each pair.
function runeBand(gold) {
  const r = 24.6;
  let d = "";
  let studs = "";
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 12;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const [px, py] = polar(r, a);
    for (const [x1, y1, x2, y2] of RUNES[i % RUNES.length]) {
      const k = 1.02;
      d += `M${f(px + (x1 * -s + y1 * c) * k)} ${f(py + (x1 * c + y1 * s) * k)}`;
      d += `L${f(px + (x2 * -s + y2 * c) * k)} ${f(py + (x2 * c + y2 * s) * k)}`;
    }
    const [sx, sy] = polar(r, a + TAU / 24);
    studs += `<circle cx="${sx}" cy="${sy}" r="1.05" fill="${gold}"/>`;
  }
  return (
    `<path d="${d}" fill="none" stroke="${gold}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>` +
    studs
  );
}

// The rim: gold band, stone ring with its runes, inner gold band.
const rim = (gold, ink) => circle(31, gold) + circle(29, ink) + runeBand(gold) + circle(19.4, gold);

// A ripple: a ring of radius 16 with six soft bumps, shrunk to `scale` around the centre.
function ripple(scale, phase, ink) {
  let d = "";
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * TAU;
    const [x, y] = polar((16 + 0.5 * Math.sin(6 * a + phase)) * scale, a);
    d += `${i ? "L" : "M"}${x} ${y}`;
  }
  return `<path d="${d}Z" fill="none" stroke="${ink}" stroke-width="${f(1.8 * scale)}" stroke-linejoin="round"/>`;
}

// Open: the gold water surface, three ripples leaving a dark drop.
const water = (gold, ink) =>
  circle(R_IN, gold) +
  [0.3, 0.55, 0.8].map((s, i) => ripple(s, i, ink)).join("") +
  circle(2.2, ink);

// Locked: six dark blades turning around the centre (a pinwheel iris), gold seams, and the
// cog that drives them. Each blade runs from one rim point to the next along the disc's edge.
function iris(gold, ink) {
  const n = 6;
  const twist = 1.15;
  const edge = R_IN + 0.9; // under the inner gold band, so no seam shows at the edge
  let blades = "";
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + (i * TAU) / n;
    const a1 = a0 + TAU / n;
    const [x0, y0] = polar(edge, a0);
    const [x1, y1] = polar(edge, a1);
    const [tx, ty] = polar(6.4, a0 + TAU / n / 2 + twist);
    blades +=
      `<path d="M${x0} ${y0}L${tx} ${ty}L${x1} ${y1}A${edge} ${edge} 0 0 0 ${x0} ${y0}Z" ` +
      `fill="${ink}" stroke="${gold}" stroke-width="1.1" stroke-linejoin="round"/>`;
  }
  // The cog: ten teeth, a hole, a gold axle.
  let d = "";
  const teeth = 10;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU;
    const step = TAU / teeth;
    [
      [5.9, 0],
      [7.6, 0.18],
      [7.6, 0.5],
      [5.9, 0.68],
    ].forEach(([r, t], k) => {
      const [x, y] = polar(r, a + t * step);
      d += `${i || k ? "L" : "M"}${x} ${y}`;
    });
  }
  const hole = 2.4;
  d += `Z M${C + hole} ${C}a${hole} ${hole} 0 1 0 ${-2 * hole} 0a${hole} ${hole} 0 1 0 ${2 * hole} 0Z`;
  return (
    circle(R_IN, ink) +
    blades +
    `<path fill-rule="evenodd" d="${d}" fill="${gold}" stroke="${ink}" stroke-width="0.8"/>` +
    circle(1.2, gold) +
    // The inner gold band again, over the blades' outer ends.
    `<circle cx="${C}" cy="${C}" r="18.5" fill="none" stroke="${gold}" stroke-width="1.8"/>`
  );
}

function portal(state = "open", { gold = GOLD, ink = INK } = {}) {
  return rim(gold, ink) + (state === "locked" ? iris(gold, ink) : water(gold, ink));
}

module.exports = { portal, GOLD, INK };

if (require.main === module) {
  const [state = "open", gold, ink] = process.argv.slice(2);
  console.log(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${portal(state, { gold, ink })}</svg>`,
  );
}
