import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE_URL = process.env.LAMBO_CITY_TEST_URL || "http://127.0.0.1:4173";
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
          typeof window.__lamboCityEnterFloor2CockpitDirect === "undefined"
      };
    });

    assert.ok(startup.canvasWidth > 0 && startup.canvasHeight > 0,
      label + ": renderer canvas must have a real drawing size");
    assert.equal(startup.webgl, true, label + ": WebGL renderer must initialize");
    assert.equal(startup.joystick, true, label + ": joystick must initialize at startup");
    assert.equal(startup.mobileButtons, true, label + ": mobile action buttons must initialize");
    assert.equal(startup.studioNotLoadedBeforeRequest, true,
      label + ": Floor 2 must remain lazy-loaded before the player requests Studio");
    assert.deepEqual(pageErrors, [], label + ": no uncaught startup errors");

    // Open the citizen phone using the same F control exposed to players.
    if (isMobile) {
      await page.locator("#lambo-city-mobile-buttons button").nth(1).tap();
    } else {
      await page.keyboard.press("f");
    }
    await page.waitForSelector("#phone-ui");
    if (isMobile) {
      await page.locator("#lambo-phone-studio").tap();
    } else {
      await page.locator("#lambo-phone-studio").click();
    }

    // First visit must load Floor 2, complete the elevator arrival, and seat
    // the player before the session's direct-entry hook is considered ready.
    await page.waitForFunction(() =>
      window.__lamboCityFloor2SessionMode === "seated" &&
      window.__lamboCityFloor2Discovered === true &&
      typeof window.__lamboCityEnterFloor2CockpitDirect === "function"
    , null, { timeout: 45000 });
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
    if (isMobile) {
      await page.locator("#lambo-phone-studio").tap();
    } else {
      await page.locator("#lambo-phone-studio").click();
    }
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
