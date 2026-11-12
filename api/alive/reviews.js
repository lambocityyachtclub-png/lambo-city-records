import { Pool } from "pg";
import { createPostgresDevelopmentStorage } from "../../development/storage/postgresDevelopmentStorage.js";
import { createAliveReviewHandler } from "../../development/runtime/aliveReviewApi.js";

let pool;
let reviewStore;
let handler;

function getHandler() {
  if (handler) return handler;
  const token = process.env.ALIVE_REVIEW_TOKEN;
  const databaseUrl = process.env.DATABASE_URL;
  if (!token || token.length < 32) throw new Error("ALIVE_REVIEW_TOKEN is not configured.");
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  pool = new Pool({ connectionString: databaseUrl, max: 3, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
  reviewStore = createPostgresDevelopmentStorage({ pool });
  handler = createAliveReviewHandler({ reviewStore, token });
  return handler;
}

export default async function aliveReviews(req, res) {
  try {
    return await getHandler()(req, res);
  } catch (error) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({ error: "ALIVE owner review service is not configured." }));
  }
}
