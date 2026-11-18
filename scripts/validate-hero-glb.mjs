#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateHeroGlb } from "../development/engine/heroGlbAcceptance.js";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/validate-hero-glb.mjs <path-to-HERO.glb>");
  process.exitCode = 2;
} else {
  try {
    const bytes = await readFile(resolve(inputPath));
    const issues = validateHeroGlb(bytes);
    if (issues.length) {
      console.error("HERO GLB acceptance failed:");
      for (const issue of issues) console.error("- [" + issue.code + "] " + issue.message);
      process.exitCode = 1;
    } else {
      console.log("HERO GLB metadata/container acceptance passed.");
      console.log("A renderer-based bounds check, visual comparison, animation review, and iPad performance test are still required.");
    }
  } catch (error) {
    console.error("Could not read HERO GLB:", error.message);
    process.exitCode = 2;
  }
}
