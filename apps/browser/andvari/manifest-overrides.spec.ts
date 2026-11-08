/* eslint-disable @typescript-eslint/no-require-imports */
const { extensionIdFromKey } = require("../../../scripts/andvari/extension-id");
const { transform } = require("../webpack/manifest");

const overrides = require("./manifest-overrides.json");

// The ID andvari-host's native messaging manifest allow-lists (FR-TETH-02).
const ANDVARI_EXTENSION_ID = "jgflelfpihgmbkohcljopigcolmlgmle";

describe("Andvari manifest overrides", () => {
  it("pins the Andvari extension ID through the manifest key", () => {
    expect(extensionIdFromKey(overrides.key)).toBe(ANDVARI_EXTENSION_ID);
  });

  it("applies the overrides to the built manifest", () => {
    const template = Buffer.from(JSON.stringify({ name: "__MSG_extName__", manifest_version: 3 }));

    const manifest = JSON.parse(transform("chrome")(template));

    expect(manifest.key).toBe(overrides.key);
    expect(manifest.manifest_version).toBe(3);
  });
});
