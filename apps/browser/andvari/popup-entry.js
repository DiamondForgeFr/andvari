// Replaces the popup's `import "./scss"` (src/popup/main.ts) in the build (brand-webpack.js):
// loads upstream's styles unchanged, then Andvari's portal on the lock screen and its unlock
// transition (#20).
import "../src/popup/scss";
import "./portal/portal-transition";
