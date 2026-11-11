# Andvari brand assets

The mark is "the keeper": a dwarf guard raising a small key, his chest behind him (decision on issue #3). `keychest.js` draws it on a 64 × 64 grid in two forms:

- `scene`: the full mark, for 48 px and up;
- `bust`: head, raised key and torso with thicker cuts, for 14 to 32 px.

`generate.js` turns it into every asset the extension ships, under `apps/browser/andvari/`:

| Output                                  | Used for                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `images/icon<size>{,_gray,_locked}.png` | Toolbar and app icons (normal, logged out, locked). Same names as `apps/browser/src/images/`, which they overwrite in the build |
| `images/andvari-mark.png`               | The mark on its own, transparent (about dialog)                                                                                 |
| `popup-images/logo-{dark,white}@2x.png` | Wordmark bitmaps, same names as `apps/browser/src/popup/images/`                                                                |
| `assets/andvari-logo.icon.js`           | Wordmark and 20 px tile as `BitSvg`, in place of `BitwardenLogo`, `BitwardenLogoBeta` and `BitwardenIcon`                       |
| `assets/autofill-svg-icons.js`          | Inline menu button icons, in place of `logoIcon` and `logoLockedIcon`                                                           |
| `assets/autofill-shield.js`             | Notification bar brand icon, in place of `Shield`                                                                               |

`apps/browser/andvari/brand-webpack.js` puts them in the build (`ANDVARI-PATCH #3` in `apps/browser/webpack.base.js`), and `scripts/andvari/check-brand.js` fails the build if any Bitwarden icon or logo is left.

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

| Token     | Value     | Where                                                                     |
| --------- | --------- | ------------------------------------------------------------------------- |
| Gold      | `#E3B341` | The mark on dark surfaces and on the icon tile                            |
| Deep gold | `#B98316` | The mark on light surfaces (light theme, inline menu button on web pages) |
| Tile      | `#111317` | Background of the toolbar icon                                            |

Inside the UI the mark sits straight on the background, without a tile: its cuts are transparent (an SVG mask), so it works on any surface.
