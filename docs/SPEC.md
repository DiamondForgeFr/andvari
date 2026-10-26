# Andvari — Specification v0.1

Date: 2026-10-26 · Status: draft

## 1. Problem

Web sessions live in browser cookies and storage. They survive as long as the browser keeps them, whether or not the owner is at the computer. A hardware key (YubiKey) proves presence at sign-in, then plays no further part.

Andvari makes the key's presence a condition for *using* a protected session, without forcing a new sign-in every time the key is unplugged.

## 2. Target behaviour

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

## 3. Scope

### v0 (prototype)
- macOS, Google Chrome (Chromium-based browsers should follow for free).
- Allow-list of keys by serial number.
- Protected sites configured by the user (domains, e.g. `github.com`, `google.com`).
- B1–B5.

### Later
- Linux.
- Firefox.
- Strong key check: challenge-response (HMAC-SHA1, slot 2) instead of the serial number (see §6).
- Optional actions on removal: lock the screen, lock the password manager.

### Non-goals
- Not a password manager. Credentials stay in an existing, audited manager (see §8).
- No stored YubiKey PIN, no PIN typed on the user's behalf.
- No server, no account, no telemetry.

## 4. Architecture

```
┌──────────────┐  native messaging  ┌──────────────────────┐
│ Chrome ext.  │◄──────────────────►│ andvari-host       │
│ (MV3)        │  presence events   │ (local process)      │
└──────┬───────┘                    └──────────┬───────────┘
       │ cookies, storage,                     │ USB hotplug,
       │ request blocking                      │ key identity
       ▼                                       ▼
   Protected sites                          YubiKey(s)
```

### 4.1 Host (`andvari-host`)
- Started by Chrome through native messaging (`connectNative`), one long-lived port. An open port also keeps the extension's service worker alive.
- Watches USB hotplug (IOKit on macOS, udev on Linux later) for Yubico devices (vendor ID `0x1050`).
- On every change, identifies the connected keys and pushes `{"present": true|false, "serial": ...}` to the extension.
- Language: Go (one code base for macOS and Linux, matches the other DiamondForge projects).

### 4.2 Extension
- Holds the presence state pushed by the host, in `chrome.storage.session`, so content scripts read it synchronously.
- **Key absent:**
  - installs a `declarativeNetRequest` dynamic rule that blocks non-navigation requests (`xmlhttprequest`, `websocket`, `ping`…) to protected domains (B3);
  - content scripts on protected pages catch user actions in the capture phase; on the first one they cancel it and ask the background to wipe (B2);
  - `webNavigation.onBeforeNavigate` and `tabs.onActivated` on a protected site trigger the wipe (B2).
- **Wipe:** `chrome.browsingData.remove` with `origins` set to the site's origins: cookies, localStorage, IndexedDB, Cache Storage, service workers. Then every tab of that site is sent to an extension page "Key absent — session closed".
- **Key present:** the blocking rule is removed. Nothing else changes (B1).

### 4.3 Configuration
- Edited in the extension's options page: protected domains, allowed key serials.
- A domain covers its subdomains (`google.com` → `accounts.google.com`, `mail.google.com`).

## 5. Failure modes

| Case | Behaviour | Why |
|---|---|---|
| Host not installed or crashed | Treated as key absent (fail-closed), with a distinct message: "Andvari helper is not running". | A tool that guards sessions must not silently stop guarding them. |
| Browser started without the key | Same as key absent. | |
| Key removed during a user action in flight | The action may complete; the next one triggers the wipe. | Content scripts cannot undo an action already dispatched. |
| Site keeps auth outside the cleared storage (e.g. a desktop app, another browser) | Not covered. | Documented limitation. |

## 6. Key identity

- **v0, serial number.** Read through the USB descriptors / `ykman list --serials`. Easy, but a malicious USB device could pretend to have the same serial.
- **Later, challenge-response.** Slot 2 of the YubiKey's OTP application is programmed with an HMAC-SHA1 secret (free on both keys; slot 1 keeps Yubico OTP). The host sends a random challenge on plug-in and checks the answer. Option: require a touch for that check, once per plug-in.
- Both keys (main and backup) are on the allow-list.

## 7. Security notes

- The extension needs `cookies`, `browsingData`, `declarativeNetRequest`, `webNavigation`, `tabs`, `nativeMessaging`, `storage` and host permissions on the protected domains only, never `<all_urls>`.
- The host only answers its own extension ID (`allowed_origins` in the native messaging manifest).
- No secret is stored by Andvari in v0.
- Andvari complements, and does not replace: macOS smart-card login with "lock on key removal", and the key as sign-in factor on each site.

## 8. Password manager (decision record)

Question: build our own YubiKey-bound password manager?

Decision: **no, use an existing one.** Andvari may later lock it on key removal.

Reasons:
- The vault is the highest-value target on the machine. Encryption itself is the easy part; autofill is the hard part: the DOM-based clickjacking attacks shown at DEF CON 33 (2025) hit 10 of 11 tested manager extensions, audited ones included.
- Sync across devices, mobile apps, recovery when a key is lost, and independent audits are each a project of their own.

Candidates (free, YubiKey/FIDO2 as second factor):
- **Proton Pass**: free plan with unlimited logins and devices, passkeys; cleaner UI than Bitwarden; the Proton account accepts FIDO2 security keys.
- **Bitwarden**: FIDO2 two-step login free on all plans (up to 5 keys).
- **KeePassXC**: free and open source, local file, YubiKey challenge-response unlock; dated UI.
- **Apple Passwords**: free, native, good UI; Apple ecosystem only (and Chrome on Windows through iCloud).

Possible later middle ground: a better-looking client on an existing audited format/back end (KDBX file, or a Bitwarden-compatible server). Same autofill risk, so only if a real need remains.

## 9. Open questions

1. Name: "Andvari", the Norse dwarf who guarded a hoard and cursed the ring taken from him (a session taken without the key is worthless to its taker). Checked on 2026-10-26: an iPhone document scanner ships as Andvari (andvari.app), a few small GitHub repositories and the `andvari` npm package use it, Andvari Capital AS is a Norwegian investment firm; no security product or trademark found in web searches. Check EUIPO and INPI before any public release.
2. Repository: personal account or DiamondForgeFr; public or private.
3. Should the wipe also sign out of the site server-side (call its logout URL) when known, so a stolen cookie copy dies too?
