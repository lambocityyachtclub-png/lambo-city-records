import test from "node:test";
import assert from "node:assert/strict";
import { selectDevelopmentMemories } from "../../alive/server/personalServices.js";

test("ALIVE development context includes only memories explicitly shared by the owner", () => {
  const selected = selectDevelopmentMemories([
    { category: "preference", content: "Keep approved world geometry fixed.", privacy: { shareWithDevelopment: true }, tags: ["world"] },
    { category: "secret", content: "Do not share this private note.", privacy: { shareWithDevelopment: false } },
    { category: "note", content: "Missing privacy must remain private." }
  ]);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].content, "Keep approved world geometry fixed.");
  assert.deepEqual(selected[0].tags, ["world"]);
});

test("ALIVE development memory context is bounded by count, content length, and tag count", () => {
  const memories = Array.from({ length: 25 }, (_, index) => ({
    category: "project",
    content: "x".repeat(2500),
    tags: Array.from({ length: 20 }, (_, tag) => "tag-" + tag),
    privacy: { shareWithDevelopment: true }
  }));
  const selected = selectDevelopmentMemories(memories);
  assert.equal(selected.length, 20);
  assert.equal(selected[0].content.length, 2000);
  assert.equal(selected[0].tags.length, 12);
});
