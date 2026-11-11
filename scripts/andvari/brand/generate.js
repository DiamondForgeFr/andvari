#!/usr/bin/env node
/* eslint-disable no-console, @typescript-eslint/no-require-imports */
// Generates Andvari's brand assets for the browser extension from the mark in keychest.js.
// See README.md in this folder for the tools it needs and how to run it.
//
//   node scripts/andvari/brand/generate.js --tools <dir> --font <SpaceGrotesk-Bold.ttf>
//
// Writes, under apps/browser/andvari/:
//   images/icon<size>{,_gray,_locked}.png   toolbar and app icons, same names as upstream's
//   images/andvari-mark.png                 the full mark, transparent, for in-page use
//   popup-images/logo-{dark,white}@2x.png   wordmark bitmaps, same names as upstream's
//   assets/andvari-logo.icon.js             wordmark and icon modules (BitSvg)
//   assets/autofill-svg-icons.js            inline menu button icons
//   assets/autofill-shield.js               notification bar brand icon
const fs = require("fs");
const { createRequire } = require("module");
const path = require("path");

const { scene, bust } = require("./keychest");

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
}
if (!args.tools || !args.font) {
  console.error(
    "Usage: generate.js --tools <dir with @resvg/resvg-js and opentype.js> --font <ttf>",
  );
  process.exit(2);
}
const toolsRequire = createRequire(path.join(path.resolve(args.tools), "package.json"));
const { Resvg } = toolsRequire("@resvg/resvg-js");
const opentype = toolsRequire("opentype.js");

const ROOT = path.resolve(__dirname, "../../..");
const OUT = path.join(ROOT, "apps/browser/andvari");

const GOLD = "#E3B341";
const GOLD_LIGHT_THEME = "#B98316"; // deeper gold, legible on a white surface
const TILE = "#111317";
const GRAY_TILE = "#2A2D33";
const GRAY_MARK = "#8B9099";

const svgDoc = (w, h, body, viewBox = `0 0 ${w} ${h}`) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${body}</svg>`;

function png(svg, width) {
  return new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
}

function write(rel, data) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  console.log(`  ${path.relative(ROOT, file)}`);
}

// The mark with transparent cuts: gold shapes drawn white and cuts black inside a mask,
// then one gold rectangle shown through it. It works on any background, and it is not a
// <path>, so containers that recolour a logo's paths leave it gold.
function maskedMark(draw, id, attrs) {
  return (
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">${draw("#FFFFFF", "#000000")}</mask>` +
    `<rect width="64" height="64" mask="url(#${id})" ${attrs}/>`
  );
}

// Toolbar and app icons: the mark on a dark rounded tile, so it reads on light and dark toolbars.
const SIZES = [16, 19, 32, 38, 48, 96, 128];
const LOCKED = [19, 38];

function tile(size, { gray = false, locked = false } = {}) {
  const bg = gray ? GRAY_TILE : TILE;
  const fg = gray ? GRAY_MARK : GOLD;
  const draw = size >= 96 ? scene : bust;
  // Small icons use almost the whole tile; large ones keep a margin, as app icons do.
  const inset = size >= 96 ? 7 : 3;
  const scale = (64 - 2 * inset) / 64;
  let body =
    `<rect width="64" height="64" rx="14" fill="${bg}"/>` +
    `<g transform="translate(${inset} ${inset}) scale(${scale})">${draw(fg, bg)}</g>`;
  if (locked) {
    // Padlock badge in the bottom-right corner, as upstream's locked icon.
    body +=
      `<path fill="none" stroke="${TILE}" stroke-width="9" d="M44 41 V36 A8 8 0 0 1 60 36 V41"/>` +
      `<path fill="none" stroke="#ECE8E1" stroke-width="3.6" d="M44 41 V36 A8 8 0 0 1 60 36 V41"/>` +
      `<rect x="37.5" y="39" width="29" height="27" rx="5" fill="${TILE}"/>` +
      `<rect x="40" y="41.5" width="24" height="22" rx="3.5" fill="#ECE8E1"/>` +
      `<path fill="${TILE}" d="M50.4 50.5 A2.6 2.6 0 1 1 53.6 50.5 L54.4 56 H49.6 Z"/>`;
  }
  return svgDoc(64, 64, body);
}

console.log("Icons");
for (const size of SIZES) {
  write(`images/icon${size}.png`, png(tile(size), size));
  write(`images/icon${size}_gray.png`, png(tile(size, { gray: true }), size));
  if (LOCKED.includes(size)) {
    write(`images/icon${size}_locked.png`, png(tile(size, { locked: true }), size));
  }
}
write(
  "images/andvari-mark.png",
  png(svgDoc(64, 64, maskedMark(scene, "m", `fill="${GOLD}"`)), 192),
);

// Wordmark: the bust, then "Andvari" in Space Grotesk Bold (SIL OFL 1.1) converted to paths.
const font = opentype.parse(fs.readFileSync(args.font).buffer);
const H = 45;
const TEXT_X = 52;
const TEXT_SIZE = 40;
const BASELINE = 36;
const text = font.getPath("Andvari", TEXT_X, BASELINE, TEXT_SIZE);
const textD = text.toPathData(2);
if (textD.includes("NaN")) {
  // opentype.js 2.0.0 drops control points on some glyphs (the dot of the "i"); use 1.3.4.
  throw new Error("The wordmark path contains NaN: use opentype.js 1.3.4 (see README.md).");
}
const W = Math.ceil(text.getBoundingBox().x2 + 1);
const markScale = H / 64;
const wordmarkMark = (id, attrs) =>
  `<g transform="scale(${markScale})">${maskedMark(bust, id, attrs)}</g>`;

