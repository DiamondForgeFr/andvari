# Andvari

A password manager bound to your hardware key, part of the DiamondForge suite.

Andvari is a soft fork of the [Bitwarden client applications](https://github.com/bitwarden/clients) with its own look, and one addition: web sessions tied to a hardware security key (YubiKey). Unplug the key and walk away: nothing happens. Plug it back in and carry on. But if someone uses a protected site while the key is gone, that site's session is wiped on the spot.

Andvari is not affiliated with, endorsed by or sponsored by Bitwarden, Inc. "Bitwarden" is a trademark of Bitwarden, Inc.

- Specification: [docs/SPEC.md](docs/SPEC.md)
- How the fork follows Bitwarden, and every file it changes: [UPSTREAM.md](UPSTREAM.md)
- Status: v0 in progress (milestone v0.1.0); the code is Bitwarden's 2026.10.0 browser release.

## Build and install (Chrome and other Chromium browsers)

Requirements: Node 24 (`.nvmrc`), then `npm ci` at the repository root.

```bash
scripts/andvari/build-chrome.sh
```

The script builds the GPL variant, fails if the output contains commercial code, and produces:

- `apps/browser/build/`: load it with `chrome://extensions` → Developer mode → **Load unpacked**;
- `dist/andvari-chrome-<version>.zip`.

The extension ID is always `jgflelfpihgmbkohcljopigcolmlgmle`: the manifest carries a fixed public key (`apps/browser/andvari/manifest-overrides.json`). The matching private key is kept outside the repository; it is only needed to pack a CRX or publish to a store.

Andvari signs in to a Bitwarden-compatible server: your existing bitwarden.com account by default, or a self-hosted server (Vaultwarden, Bitwarden) chosen on the login screen ("Accessing" → self-hosted).

## License

GPL-3.0, like the upstream code: see [LICENSE.txt](LICENSE.txt) and [LICENSE_GPL.txt](LICENSE_GPL.txt). Andvari builds only the GPL variant: nothing under `bitwarden_license/` (Bitwarden License v1.0) and not the commercial SDK.
