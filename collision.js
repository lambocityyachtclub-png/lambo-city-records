// collision.js
// LAMBO CITY — Player Collision
//
// IMPORTANT:
// - Keep the public waterfront promenade WALKABLE.
// - Keep the dock → Grand Stage connector WALKABLE.
// - No giant circular movement blocker.
// - Visual waterfront glass borders do NOT control player movement.
// - Only solid structures should block HERO.

const colliders = [];

function addBox(name, x, z, width, depth) {
  colliders.push({
    name,
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2
  });
}

export function init(scene) {
  colliders.length = 0;

  // ============================================================
  // GRAND STAGE
  // ============================================================

  // Main stage platform
  addBox(
    "stagePlatform",
    0,
    -74,
    34,
    18
  );

  // Backstage restricted area
  addBox(
    "stageBackstage",
    0,
    -88,
    40,
    10
  );

  // Stage back wall
  addBox(
    "stageBackWall",
    0,
    -83.5,
    34,
    1.2
  );

  // ============================================================
  // LAMBO CITY RECORDS HQ
  // ============================================================

  addBox(
    "recordsHQ",
    28,
    22,
    18,
    14
  );

  // ============================================================
  // BOARDWALK STORES
  // ============================================================

  addBox(
    "storeWest",
    -20,
    31,
    10,
    12
  );

  addBox(
    "storeCenter",
    -32,
    31,
    10,
    12
  );

  addBox(
    "storeEast",
    -44,
    31,
    10,
    12
  );

  // ============================================================
  // WATERFRONT VIP ESTATES
  // ============================================================
  //
  // These block only the actual estate structures.
  // The promenade itself remains open.

  addBox(
    "estateWest",
    -16,
    -50,
    9,
    7
  );

  addBox(
    "estateCenterWest",
    -16,
    -35,
    9,
    7
  );

  addBox(
    "estateCenter",
    -16,
    -20,
    9,
    7
  );

  addBox(
    "estateEast",
    -16,
    -5,
    9,
    7
  );

  // NOTE:
  // No waterfrontGlassBarrier here.
  //
  // The glass border is visual architecture only.
  // It must NOT block the boardwalk.
}

// ================================================================
// OUTSIDE GRAND STAGE PIER
// ================================================================
//
// Intentionally disabled.
//
// The Grand Stage circular promenade is meant to be walkable.
// The stage itself and backstage area are handled by box colliders
// above.

export function isOutsidePier(x, z) {
  return false;
}

// ================================================================
// MAIN COLLISION CHECK
// ================================================================

export function isBlocked(x, z, radius = 0.55) {

  // Keep the public Grand Stage promenade open.
  if (isOutsidePier(x, z)) {
    return true;
  }

  for (const box of colliders) {

    const minX = box.minX - radius;
    const maxX = box.maxX + radius;
    const minZ = box.minZ - radius;
    const maxZ = box.maxZ + radius;

    if (
      x >= minX &&
      x <= maxX &&
      z >= minZ &&
      z <= maxZ
    ) {
      return true;
    }
  }

  return false;
}
