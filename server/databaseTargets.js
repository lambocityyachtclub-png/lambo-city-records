export function getPlayerDatabaseUrl(env = process.env) {
  const value = env.PLAYER_DATABASE_URL || env.DATABASE_URL;
  return typeof value === "string" ? value.trim() : "";
}

export function getAliveDatabaseUrl(env = process.env) {
  const value = env.ALIVE_DATABASE_URL || env.DATABASE_URL;
  return typeof value === "string" ? value.trim() : "";
}
