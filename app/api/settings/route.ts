import { connectDb } from "@/lib/db/mongoose";
import { requireRole, requireSession } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ShopSettings } from "@/models/ShopSettings";
import { normalizeShopProfile, shopProfileError } from "@/lib/settings/shop-profile";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  await connectDb();
  const settings = await ShopSettings.findById("shop").lean();
  return jsonOk(settings ?? {});
}

export async function PATCH(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const body = await request.json();
  const allowed = [
    "shopName",
    "address",
    "phone",
    "email",
    "logoUrl",
    "logoCloudinaryId",
    "receiptThankYouNote",
    "repairTermsAndConditions",
    "defaultLowStockThreshold",
    "receiptPaperWidth",
    "taxEnabled",
  ];
  const profileError = shopProfileError(body);
  if (profileError) return jsonError("VALIDATION", profileError, 400);
  const normalized = normalizeShopProfile(body);
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (!(key in body)) continue;
    if (key === "shopName" || key === "address" || key === "phone" || key === "email") {
      update[key] = normalized[key];
      continue;
    }
    update[key] = body[key];
  }
  const settings = await ShopSettings.findByIdAndUpdate(
    "shop",
    { $set: update },
    { new: true, upsert: true },
  ).lean();
  return jsonOk(settings);
}
