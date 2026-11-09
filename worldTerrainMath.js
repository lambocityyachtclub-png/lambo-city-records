// LAMBO CITY — pure terrain height math shared by the renderer and tests.
export function sampleTerrainHeight(district, x, z, fallbackY = 0.64) {
  let height = fallbackY;
  for (const zone of district?.terrainZones || []) {
    if (!zone?.center || !Number.isFinite(zone.center.x) || !Number.isFinite(zone.center.z)) continue;
    const dx = Math.abs(x - zone.center.x), dz = Math.abs(z - zone.center.z);
    if (dx > zone.width / 2 || dz > zone.depth / 2) continue;
    const edgeDistance = Math.min(zone.width / 2 - dx, zone.depth / 2 - dz);
    const transition = Math.max(0, Number.isFinite(zone.transitionWidth) ? zone.transitionWidth : 1);
    const t = transition > 0 ? Math.max(0, Math.min(1, edgeDistance / transition)) : 1;
    const blend = t * t * (3 - 2 * t);
    const edgeY = Number.isFinite(zone.edgeY) ? zone.edgeY : fallbackY + 0.005;
    const topY = Number.isFinite(zone.topY) ? zone.topY : edgeY;
    height = edgeY + (topY - edgeY) * blend;
  }
  return height;
}

export default { sampleTerrainHeight };
