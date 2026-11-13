import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [camera, marina, elevator] = await Promise.all([
  readFile(new URL("../camera.js", import.meta.url), "utf8"),
  readFile(new URL("../marina.js", import.meta.url), "utf8"),
  readFile(new URL("../recordsHQElevator.js", import.meta.url), "utf8")
]);

assert.match(elevator, /import \{ createPhoneFloorNavigator \} from "\.\/floor2PhoneNavigation\.js"/,
  "The elevator must import the phone-navigation controller it registers.");
assert.match(marina, /\[-1, 1\]\.forEach\(side => \{/,
  "Marina sidewalk construction must preserve the district root binding.");
assert.match(marina, /stores\.forEach\(s => \{/,
  "Marina store construction must preserve the district root binding.");
assert.match(marina, /postPositions\.forEach\(t => \{/,
  "Marina waterfront posts must preserve the district root binding.");
assert.match(marina, /_buildWaterfrontGlass\(scene\) \{[\s\S]*?const root = this\._root;/,
  "The nested waterfront builder must capture the district root before creating helper callbacks.");
assert.match(marina, /function addGlassSection\([\s\S]*?root\.add\(base\)[\s\S]*?root\.add\(post\)/,
  "Nested waterfront geometry must add to the captured root, not rely on callback this.");
assert.doesNotMatch(marina, /function addGlassSection\([\s\S]*?this\._root\.add/,
  "Nested waterfront callbacks must never dereference an unbound this.");
assert.match(marina, /\[-1, 1\]\.forEach\(side => \{[\s\S]*?this\._root\.add\(sidewalk\)/,
  "The sidewalk callback must retain the district root binding.");
assert.match(marina, /stores\.forEach\(s => \{[\s\S]*?this\._root\.add\(building\)/,
  "The store callback must retain the district root binding.");
assert.match(marina, /postPositions\.forEach\(t => \{[\s\S]*?root\.add\(post\)/,
  "The waterfront post callback must use its captured district root.");
assert.match(camera, /let removeOrbitControls = null/,
  "Camera event cleanup must be stored in module scope.");
assert.match(camera, /removeOrbitControls = \(\) => \{/,
  "Camera orbit controls must install a callable cleanup function.");
assert.doesNotMatch(camera, /this\._removeOrbitControls/,
  "Camera update must not write to an undefined callback this.");

console.log("PASS: world startup wiring and module callback regressions");

assert.match(main, /import Scene, \{ THREE \} from "\.\/scene\.js"/,
  "The scene module must provide the shared core Three.js namespace.");
assert.match(main, /engine\.context\.THREE = THREE/,
  "Streamed floor modules must receive the live core Three.js namespace.");
assert.match(scene, /export \{ THREE \}/,
  "The core scene module must expose the shared Three.js namespace.");
