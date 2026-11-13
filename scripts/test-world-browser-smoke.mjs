import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE_URL = process.env.LAMBO_CITY_TEST_URL || "http://127.0.0.1:4173";
const phoneSource = await readFile(new URL("../input.js", import.meta.url), "utf8");
assert.match(phoneSource, /const startNavigation = \(\) => \{[\s\S]*?window\.setTimeout\(startNavigation, 1000\)/,
  "Studio phone navigation must wait until the activating click/tap has been acknowledged.");
assert.match(phoneSource, /window\.requestAnimationFrame\(startNavigation\)/,
  "The phone navigation fallback must remain available when timers are unavailable.");
assert.match(phoneSource, /if \(typeof navigate !== "function" \|\| !navigate\(floor\)\) return;\s*closePhone\(\);/,
  "The phone closes only after the elevator accepts the requested destination.");
assert.doesNotMatch(phoneSource, /const navigateFromPhone = floor => \{\s*const navigate = window\.__lamboCityNavigateToFloor;\s*if \(typeof navigate !== "function" \|\| !navigate\(floor\)\) return;\s*phone\.remove\(\);/,
  "Studio phone navigation must not synchronously navigate and remove its own click target.");

const browser = await chromium.launch({
  headless: true,
  args: [
    "--enable-webgl",
    "--use-gl=swiftshader",
    "--ignore-gpu-blocklist",
    "--disable-gpu-sandbox"
  ]
});

async function smokeWorld({ label, isMobile }) {
  const context = await browser.newContext({
    viewport: isMobile ? { width: 1024, height: 1366 } : { width: 1440, height: 900 },
    deviceScaleFactor: isMobile ? 2 : 1,
    isMobile,
    hasTouch: isMobile
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedScriptRequests = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", request => {
    if (request.resourceType() === "script") {
      failedScriptRequests.push(request.url() + ": " + request.failure()?.errorText);
    }
  });
  page.setDefaultTimeout(30000);

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const canvas = document.querySelector("canvas");
      const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
      return !!canvas && !!gl &&
        !!document.getElementById("lambo-city-joystick") &&
        !!document.getElementById("lambo-city-mobile-buttons") &&
        !!window.__lamboCityPlayerSystem &&
        typeof window.__lamboCityNavigateToFloor === "function";
    }, null, { timeout: 30000 }).catch(error => {
      throw new Error(label + ": startup did not finish. " + error.message +
        "\nPage errors: " + pageErrors.join("\n") +
        "\nConsole errors: " + consoleErrors.join("\n") +
        "\nFailed script requests: " + failedScriptRequests.join("\n"));
    });

    console.log("PASS: " + label + " renderer, player, joystick, and phone route initialized");

    const startup = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
      return {
        canvasWidth: canvas?.width || 0,
        canvasHeight: canvas?.height || 0,
        webgl: !!gl,
        joystick: !!document.getElementById("lambo-city-joystick"),
        mobileButtons: !!document.getElementById("lambo-city-mobile-buttons"),
        studioNotLoadedBeforeRequest:
          typeof window.__lamboCityEnterFloor2CockpitDirect === "undefined",
        startupErrors: window.__lamboCityStartupErrors || [],
        worldSystemHostAvailable:
          typeof window.__lamboCityWorldSystem?.initialize === "function",
        worldSystemInitialized:
          window.__lamboCityWorldSystem?.isReady?.() === true
      };
    });

    assert.ok(startup.canvasWidth > 0 && startup.canvasHeight > 0,
      label + ": renderer canvas must have a real drawing size");
    assert.equal(startup.webgl, true, label + ": WebGL renderer must initialize");
    assert.equal(startup.joystick, true, label + ": joystick must initialize at startup");
    assert.equal(startup.mobileButtons, true, label + ": mobile action buttons must initialize");
    assert.equal(startup.studioNotLoadedBeforeRequest, true,
      label + ": Floor 2 must remain lazy-loaded before the player requests Studio");
    assert.deepEqual(startup.startupErrors, [],
      label + ": no feature initialization failures may be hidden by startup isolation");
    assert.equal(startup.worldSystemHostAvailable, true,
      label + ": the shared World System host must be available to owner-controlled tooling");
    assert.equal(startup.worldSystemInitialized, false,
      label + ": the World System must remain lazy and must not load heavy district systems at startup");
    assert.deepEqual(pageErrors, [], label + ": no uncaught startup errors");

    const worldSystem = await page.evaluate(async () => {
      if (!window.__lamboCityWorldSystemReady) {
        return { available: false, status: null, error: "World System promise was not registered" };
      }
      const status = await Promise.race([
        window.__lamboCityWorldSystemReady,
        new Promise(resolve => setTimeout(() => resolve(null), 15000))
      ]);
      return {
        available: status !== null,
        status,
        error: window.__lamboCityWorldSystemError || null
      };
    });
    assert.equal(worldSystem.available, true, label + ": World System must initialize");
    assert.equal(worldSystem.error, null, label + ": World System must not report an initialization error");
    assert.equal(worldSystem.status?.ready, true, label + ": World System runtime must be ready");
    assert.ok(worldSystem.status?.registeredDistrictIds?.length > 0,
      label + ": the Conference Center district blueprint must be registered");
    console.log("PASS: " + label + " World System and Conference Center blueprint initialized");

    // Open the citizen phone using the same F control exposed to players.
    if (isMobile) {
      await page.locator("#lambo-city-mobile-buttons button").nth(1).tap();
    } else {
      await page.keyboard.press("f");
    }
    await page.waitForSelector("#phone-ui");
    // The click handler defers navigation so the pointer action can complete first.
    try {
      if (isMobile) {
        await page.locator("#lambo-phone-studio").tap({ timeout: 10000 });
      } else {
        await page.locator("#lambo-phone-studio").click({ timeout: 10000 });
      }
    } catch (error) {
      const diagnostics = await Promise.race([
        page.evaluate(() => ({
          requested: window.__lamboCityPhoneNavigationRequested || null,
          started: window.__lamboCityPhoneNavigationStarted === true,
          mode: window.__lamboCityFloor2SessionMode || null,
          loadError: window.__lamboCityFloor2LoadError || null,
          startupErrors: window.__lamboCityStartupErrors || []
        })),
        new Promise(resolve => setTimeout(() => resolve({ pageUnresponsive: true }), 3000))
      ]);
      throw new Error("Studio phone activation failed: " + JSON.stringify(diagnostics) + " · " + error.message);
    }
    await page.waitForSelector("#phone-ui", { state: "detached" });

    // First visit must load Floor 2, complete the elevator arrival, and seat
    // the player before the session's direct-entry hook is considered ready.
    await page.waitForFunction(() =>
      window.__lamboCityFloor2SessionMode === "seated" ||
      !!window.__lamboCityFloor2LoadError
    , null, { timeout: 45000 }).catch(async error => {
      const state = await page.evaluate(() => ({
        phoneOpen: !!document.getElementById("phone-ui"),
        floor2Ready: window.__lamboCityFloor2Ready === true,
        floor2Mode: window.__lamboCityFloor2SessionMode || null,
        floor2LoadError: window.__lamboCityFloor2LoadError || null,
        discovered: window.__lamboCityFloor2Discovered === true,
        elevatorTraveling: window.__lamboCityElevatorTraveling === true,
        elevatorInRange: window.__lamboCityElevatorInRange === true,
        elevatorOpen: window.__lamboCityElevatorOpen === true,
        elevatorProgress: window.__lamboCityElevatorProgress ?? null,
        queuedDestination: window.__lamboCityNavigateToFloor?.getQueuedDestination?.() ?? null,
        startupErrors: window.__lamboCityStartupErrors || []
      }));
      throw new Error(label + ": Floor 2 phone request did not complete. " +
        JSON.stringify(state) + "\\n" + error.message);
    });
    const floor2Status = await page.evaluate(() => ({
      ready: window.__lamboCityFloor2Ready === true,
      mode: window.__lamboCityFloor2SessionMode || null,
      discovered: window.__lamboCityFloor2Discovered === true,
      directEntry: typeof window.__lamboCityEnterFloor2CockpitDirect,
      loadError: window.__lamboCityFloor2LoadError || null,
      startupErrors: window.__lamboCityStartupErrors || []
    }));
    assert.equal(floor2Status.loadError, null,
      label + ": Floor 2 loader error: " + String(floor2Status.loadError));
    assert.equal(floor2Status.ready, true, label + ": Floor 2 modules must finish loading");
    assert.equal(floor2Status.mode, "seated", label + ": first visit must complete the elevator-to-cockpit arrival");
    assert.equal(floor2Status.discovered, true, label + ": first visit must persist Floor 2 discovery");
    assert.equal(floor2Status.directEntry, "function", label + ": the return shortcut must be registered");
    assert.deepEqual(floor2Status.startupErrors, [],
      label + ": no isolated system initialization/update failures are allowed");
    console.log("PASS: " + label + " first-time Floor 2 load and elevator arrival completed");

    // End the session without clearing discovery, then use the phone again.
    // This exercises the returning-visitor direct cockpit shortcut.
    await page.evaluate(() => window.__lamboCityEndFloor2Session?.());
    await page.waitForFunction(() => window.__lamboCityFloor2SessionMode === "free");

    if (isMobile) {
      await page.locator("#lambo-city-mobile-buttons button").nth(1).tap();
    } else {
      await page.keyboard.press("f");
    }
    await page.waitForSelector("#phone-ui");
    // The click handler closes the phone on the next animation frame.
    try {
      if (isMobile) {
        await page.locator("#lambo-phone-studio").tap({ timeout: 10000 });
      } else {
        await page.locator("#lambo-phone-studio").click({ timeout: 10000 });
      }
    } catch (error) {
      const diagnostics = await Promise.race([
        page.evaluate(() => ({
          requested: window.__lamboCityPhoneNavigationRequested || null,
          started: window.__lamboCityPhoneNavigationStarted === true,
          mode: window.__lamboCityFloor2SessionMode || null,
          loadError: window.__lamboCityFloor2LoadError || null,
          startupErrors: window.__lamboCityStartupErrors || []
        })),
        new Promise(resolve => setTimeout(() => resolve({ pageUnresponsive: true }), 3000))
      ]);
      throw new Error("Studio phone activation failed: " + JSON.stringify(diagnostics) + " · " + error.message);
    }
    await page.waitForSelector("#phone-ui", { state: "detached" });
    await page.waitForFunction(() =>
      window.__lamboCityFloor2SessionMode === "seated"
    , null, { timeout: 10000 });

    assert.deepEqual(pageErrors, [], label + ": no uncaught errors during Studio navigation");
    assert.deepEqual(failedScriptRequests, [], label + ": no failed JavaScript module requests");
    console.log("PASS: " + label + " world startup, touch/phone controls, first Studio visit, and returning shortcut");
  } finally {
    await context.close();
  }
}

try {
  await smokeWorld({ label: "Desktop Chromium", isMobile: false });
  await smokeWorld({ label: "iPad-sized touch Chromium", isMobile: true });
} finally {
  await browser.close();
}
