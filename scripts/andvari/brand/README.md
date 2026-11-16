# Andvari brand assets

The mark is "the rune portal" (owner's decision on issue #19, replacing "the keeper" of #3), drawn from Andvari's door in the DiamondForge site game. `portal.js` draws it on a 64 × 64 grid, flat and in two colours only (no gradient, glow or reflection):

- the **rim**: a gold band, a stone ring carved with 12 runes and 12 gold studs, an inner gold band;
- the **open** centre (vault unlocked): a gold water surface, dark ripples around a dark drop;
- the **locked** centre: an iris of six dark blades with gold seams, held by a gold cog.

`node scripts/andvari/brand/portal.js open|locked` prints either as a standalone SVG.

`generate.js` turns it into every asset the extension ships, under `apps/browser/andvari/`:

| Output                                  | Used for                                                                                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `images/icon<size>{,_gray,_locked}.png` | Toolbar and app icons, following the vault: open (unlocked), locked portal (locked), locked portal in greys (logged out). Same names as `apps/browser/src/images/`, which they overwrite in the build |
| `images/andvari-mark.png`               | The open mark on its own (about dialog)                                                                                                                                                               |
| `popup-images/logo-{dark,white}@2x.png` | Wordmark bitmaps, same names as `apps/browser/src/popup/images/`                                                                                                                                      |
| `assets/andvari-logo.icon.js`           | Wordmark and 20 px icon as `BitSvg`, in place of `BitwardenLogo`, `BitwardenLogoBeta` and `BitwardenIcon`                                                                                             |
| `assets/autofill-svg-icons.js`          | Inline menu button icons (open and locked), in place of `logoIcon` and `logoLockedIcon`                                                                                                               |
| `assets/autofill-shield.js`             | Notification bar brand icon, in place of `Shield`                                                                                                                                                     |

`apps/browser/andvari/brand-webpack.js` puts them in the build (`ANDVARI-PATCH #3` in `apps/browser/webpack.base.js`), and `scripts/andvari/check-brand.js` fails the build if any Bitwarden icon or logo is left.

In the `BitSvg` modules the mark is an `<image>` holding its own SVG: the popup header recolours every `<path>` of its logo (`[&_path]:tw-fill-fg-nav`), which then reaches the word "Andvari" only, and the mark carries no id that could clash with the page.

## Regenerating

The outputs are committed; regenerate them only when the mark changes. The tools stay out of the repository's `package.json`:

```bash
npm install --prefix /tmp/andvari-brand-tools @resvg/resvg-js opentype.js@1.3.4
curl -sSfLo /tmp/SpaceGrotesk-Bold.ttf \
  https://github.com/floriankarsten/space-grotesk/raw/master/fonts/ttf/static/SpaceGrotesk-Bold.ttf
node scripts/andvari/brand/generate.js --tools /tmp/andvari-brand-tools --font /tmp/SpaceGrotesk-Bold.ttf
npx prettier --write apps/browser/andvari
```

Regenerate also when upstream changes `apps/browser/src/autofill/utils/svg-icons.ts`: `assets/autofill-svg-icons.js` carries copies of its other icons (the content scripts are not minified, so importing the upstream module would ship its Bitwarden logo too), and `brand.spec.ts` fails until they match again.

- **opentype.js 1.3.4**, not 2.0.0: 2.0.0 loses control points on the dot of the "i" and the script stops.
- **Space Grotesk** is under the SIL Open Font License 1.1. Only the outlines of the word "Andvari" end up in the build, as SVG paths; the font file is not shipped.

## Colours

| Token    | Value     | Where                                  |
| -------- | --------- | -------------------------------------- |
| Gold     | `#E3B341` | Bands, runes, water, seams and cog     |
| Ink      | `#111317` | Stone ring, ripples, drop, iris blades |
| Grey     | `#8B9099` | Gold of the logged-out icon            |
| Grey ink | `#1E2024` | Ink of the logged-out icon             |

The mark is its own disc, with a gold edge: it reads on light and dark surfaces without a tile.
