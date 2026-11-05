import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, beatLab, edit] = await Promise.all([
  readFile(new URL("../studioDAWApp.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioApp.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWEditScreen.js", import.meta.url), "utf8")
]);

assert.match(app, /One shared Spacebar transport for every Studio workspace/);
assert.match(app, /event\.code !== "Space"/);
assert.match(app, /multitrack\.playAll\(\)/);
assert.match(app, /multitrack\.stopAll\(\)/);
assert.match(app, /beatLab\.start\(\)/);
assert.match(app, /beatLab\.stop\(\)/);
assert.match(app, /document\.removeEventListener\("keydown", this\.handleStudioKeydown\)/);

assert.doesNotMatch(beatLab, /if \(event\.code === "Space"\)/);
assert.doesNotMatch(edit, /key === "spacebar"/);
assert.doesNotMatch(edit, /key === " "/);

console.log("Shared Studio Spacebar transport checks passed.");
