// The rune portal on the lock screen and the unlock transition (#20).
//
// Runs beside the popup's Angular app without touching it: it watches the page for the lock
// screen (`bit-lock`) and the vault's tab bar (`popup-tab-navigation`).
//   - On the lock screen, the static locked portal is replaced by the animated one.
//   - When the lock screen gives way to the vault, the vault is already rendered: an ink layer
//     with the portal goes under it, the iris opens, then we enter the portal while the vault,
//     clipped to the water, comes from far behind it. The vault is usable as soon as it is shown.
//   - When the vault gives way to the lock screen, we step back out of the portal.
// Styles: ../theme/portal.css. With reduced motion, nothing plays.
import { PORTAL_SVG } from "../assets/portal-animated";

const IRIS_MS = 1250;
const ENTER_MS = 900;
const LEAVE_MS = 700;
// Share of the mark's width taken by the water's radius and the inner gold band's (on a 64 grid).
const WATER = 17.6 / 64;
const BAND = 19 / 64;
// How much the portal grows when we go through it; must match andv-zoom-portal in portal.css.
const ZOOM = 14;

let ids = 0;
let lastHero = null;
let vaultShown = false;
let lockShown = false;
let busy = false;
// When the lock screen went away: the vault may only appear in a later mutation.
let lockLeftAt = 0;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makePortal() {
  const template = document.createElement("template");
  template.innerHTML = PORTAL_SVG.replaceAll("ANDV_ID", `andv-water-${++ids}`);
  return template.content.firstElementChild;
}

function heroBox() {
  return document.querySelector("bit-lock")
    ? document.querySelector("bit-landing-hero bit-svg")?.parentElement
    : null;
}

// The lock screen: the animated portal in place of the static one.
function mountHero() {
  const box = heroBox();
  if (!box || box.classList.contains("andv-hero")) {
    return box;
  }
  box.classList.add("andv-hero");
  box.appendChild(makePortal());
  return box;
}

// The portal's own box: the hero's box is wider than the mark on some layouts.
function rememberHero(box) {
  const rect = (box.querySelector(".andv-portal") ?? box).getBoundingClientRect();
  if (rect.width > 0) {
    lastHero = rect;
  }
}

function setCentre(rect) {
  const root = document.documentElement.style;
  root.setProperty("--andv-cx", `${rect.left + rect.width / 2}px`);
  root.setProperty("--andv-cy", `${rect.top + rect.height / 2}px`);
}

async function enter(rect) {
  busy = true;
  const html = document.documentElement;
  const gate = document.createElement("div");
  gate.className = "andv-gate";
  gate.setAttribute("aria-hidden", "true");
  const ink = document.createElement("div");
  ink.className = "andv-gate-ink";
  const zoom = document.createElement("div");
  zoom.className = "andv-gate-zoom";
  const portal = makePortal();
  zoom.appendChild(portal);
  gate.append(ink, zoom);
  // See-through inside the water, solid ink under the inner gold band.
  html.style.setProperty("--andv-r0", `${rect.width * WATER}px`);
  html.style.setProperty("--andv-r1", `${rect.width * BAND}px`);
  html.style.setProperty("--andv-big", `${rect.width * ZOOM}px`);
  html.style.setProperty("--andv-small", `${1 / ZOOM}`);
  setCentre(rect);
  document.body.appendChild(gate);
  html.classList.add("andv-gating");
  try {
    // Let the closed portal get its style first, or the iris would open without transition.
    portal.getBoundingClientRect();
    await nextFrame();
    portal.classList.add("andv-open");
    await wait(IRIS_MS);
    html.classList.add("andv-gate-enter");
    await wait(ENTER_MS + 50);
  } finally {
    html.classList.remove("andv-gating", "andv-gate-enter");
    gate.remove();
    busy = false;
  }
}

async function leave(box) {
  busy = true;
  const html = document.documentElement;
  const portal = box.querySelector(".andv-portal");
  portal?.classList.add("andv-open");
  setCentre(box.getBoundingClientRect());
  html.classList.add("andv-leaving");
  try {
    await nextFrame();
    await nextFrame();
    html.classList.add("andv-leave");
    await wait(LEAVE_MS);
    portal?.classList.remove("andv-open");
  } finally {
    html.classList.remove("andv-leaving", "andv-leave");
    busy = false;
  }
}

// Runs in the mutation observer's microtask, before the browser paints the new page.
function check() {
  const lock = !!document.querySelector("bit-lock");
  const vault = !!document.querySelector("popup-tab-navigation");
  const motion = !reducedMotion();

  if (lock) {
    const box = mountHero();
    if (box) {
      rememberHero(box);
      if (!lockShown && vaultShown && motion && !busy) {
        void leave(box);
      }
    }
  } else if (
    vault &&
    !vaultShown &&
    (lockShown || performance.now() - lockLeftAt < 1500) &&
    lastHero &&
    motion &&
    !busy
  ) {
    void enter(lastHero);
  }

  if (lockShown && !lock) {
    lockLeftAt = performance.now();
  }
  lockShown = lock;
  vaultShown = vault;
}

function start() {
  new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", () => {
    const box = heroBox();
    if (box) {
      rememberHero(box);
    }
  });
  check();
}

if (document.body) {
  start();
} else {
  document.addEventListener("DOMContentLoaded", start, { once: true });
}
