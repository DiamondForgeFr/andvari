# Andvari — Specification v0.2

Date: 2026-10-27 · Status: draft

Andvari is a password manager bound to a hardware key: a soft fork of the Bitwarden clients with its own look, plus sessions tied to the key's presence. The SRS (Notion) becomes the reference once the SaaSFoundryAI harness is installed; this file is the founding brief.

## 1. Problem

1. **Looks.** Bitwarden is solid and free, but its interface is unpleasant to use every day.
2. **Sessions outlive their owner.** Web sessions live in browser cookies and storage. They survive as long as the browser keeps them, whether or not the owner is at the computer. A hardware key (YubiKey) proves presence at sign-in, then plays no further part.

## 2. Product

| Part | What it is |
| ---- | ---------- |
| **Password manager** | The Bitwarden browser extension, rebranded and re-themed, talking to a Bitwarden-compatible server (bitwarden.com or a self-hosted Vaultwarden). Vault, sync, encryption and autofill stay Bitwarden's code. |
| **Key tether** | A module of the same extension, plus a small local helper, that makes the key's presence a condition for *using* a protected session (§4). |

## 3. Fork rules

- **GPL variant only.** Nothing from `bitwarden_license/`, never `@bitwarden/commercial-sdk-internal`. Bitwarden's own CI already builds this variant.
- **Complete rebrand.** Name, logo, icons, store links; Bitwarden's trademark guidelines forbid the name and its variants and protect the trade dress.
- **Small diff.** Theme in an added override stylesheet (tokens: `libs/components/src/tw-theme.css`, `tailwind.config.base.js`), "Bitwarden" replaced in the locales at build time rather than in 64 locale files, the tether in added files with a few hooks. Every changed upstream file is ledgered in `UPSTREAM.md`.
- **Every upstream release is merged**, patch releases included: Bitwarden ships security fixes unannounced (see `UPSTREAM.md`).
- **Browser extension first.** The desktop app is not forked in v0: its native-messaging biometric unlock only accepts Bitwarden's official extension IDs, so Andvari has no biometric unlock through it.
- Also themed: the autofill UI injected into pages (`apps/browser/src/autofill/content/components/constants/styles.ts`, its own palette) and the deprecated `popup/scss/variables.scss`.

## 4. Key tether

### Target behaviour

| # | Situation | Result |
|---|---|---|
| B1 | The key is unplugged, then plugged back in before any protected site is used | Nothing happens. Sessions continue. |
| B2 | A protected site is used by a person while the key is absent | The site's session data is wiped, its tabs show "Key absent — session closed". |
| B3 | A protected tab makes background requests while the key is absent | The requests are blocked. Nothing is wiped. |
| B4 | The key comes back after B2 | The user signs in again (with the key, as usual). |
| B5 | A key that is not on the allow-list is plugged in | Treated as absent. |

"Used by a person" means a user action on a protected site:
- a top-level navigation to it (typed URL, link, bookmark, reload, new tab);
- activating one of its tabs (tab switch, window focus);
- a click, key press or form submission in one of its pages.

### Architecture

```
┌──────────────────┐  native messaging  ┌──────────────────────┐
│ Andvari ext.     │◄──────────────────►│ andvari-host         │
│ (tether module)  │  presence events   │ (local process)      │
└──────┬───────────┘                    └──────────┬───────────┘
       │ cookies, storage,                         │ USB hotplug,
       │ request blocking                          │ key identity
       ▼                                           ▼
   Protected sites                              YubiKey(s)
```

**Host (`andvari-host`).**
- Started by the browser through native messaging (`connectNative`), one long-lived port. An open port also keeps the extension's service worker alive.
- Watches USB hotplug (IOKit on macOS, udev on Linux later) for Yubico devices (vendor ID `0x1050`).
- On every change, identifies the connected keys and pushes `{"present": true|false, "serial": ...}` to the extension.
- Language: Go (one code base for macOS and Linux).

