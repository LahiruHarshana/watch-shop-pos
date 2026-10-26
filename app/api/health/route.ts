import { connectDb } from "@/lib/db/mongoose";
import { jsonOk, jsonError } from "@/lib/api/response";

export async function GET() {
  try {
    await connectDb();
    return jsonOk({ status: "ok", db: "connected" });
  } catch {
    return jsonError("DB_ERROR", "Database connection failed", 503);
  }
}
