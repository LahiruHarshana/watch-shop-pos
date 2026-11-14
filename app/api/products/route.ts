import { connectDb } from "@/lib/db/mongoose";
import { requireRole, requireSession } from "@/lib/api/auth-guard";
import { jsonError, jsonPaginated, jsonOk } from "@/lib/api/response";
import { buildPaginationMeta, parsePagination } from "@/lib/api/pagination";
import { buildProductListQuery } from "@/lib/products/product-list-query";
import { Product } from "@/models/Product";
import { StockAdjustment } from "@/models/StockAdjustment";
import { withOptionalTransaction } from "@/lib/db/with-optional-transaction";
import { priceCentsError } from "@/lib/products/price";

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
  const { user, response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const body = await request.json();
  if (!body.name || !body.sku || !body.categoryId || body.priceCents == null) {
    return jsonError("VALIDATION", "Missing required product fields", 400);
  }
  const invalidPrice = priceCentsError(body.priceCents);
  if (invalidPrice) return jsonError("VALIDATION", invalidPrice, 400);
  const quantity = Number(body.quantity ?? 0);
  if (!Number.isInteger(quantity) || quantity < 0) {
    return jsonError("VALIDATION", "Opening quantity cannot be negative", 400);
  }
  const productDoc = { ...body, sku: String(body.sku).toUpperCase(), quantity };
  try {
    return await withOptionalTransaction(async (session) => {
      const created = session
        ? await Product.create([productDoc], { session })
        : await Product.create([productDoc]);
      const product = created[0];
      if (quantity > 0) {
        const opening = {
          productId: product._id,
          delta: quantity,
          reason: "purchase" as const,
          note: "Opening stock",
          performedBy: user!.id,
        };
        if (session) {
          await StockAdjustment.create([opening], { session });
        } else {
          await StockAdjustment.create([opening]);
        }
      }
      return jsonOk(product, 201);
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return jsonError("CONFLICT", "SKU already exists", 409);
    }
    console.error("POST /api/products failed:", error);
    const message = error instanceof Error ? error.message : "Product could not be created";
    return jsonError("SERVER_ERROR", message, 500);
  }
}