**Tether module (in the extension).**
- Holds the presence state pushed by the host, in `chrome.storage.session`, so content scripts read it synchronously.
- **Key absent:**
  - installs a `declarativeNetRequest` dynamic rule that blocks non-navigation requests (`xmlhttprequest`, `websocket`, `ping`…) to protected domains (B3);
  - content scripts on protected pages catch user actions in the capture phase; on the first one they cancel it and ask the background to wipe (B2);
  - `webNavigation.onBeforeNavigate` and `tabs.onActivated` on a protected site trigger the wipe (B2).
- **Wipe:** `chrome.browsingData.remove` with `origins` set to the site's origins: cookies, localStorage, IndexedDB, Cache Storage, service workers. Then every tab of that site is sent to an extension page "Key absent — session closed".
- **Key present:** the blocking rule is removed. Nothing else changes (B1).
- Optional (later): lock the vault when the key is removed.

**Configuration.** In the extension's settings: protected domains, allowed key serials. A domain covers its subdomains (`google.com` → `accounts.google.com`, `mail.google.com`).

### Failure modes

| Case | Behaviour | Why |
|---|---|---|
| Host not installed or crashed | Treated as key absent (fail-closed), with a distinct message: "Andvari helper is not running". | A tool that guards sessions must not silently stop guarding them. |
| Browser started without the key | Same as key absent. | |
| Key removed during a user action in flight | The action may complete; the next one triggers the wipe. | Content scripts cannot undo an action already dispatched. |
| Site keeps auth outside the cleared storage (e.g. a desktop app, another browser) | Not covered. | Documented limitation. |

### Key identity

- **v0, serial number.** Read through the USB descriptors / `ykman list --serials`. Easy, but a malicious USB device could pretend to have the same serial.
- **Later, challenge-response.** Slot 2 of the YubiKey's OTP application is programmed with an HMAC-SHA1 secret (free on both keys; slot 1 keeps Yubico OTP). The host sends a random challenge on plug-in and checks the answer. Option: require a touch for that check, once per plug-in.
- Both keys (main and backup) are on the allow-list.

## 5. Security notes

- The tether adds the permissions `cookies`, `browsingData`, `declarativeNetRequest`, `webNavigation` and `nativeMessaging`; its host permissions cover the protected domains only.
- The host only answers Andvari's extension ID (`allowed_origins` in the native messaging manifest).
- The tether stores no secret in v0. No YubiKey PIN is stored or typed on the user's behalf.
- Andvari complements, and does not replace: macOS smart-card login with "lock on key removal", and the key as sign-in factor on each site.

## 6. Decisions

- **Fork Bitwarden rather than write a password manager (2026-10-27).** The vault is the highest-value target on the machine; encryption is the easy part, autofill the hard one (DOM-based extension clickjacking, DEF CON 33, 2025: 10 of 11 manager extensions vulnerable), and sync, mobile, recovery and audits are projects of their own. Exploration: theme-level reskin ≈ 6–8 files, theme + rebrand ≈ 15–20 files plus ~50 images; ~23 browser releases a year, 1–2 h of merge each.
- **Not a third-party client (Keyguard-style).** A client re-implements the security-critical part (key derivation, decryption, autofill); a soft fork keeps Bitwarden's.

## 7. Open questions

1. **Bitwarden's terms of service** say nothing about third-party or modified clients, but §C.3 forbids "access to the Service without Bitwarden's express written permission". Third-party clients have existed for years without known action. Before a store release: support a self-hosted Vaultwarden server, or ask Bitwarden.
2. Should the wipe also sign out of the site server-side (call its logout URL) when known, so a stolen cookie copy dies too?
3. Name: "Andvari", the Norse dwarf who guarded a hoard and cursed the ring taken from him. Checked on 2026-10-26: an iPhone document scanner ships as Andvari (andvari.app), a few small GitHub repositories and the `andvari` npm package use it, Andvari Capital AS is a Norwegian investment firm; no security product or trademark found in web searches. Check EUIPO and INPI before any public release.
