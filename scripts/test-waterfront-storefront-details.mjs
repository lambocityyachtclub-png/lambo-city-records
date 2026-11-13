import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [main, engine, marina, details] = await Promise.all([
  readFile(new URL("../main.js", import.meta.url), "utf8"),
  readFile(new URL("../engine.js", import.meta.url), "utf8"),
  readFile(new URL("../marina.js", import.meta.url), "utf8"),
  readFile(new URL("../waterfrontStorefrontDetails.js", import.meta.url), "utf8")
]);

assert.match(main, /import WaterfrontStorefrontDetails from "\.\/waterfrontStorefrontDetails\.js"/);
assert.match(main, /waterfrontStorefrontDetails:\s*WaterfrontStorefrontDetails/);
assert.match(engine, /this\.systems\.marina\?\.init\?\.\(this\.scene\);[\s\S]*?this\.systems\.waterfrontStorefrontDetails\?\.init\?\.\(this\.scene, this\.context\);/);

for (const [x, label] of [[-20, "CLUB VISTA"], [-32, "STORE"], [-44, "STORE"]]) {
  assert.ok(marina.includes("x: " + x), "Existing storefront at x=" + x + " must remain in marina.js");
  assert.ok(marina.includes('label: "' + label + '"'), "Existing storefront identity must remain intact");
}
assert.match(marina, /const STREET_Z = 46/);
assert.match(marina, /this\._buildStores\(scene\)/);
assert.match(details, /const FRONT_Z = 37\.085/);
assert.match(details, /id: "club-vista",[\s\S]*?x: -20/);
assert.match(details, /id: "music-store",[\s\S]*?x: -32/);
assert.match(details, /id: "producer-store",[\s\S]*?x: -44/);
assert.match(details, /scene\.getObjectByName\("lcWaterfrontStorefrontDetails"\)/);
assert.match(details, /MUSIC • BEATS • RELEASES/);
assert.match(details, /SOUND KITS • PRESETS/);
assert.doesNotMatch(details, /PointLight|SpotLight|DirectionalLight/);
assert.doesNotMatch(details, /collision|player\.position|addEventListener/);

console.log("Waterfront storefront registration, preserved locations, facade details, and lightweight-lighting checks passed.");
