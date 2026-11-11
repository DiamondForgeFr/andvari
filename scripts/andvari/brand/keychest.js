// The Andvari mark, "the keeper": a dwarf guard in profile raising a small key, bit up,
// his chest behind him. Drawn on a 64 x 64 grid with two colours: the gold (G) and the
// cut colour (C), which separates the shapes and must match whatever lies behind the mark.
//
//   scene(G, C)  full mark, for 48 px and up
//   bust(G, C)   head, raised key and torso with thicker cuts, for 14 to 32 px
//
// Both return SVG elements (no <svg> wrapper) in the 64 x 64 grid.
// CLI: `node keychest.js scene|bust [gold] [cut]` prints a standalone SVG.

const shapes = [
  "M20 24 C16 30 14 40 12.5 52 L21 50 Z", // cape
  "M19.5 30 C17.5 38 17.5 44 19.5 49 H38.5 C41 46 41.5 41 40 37 L37.5 32 Z", // torso
  "M20 48 H27 V60 H17.5 C17.5 58 18.5 56 20 56 Z", // back leg
  "M30 48 H37 V56 H38 C39.5 56 40 58 39.5 60 H30 Z", // front leg
];
// A small key held by its bow, the bit pointing up.
const key = "M44.8 8 H46.8 V30 H44.8 Z M46.8 8 H50.6 V10 H49 V11.6 H50.6 V13.6 H46.8 Z";
const bow = "M45.8 28.6 A3 3 0 1 1 45.79 28.6 Z";
const arm = "M31 37 C35 33 39 28 43.5 23.5 L46.5 26.5 C42.5 31 38 36 33.5 41 Z";
const fist =
  "M42.6 22 C42.6 20.8 43.6 20 45.8 20 C48 20 49 20.8 49 22 V26.5 C49 27.7 48 28.5 45.8 28.5 C43.6 28.5 42.6 27.7 42.6 26.5 Z";
const head =
  "M19 22.5 C19 15 22.5 11.5 27.5 11.5 C32.5 11.5 36 15 36.6 22.5 L37.2 24 C38.6 24.6 39.4 25.8 38.6 27 L37 27.3 C38.7 30.2 39.3 34 38.3 38 L36.9 43 L35.3 41.4 L33.7 44.6 L32 41.9 L30.2 44.1 L29 40.2 L22 36.5 Z";

const fill = (G) => (d) => `<path fill="${G}" d="${d}"/>`;
const halo = (C) => (d, w) =>
  `<path fill="${C}" stroke="${C}" stroke-width="${w}" stroke-linejoin="round" d="${d}"/>`;

function figure(G, C) {
  const f = fill(G);
  const h = halo(C);
  return (
    [...shapes, key, bow, arm, head, fist].map((d) => h(d, 2.4)).join("") +
    shapes.map(f).join("") +
    f(key) +
    f(bow) +
    `<circle cx="45.8" cy="31.6" r="1.1" fill="${C}"/>` +
    h(arm, 1.4) +
    f(arm) +
    h(head, 1.4) +
    f(head) +
    h(fist, 1.2) +
    f(fist) +
    `<g fill="none" stroke="${C}" stroke-linecap="round">` +
    '<path stroke-width="1.3" d="M19.3 21.4 H36.4"/>' + // helmet rim
    '<path stroke-width="1.4" d="M18.5 45.2 H39.6"/>' + // belt
    '<path stroke-width="1" d="M27.5 12 V21"/>' + // helmet ridge
    '<path stroke-width="1" d="M43.4 23.3 H48.2 M43.4 25.6 H48.2"/>' + // fingers
    "</g>" +
    `<circle cx="33.6" cy="24.3" r="0.85" fill="${C}"/>` +
    `<path fill="none" stroke="${C}" stroke-width="0.9" stroke-linecap="round" d="M31.5 31 L32.3 36.5 M34.6 30.5 L35.2 35.5"/>` // beard braids
  );
}

// Domed chest with two straps and a lock plate. x, y: top-left of the body; w, h: body size.
function chest(G, C, x, y, w, h) {
  const r = x + w;
  const b = y + h;
  const lid = h * 0.42;
  const shape = `M${x} ${y} C${x} ${y - lid} ${x + w * 0.15} ${y - lid * 1.15} ${x + w / 2} ${y - lid * 1.15} C${r - w * 0.15} ${y - lid * 1.15} ${r} ${y - lid} ${r} ${y} V${b} H${x} Z`;
  const s1 = x + w * 0.2;
  const s2 = r - w * 0.2;
  const m = x + w / 2;
  return (
    `<path fill="${G}" d="${shape}"/>` +
    `<path fill="none" stroke="${C}" stroke-width="1.3" d="M${x} ${y + 0.6} H${r} M${s1} ${y - lid * 0.95} V${b} M${s2} ${y - lid * 0.95} V${b}"/>` +
    `<rect x="${m - 3.2}" y="${y - 1.6}" width="6.4" height="8" rx="1.2" fill="${G}" stroke="${C}" stroke-width="1.2"/>` +
    `<path fill="${C}" d="M${m - 0.8} ${y + 2.6} A1.4 1.4 0 1 1 ${m + 0.8} ${y + 2.6} L${m + 1.2} ${y + 5.2} H${m - 1.2} Z"/>`
  );
}

function scene(G = "#E3B341", C = "#111317") {
  return (
    chest(G, C, 1.5, 43, 25, 17) +
    `<g transform="translate(7 0)">${figure(G, C)}</g>` +
    `<path stroke="${G}" stroke-width="1.6" stroke-linecap="round" d="M2 62.5 H62"/>`
  );
}

function bust(G = "#E3B341", C = "#111317") {
  const f = fill(G);
  const h = halo(C);
  return (
    '<g transform="translate(-14.24 -6.48) scale(1.35)">' +
    [shapes[1], key, bow, arm, head, fist].map((d) => h(d, 2.4)).join("") +
    f(shapes[1]) +
    f(key) +
    f(bow) +
    `<circle cx="45.8" cy="31.6" r="1.3" fill="${C}"/>` +
    h(arm, 1.8) +
    f(arm) +
    h(head, 1.8) +
    f(head) +
    h(fist, 1.6) +
    f(fist) +
    `<path fill="none" stroke="${C}" stroke-width="1.8" stroke-linecap="round" d="M19.3 21.4 H36.4 M27.5 12.5 V20.5"/>` +
    `<circle cx="33.4" cy="24.4" r="1.1" fill="${C}"/>` +
    `<path fill="none" stroke="${C}" stroke-width="1.3" stroke-linecap="round" d="M32 31 L32.8 36.5"/>` +
    "</g>"
  );
}

module.exports = { scene, bust };

if (require.main === module) {
  const [kind = "scene", G, C] = process.argv.slice(2);
  const body = kind === "bust" ? bust(G, C) : scene(G, C);
  process.stdout.write(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">${body}</svg>\n`,
  );
}
