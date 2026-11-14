import { config as loadEnv } from "dotenv";

const E2E_DB = "watch-shop-pos-e2e";

loadEnv({ path: ".env.local" });

/** Point the configured cluster or local server at the isolated E2E database. */
export function e2eDatabaseUri(source = process.env.MONGODB_URI): string {
  if (!source) {
    throw new Error("MONGODB_URI is missing. Set it in .env.local before running E2E.");
  }
  const match = source.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(?:\/[^?]*)?(\?.*)?$/);
  if (!match) {
    throw new Error("MONGODB_URI is not a MongoDB connection string.");
  }
  return `${match[1]}/${E2E_DB}${match[2] ?? ""}`;
}
