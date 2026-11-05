import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(path, import.meta.url), "utf8");
const [daw, beatLab, mpc, standalone] = await Promise.all([
  read("../studioDAWApp.js"),
  read("../floor2StudioApp.js"),
  read("../mpc-interface.js"),
  read("../studioStandalone.js")
]);

assert.doesNotMatch(daw, /from\s*["']https:\/\/unpkg\.com\/three@/);
assert.doesNotMatch(daw, /from\s*["']\.\/floor2(?:InstrumentApp|DrumStation)\.js["']/);
assert.doesNotMatch(beatLab, /from\s*["']https:\/\/unpkg\.com\/three@/);
assert.match(beatLab, /await import\(["']https:\/\/unpkg\.com\/three@/);
assert.doesNotMatch(mpc, /from\s*["']\.\/floor2StudioApp\.js["']/);
assert.match(standalone, /Floor2StudioApp\.init\(null,\s*\{\}\)/);
assert.match(standalone, /StudioDAWApp\.open\(["']edit["'],\s*\{\s*standalone:\s*true\s*\}\)/);

console.log("Standalone Studio dependency-boundary checks passed.");
