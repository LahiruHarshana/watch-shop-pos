import mongoose from "mongoose";
import { Category } from "@/models/Category";

export const PRODUCT_SORTS = {
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  price_asc: { priceCents: 1 },
  price_desc: { priceCents: -1 },
  stock_asc: { quantity: 1 },
  stock_desc: { quantity: -1 },
  updated_desc: { updatedAt: -1 },
} as const;

export type ProductSortKey = keyof typeof PRODUCT_SORTS;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function buildProductListQuery(
  searchParams: URLSearchParams,
  opts: { isAdmin: boolean },
) {
  const filter: Record<string, unknown> = {};
  const includeInactive = opts.isAdmin && searchParams.get("includeInactive") === "true";
  if (!includeInactive) filter.isActive = true;

  const categoryId = searchParams.get("categoryId");
  const categorySlug = searchParams.get("category")?.trim().toLowerCase();
  if (categoryId && mongoose.isValidObjectId(categoryId)) {
    filter.categoryId = new mongoose.Types.ObjectId(categoryId);
  } else if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug }).select("_id").lean();
    if (cat) filter.categoryId = cat._id;
    else filter.categoryId = new mongoose.Types.ObjectId();
  }

  const q = searchParams.get("q")?.trim();
  if (q) {
    const pattern = escapeRegex(q);
    filter.$or = [
      { name: { $regex: pattern, $options: "i" } },
      { sku: { $regex: pattern, $options: "i" } },
    ];
  }

  const stock = searchParams.get("stock");
  if (stock === "in_stock") filter.quantity = { $gt: 0 };
  else if (stock === "out") filter.quantity = 0;
  else if (stock === "low") {
    filter.$expr = { $lte: ["$quantity", "$lowStockThreshold"] };
  }

  const price: Record<string, number> = {};
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  if (priceMin != null && priceMin !== "" && Number.isFinite(Number(priceMin))) {
    price.$gte = Math.max(0, Math.floor(Number(priceMin)));
  }
  if (priceMax != null && priceMax !== "" && Number.isFinite(Number(priceMax))) {
    price.$lte = Math.max(0, Math.floor(Number(priceMax)));
  }
  if (Object.keys(price).length > 0) filter.priceCents = price;

  const brand = searchParams.get("brand")?.trim();
  if (brand) {
    filter["attributes.brand"] = { $regex: `^${escapeRegex(brand)}$`, $options: "i" };
  }

  const track = searchParams.get("trackInventory");
  if (track === "true") filter.trackInventory = true;
  if (track === "false") filter.trackInventory = false;

  const requested = searchParams.get("sort") ?? "name_asc";
  const sortKey = (requested in PRODUCT_SORTS ? requested : "name_asc") as ProductSortKey;

  return { filter, sort: PRODUCT_SORTS[sortKey], sortKey };
}