console.log("Wordmark bitmaps");
for (const [name, ink] of [
  ["dark", TILE],
  ["white", "#FFFFFF"],
]) {
  const body = wordmarkMark("m", `fill="${GOLD}"`) + `<path fill="${ink}" d="${textD}"/>`;
  write(`popup-images/logo-${name}@2x.png`, png(svgDoc(W, H, body), Math.round((W * 86) / H)));
}

// BitSvg modules. The svg tag accepts no interpolation, so the markup is written out literally.
const goldStyle = `<style>.andvari-gold{fill:${GOLD_LIGHT_THEME}}.theme_dark .andvari-gold{fill:${GOLD}}</style>`;
const logoSvg =
  `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><title>Andvari</title>${goldStyle}` +
  wordmarkMark("andvari-logo-mark", `class="andvari-gold" fill="${GOLD}"`) +
  `<path class="tw-fill-text-main" d="${textD}"/></svg>`;
const iconSvg =
  `<svg width="20" height="20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">` +
  `<rect width="64" height="64" rx="12" fill="${TILE}"/>` +
  `<g transform="translate(4 4) scale(0.875)">${bust(GOLD, TILE)}</g></svg>`;

const header = (what) =>
  `// Generated by scripts/andvari/brand/generate.js: do not edit by hand.\n// ${what}\n`;

console.log("Modules");
write(
  "assets/andvari-logo.icon.js",
  header(
    "Replaces Bitwarden's logo and icon tile in the build (ANDVARI-PATCH #3, apps/browser/webpack.base.js).",
  ) +
    "/* eslint-disable @bitwarden/components/require-theme-colors-in-svg -- Andvari's own brand mark: fixed brand gold, and mask luminance values that are never displayed */\n" +
    `import { svg } from "../../../../libs/assets/src/svg/svg";\n\n` +
    `export const AndvariLogo = svg\`${logoSvg}\`;\n\n` +
    `export const AndvariIcon = svg\`${iconSvg}\`;\n\n` +
    "// The names the upstream modules export, so every import of them resolves here.\n" +
    "export const BitwardenLogo = AndvariLogo;\n" +
    "export const BitwardenLogoBeta = AndvariLogo;\n" +
    "export const BitwardenIcon = AndvariIcon;\n",
);

// Inline menu button: 14 and 16 px icons sitting on the page's input, so the cuts stay transparent.
const buttonMark = (id) => maskedMark(bust, id, `fill="${GOLD_LIGHT_THEME}"`);
const logoIcon = svgDoc(14, 14, buttonMark("andvari-ib"), "0 0 64 64");
const logoLockedIcon = svgDoc(
  16,
  16,
  `<g transform="scale(0.8)">${buttonMark("andvari-ibl")}</g>` +
    `<path fill="none" stroke="#5A5F68" stroke-width="4" d="M45 46 V41 A7 7 0 0 1 59 41 V46"/>` +
    `<rect x="40" y="45" width="24" height="19" rx="3.5" fill="#5A5F68"/>`,
  "0 0 64 64",
);
// The other icons are copied verbatim from upstream rather than imported: the content script
// bundles are not minified, so importing the upstream module, even by name, would ship its
// unused constants, Bitwarden's logo included. brand.spec.ts checks the copies stay identical.
const upstreamIcons = fs
  .readFileSync(path.join(ROOT, "apps/browser/src/autofill/utils/svg-icons.ts"), "utf8")
  .split(/\n(?=export const )/)
  .map((block) => block.trim())
  .filter((block) => !/^export const (logoIcon|logoLockedIcon) =/.test(block));
write(
  "assets/autofill-svg-icons.js",
  header(
    "Replaces the brand icons of src/autofill/utils/svg-icons.ts in the build (ANDVARI-PATCH #3); the other icons are upstream's, copied.",
  ) +
    upstreamIcons.join("\n\n") +
    "\n\n" +
    `export const logoIcon =\n  '${logoIcon}';\n\n` +
    `export const logoLockedIcon =\n  '${logoLockedIcon}';\n`,
);

// Notification bar brand icon: same contract as src/autofill/content/components/icons/shield.ts.
write(
  "assets/autofill-shield.js",
  header(
    "Replaces src/autofill/content/components/icons/shield.ts in the build (ANDVARI-PATCH #3): the Andvari mark instead of the shield.",
  ) +
    `import { html } from "lit";\n\n` +
    `export function Shield({ ariaHidden = true, color }) {\n` +
    `  const fill = color || "${GOLD}";\n` +
    "  return html`\n" +
    `    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="\${ariaHidden}">\n` +
    `      <mask id="andvari-nb" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">${bust("#FFFFFF", "#000000")}</mask>\n` +
    `      <rect width="64" height="64" mask="url(#andvari-nb)" fill="\${fill}" />\n` +
    "    </svg>\n" +
    "  `;\n" +
    "}\n",
);
console.log("Done.");
