# Andvari

A password manager bound to your hardware key, part of the DiamondForge suite.

Andvari is a soft fork of the [Bitwarden client applications](https://github.com/bitwarden/clients) with its own look, and one addition: web sessions tied to a hardware security key (YubiKey). Unplug the key and walk away: nothing happens. Plug it back in and carry on. But if someone uses a protected site while the key is gone, that site's session is wiped on the spot.

Andvari is not affiliated with, endorsed by or sponsored by Bitwarden, Inc. "Bitwarden" is a trademark of Bitwarden, Inc.

- Specification: [docs/SPEC.md](docs/SPEC.md)
- How the fork follows Bitwarden, and every file it changes: [UPSTREAM.md](UPSTREAM.md)
- Status: specification; the code is Bitwarden's 2026.10.0 browser release, unchanged.

## License

GPL-3.0, like the upstream code: see [LICENSE.txt](LICENSE.txt) and [LICENSE_GPL.txt](LICENSE_GPL.txt). Andvari builds only the GPL variant: nothing under `bitwarden_license/` (Bitwarden License v1.0) and not the commercial SDK.
