import { spawnSync } from "node:child_process";
import mongoose from "mongoose";
import { e2eDatabaseUri } from "./mongo-uri";

export default async function globalSetup() {
  const uri = e2eDatabaseUri();
  if (!uri.includes("/watch-shop-pos-e2e")) {
    throw new Error("Refusing to reset a database that is not watch-shop-pos-e2e.");
  }
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

  const seeded = spawnSync("npx", ["tsx", "scripts/seed.ts"], {
    env: { ...process.env, MONGODB_URI: uri, NODE_ENV: "development" },
    stdio: "inherit",
  });
  if (seeded.status !== 0) {
    throw new Error(`Seed failed with exit code ${seeded.status ?? "unknown"}`);
  }
}
