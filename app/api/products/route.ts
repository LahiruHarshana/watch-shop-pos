import { connectDb } from "@/lib/db/mongoose";
import { requireRole, requireSession } from "@/lib/api/auth-guard";
import { jsonError, jsonPaginated, jsonOk } from "@/lib/api/response";
import { buildPaginationMeta, parsePagination } from "@/lib/api/pagination";
import { buildProductListQuery } from "@/lib/products/product-list-query";
import { Product } from "@/models/Product";

export async function GET(request: Request) {
  const { user, response } = await requireSession();
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const maxLimit = searchParams.get("picker") === "true" ? 200 : 100;
  const { page, limit, skip } = parsePagination(searchParams, { maxLimit });
  const { filter, sort } = await buildProductListQuery(searchParams, {
    isAdmin: user?.role === "admin",
  });

  const [total, products, summaryRows] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .populate("categoryId", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalUnits: { $sum: "$quantity" },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ["$quantity", "$lowStockThreshold"] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const summary = summaryRows[0] ?? {
    totalProducts: 0,
    totalUnits: 0,
    lowStockCount: 0,
  };

  return jsonPaginated(products, buildPaginationMeta(page, limit, total), {
    summary: {
      totalProducts: summary.totalProducts,
      totalUnits: summary.totalUnits,
      lowStockCount: summary.lowStockCount,
    },
  });
}

export async function POST(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const body = await request.json();
  if (!body.name || !body.sku || !body.categoryId || body.priceCents == null) {
    return jsonError("VALIDATION", "Missing required product fields", 400);
  }
  try {
    const product = await Product.create({
      ...body,
      sku: String(body.sku).toUpperCase(),
    });
    return jsonOk(product, 201);
  } catch {
    return jsonError("CONFLICT", "SKU already exists", 409);
  }
}
