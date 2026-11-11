/* eslint-disable @typescript-eslint/no-require-imports */
import * as fs from "fs";
import * as path from "path";

const webpack = require("webpack");

const { brandPlugins, REPLACEMENTS } = require("./brand-webpack");

const ROOT = path.resolve(__dirname, "../../..");
const BROWSER = path.join(ROOT, "apps/browser");

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exportedNames = (source: string) =>
  [...source.matchAll(/export (?:const|function) (\w+)/g)].map((m) => m[1]).sort();
// Width and height from a PNG's IHDR chunk.
const pngSize = (file: string) => {
  const header = fs.readFileSync(file).subarray(16, 24);
  return [header.readUInt32BE(0), header.readUInt32BE(4)];
};

describe("Andvari brand overlay (FR-BRAND-02)", () => {
  const overlays: Array<[string, string, RegExp]> = [
    ["src/images", "andvari/images", /^icon\d+(_gray|_locked)?\.png$/],
    ["src/popup/images", "andvari/popup-images", /^logo-.*\.png$/],
  ];

  it.each(overlays)(
    "overlays every Bitwarden icon of %s, at the same size",
    (upstream, overlay, name) => {
      const icons = fs.readdirSync(path.join(BROWSER, upstream)).filter((f) => name.test(f));
      expect(icons.length).toBeGreaterThan(0);

      for (const icon of icons) {
        const andvari = path.join(BROWSER, overlay, icon);
        expect(fs.existsSync(andvari)).toBe(true);
        if (upstream === "src/images") {
          expect(pngSize(andvari)).toEqual(pngSize(path.join(BROWSER, upstream, icon)));
        }
      }
    },
  );

  it("replaces the logo, icon tile and shields with modules exporting the same names", () => {
    const logos = [
      "libs/assets/src/svg/svgs/bitwarden-logo.icon.ts",
      "libs/assets/src/svg/svgs/bitwarden-logo-beta.icon.ts",
      "libs/assets/src/svg/svgs/bitwarden-icon.ts",
    ].flatMap((f) => exportedNames(read(f)));
    expect(exportedNames(read("apps/browser/andvari/assets/andvari-logo.icon.js"))).toEqual(
      expect.arrayContaining(logos),
    );

    // Own logo icons plus copies of upstream's other icons: an upstream change to them
    // means regenerating (scripts/andvari/brand/generate.js).
    const icons = (source: string) =>
      Object.fromEntries(
        [...source.matchAll(/export const (\w+) =\s*'([^']*)'/g)].map((m) => [m[1], m[2]]),
      );
    const andvari = icons(read("apps/browser/andvari/assets/autofill-svg-icons.js"));
    const upstream = icons(read("apps/browser/src/autofill/utils/svg-icons.ts"));
    expect(Object.keys(andvari).sort()).toEqual(Object.keys(upstream).sort());
    for (const name of Object.keys(upstream)) {
      if (name === "logoIcon" || name === "logoLockedIcon") {
        expect(andvari[name]).not.toBe(upstream[name]);
      } else {
        expect(andvari[name]).toBe(upstream[name]);
      }
    }

    expect(exportedNames(read("apps/browser/andvari/assets/autofill-shield.js"))).toEqual(
      exportedNames(read("apps/browser/src/autofill/content/components/icons/shield.ts")),
    );
  });

  it("keeps the generated logo free of interpolation, which the svg tag rejects", () => {
    const logo = read("apps/browser/andvari/assets/andvari-logo.icon.js");
    expect(logo).not.toContain("${");
    expect(logo).not.toContain("Bitwarden</title>");
  });

  describe("module replacement", () => {
    const replacements = brandPlugins(webpack).filter(
      (p: unknown) => p instanceof webpack.NormalModuleReplacementPlugin,
    );
    const resolve = (request: string, fromFile: string) => {
      const resource = { request, context: path.dirname(path.join(ROOT, fromFile)) };
      for (const plugin of replacements) {
        if (plugin.resourceRegExp.test(resource.request)) {
          plugin.newResource(resource);
        }
      }
      return resource.request;
    };

    it("finds the upstream imports it targets", () => {
      expect(read("libs/assets/src/svg/svgs/index.ts")).toContain('"./bitwarden-logo.icon"');
      expect(
        read(
          "apps/browser/src/autofill/overlay/inline-menu/pages/button/autofill-inline-menu-button.ts",
        ),
      ).toContain('"../../../../utils/svg-icons"');
      expect(
        read("apps/browser/src/autofill/content/components/icons/brand-icon-container.ts"),
      ).toContain('"./shield"');
    });

    it.each([
      ["./bitwarden-logo.icon", "libs/assets/src/svg/svgs/index.ts", "andvari-logo.icon.js"],
      ["./bitwarden-logo-beta.icon", "libs/assets/src/svg/svgs/index.ts", "andvari-logo.icon.js"],
      ["./bitwarden-icon", "libs/assets/src/svg/svgs/index.ts", "andvari-logo.icon.js"],
      [
        "../../../../utils/svg-icons",
        "apps/browser/src/autofill/overlay/inline-menu/pages/button/autofill-inline-menu-button.ts",
        "autofill-svg-icons.js",
      ],
      [
        "./shield",
        "apps/browser/src/autofill/content/components/icons/brand-icon-container.ts",
        "autofill-shield.js",
      ],
    ])("sends %s from %s to %s", (request, fromFile, target) => {
      expect(resolve(request, fromFile)).toBe(path.join(BROWSER, "andvari/assets", target));
    });

    it("leaves look-alike requests elsewhere alone, and its own re-export of upstream icons", () => {
      expect(resolve("./shield", "libs/components/src/icon/index.ts")).toBe("./shield");
      expect(
        resolve("../../src/autofill/utils/svg-icons.ts", "apps/browser/andvari/assets/x.js"),
      ).toBe("../../src/autofill/utils/svg-icons.ts");
    });

    it("declares one replacement per upstream brand module", () => {
      expect(REPLACEMENTS).toHaveLength(3);
    });
  });
});
