import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../heroSecurityExperience.js", import.meta.url), "utf8");
assert.match(source, /root\.scale\.setScalar\(2\.1\)/,
  "Security escorts must be taller and broader than HERO's normalized four-unit model");
assert.match(source, /heroSecurityEscort/,
  "Both security escorts must retain their existing identities");
assert.match(source, /GUARD_OFFSETS/,
  "Escort spacing must remain owned by the existing guard offsets");
console.log("HERO security scale checks passed.");
