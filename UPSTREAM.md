# Upstream

Andvari is a soft fork of [bitwarden/clients](https://github.com/bitwarden/clients). This file says how the fork follows it and lists every upstream file Andvari changes.

## Remotes

- `origin` is Andvari (DiamondForgeFr/andvari).
- `upstream` is Bitwarden, fetch-only (`pushurl` is `DISABLED`), without tags, and blobless (`partialclonefilter blob:none`): file contents are fetched when a merge needs them.

## Merged releases

| Bitwarden release    | Date       | Merged in                        |
| -------------------- | ---------- | -------------------------------- |
| `browser-v2026.10.0` | 2026-10-15 | initial import (2026-10-27)      |

## Following Bitwarden

- **Take every browser release, patch releases included.** Bitwarden publishes no GitHub security advisories for this repository: vulnerabilities go through HackerOne and their fixes ship unannounced inside ordinary releases. A skipped release can be a skipped security fix.
- Until MoltenTerm watches upstreams (DiamondForgeFr/moltenterm#1174), watch `bitwarden/clients` on GitHub (Watch → Custom → Releases).
- Merge a release tag, never upstream `main`:

  ```bash
  git fetch upstream "refs/tags/browser-vX.Y.Z:refs/tags/browser-vX.Y.Z"
  git merge browser-vX.Y.Z
  ```

## Changing upstream files

Keep the diff small, so each merge stays cheap:

- Prefer **adding** files (an override stylesheet, a build-time substitution, a new module) over editing Bitwarden's.
- When an upstream file has to change, mark the change with `ANDVARI-PATCH #<ticket>` in a comment next to it and add the file to the ledger below.

## Ledger

| Upstream file | Ticket | Why |
| ------------- | ------ | --- |
| `README.md`   | —      | Presents Andvari instead of Bitwarden. |
