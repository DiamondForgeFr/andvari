#!/usr/bin/env node
/* eslint-disable no-console, @typescript-eslint/no-require-imports */
// Fails when a built extension still carries a Bitwarden icon, logo or shield (FR-BRAND-02, #3).
//
//   node scripts/andvari/check-brand.js apps/browser/build
//
// The markers are read from the upstream sources at check time, so the guard follows upstream:
//   - every PNG of src/images and src/popup/images that Andvari overlays must differ, byte for byte,
//     from the upstream file of the same name;
//   - no built file may contain the path data of the Bitwarden logo, icon tile or shields.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const BROWSER = path.join(ROOT, "apps/browser");
const OVERLAYS = [
  ["andvari/images", "src/images", "images"],
  ["andvari/popup-images", "src/popup/images", "popup/images"],
];
// Upstream files whose SVG path data is Bitwarden's brand.
const BRAND_SOURCES = [
  "libs/assets/src/svg/svgs/bitwarden-logo.icon.ts",
  "libs/assets/src/svg/svgs/bitwarden-logo-beta.icon.ts",
  "libs/assets/src/svg/svgs/bitwarden-icon.ts",
  "apps/browser/src/autofill/content/components/icons/shield.ts",
];
const SVG_ICONS = "apps/browser/src/autofill/utils/svg-icons.ts";

const build = path.resolve(process.argv[2] || path.join(BROWSER, "build"));
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const problems = [];

// 1. Icons and logo bitmaps: the built file must not be the upstream one.
for (const [overlay, upstream, out] of OVERLAYS) {
  for (const name of fs.readdirSync(path.join(BROWSER, overlay))) {
    const upstreamFile = path.join(BROWSER, upstream, name);
    const built = path.join(build, out, name);
    if (!fs.existsSync(built)) {
      problems.push(`missing ${out}/${name}`);
    } else if (fs.existsSync(upstreamFile) && sha(upstreamFile) === sha(built)) {
      problems.push(`${out}/${name} is Bitwarden's`);
    }
  }
}

// 2. Vector marks: the start of each brand path, long enough to be unique.
const markers = new Set();
const pathData = (source) =>
  [...source.matchAll(/\bd="([^"]{40,})"/g)].map((m) => m[1].slice(0, 40));
for (const rel of BRAND_SOURCES) {
  pathData(fs.readFileSync(path.join(ROOT, rel), "utf8")).forEach((d) => markers.add(d));
}
const svgIcons = fs.readFileSync(path.join(ROOT, SVG_ICONS), "utf8");
for (const name of ["logoIcon", "logoLockedIcon"]) {
  const block = svgIcons.match(new RegExp(`export const ${name} =\\s*'([^']*)'`));
  pathData(block ? block[1] : "").forEach((d) => markers.add(d));
}
if (markers.size === 0) {
  problems.push("no brand markers found in the upstream sources: update check-brand.js");
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
for (const file of walk(build)) {
  if (!/\.(js|html|css|svg|json)$/.test(file)) {
    continue;
  }
  const text = fs.readFileSync(file, "utf8");
  for (const marker of markers) {
    if (text.includes(marker)) {
      problems.push(
        `${path.relative(build, file)} contains Bitwarden path data (${marker.slice(0, 16)}…)`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error("✗ The build carries Bitwarden branding:");
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log(`✓ No Bitwarden icon or logo in the build (${markers.size} vector marks checked)`);
