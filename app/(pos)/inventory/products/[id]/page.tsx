import { notFound } from "next/navigation";
import { connection } from "next/server";
import { connectDb } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { ProductDetailClient } from "@/components/pos/product-detail-client";

export const instant = false;

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  await connection();
  const { id } = await params;
  const { edit } = await searchParams;
  await connectDb();
  const product = await Product.findById(id).populate("categoryId", "name slug").lean();
  if (!product) notFound();

  return (
    <ProductDetailClient
      product={JSON.parse(JSON.stringify(product))}
      startEditing={edit === "1"}
    />
  );
}
