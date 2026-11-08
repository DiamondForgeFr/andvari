#!/usr/bin/env node
/* eslint-disable no-console, @typescript-eslint/no-require-imports */
// Computes the Chrome extension ID that a manifest `key` pins.
// Chrome derives the ID from the SHA-256 of the DER public key: the first 32 hex
// digits, each mapped from 0-f to a-p.
//
// Usage: node scripts/andvari/extension-id.js [path/to/manifest-overrides.json]
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_OVERRIDES = path.join(
  __dirname,
  "..",
  "..",
  "apps",
  "browser",
  "andvari",
  "manifest-overrides.json",
);

function extensionIdFromKey(base64Key) {
  const der = Buffer.from(base64Key, "base64");
  const hex = crypto.createHash("sha256").update(der).digest("hex").slice(0, 32);
  return [...hex].map((digit) => String.fromCharCode(97 + parseInt(digit, 16))).join("");
}

module.exports = { extensionIdFromKey };

if (require.main === module) {
  const file = process.argv[2] ?? DEFAULT_OVERRIDES;
  const { key } = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!key) {
    console.error(`No "key" in ${file}`);
    process.exit(1);
  }
  console.log(extensionIdFromKey(key));
}
