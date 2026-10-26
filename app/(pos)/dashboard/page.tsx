import { auth } from "@/lib/auth/auth";
import { connectDb } from "@/lib/db/mongoose";
import { RepairTicket } from "@/models/RepairTicket";
import { Sale } from "@/models/Sale";
import { Product } from "@/models/Product";
import { DashboardHome } from "@/components/pos/dashboard-home";
import type { RepairStatus } from "@/models/RepairTicket";

export const instant = false;

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const shortcuts = [
    { href: "/inventory/products?category=mens-watches", title: "Men's watches", tone: "bg-[#eef2ff]" },
  { href: "/inventory/products", title: "Straps & bracelets", tone: "bg-[#fde8f3]" },
  { href: "/repairs", title: "Repair bench", tone: "bg-[#e7f8f1]" },
];

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const isAdmin = session?.user?.role === "admin";
  await connectDb();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const weekStart = new Date(start);
  weekStart.setDate(weekStart.getDate() - 6);

  const weekSales = await Sale.find({
    status: "completed",
    createdAt: { $gte: weekStart },
  }).lean();

  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { label: days[d.getDay()], cents: 0, key: d.toDateString() };
  });
  for (const sale of weekSales) {
    const key = new Date(sale.createdAt ?? Date.now()).toDateString();
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.cents += sale.totalCents;
  }
  const maxCents = Math.max(...buckets.map((b) => b.cents), 1);
  const todayKey = start.toDateString();
  const todayCents = buckets.find((b) => b.key === todayKey)?.cents ?? 0;
  const weekTotalCents = buckets.reduce((sum, b) => sum + b.cents, 0);

  const lowStock = isAdmin
    ? await Product.find({
        isActive: true,
        trackInventory: true,
        $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
      })
        .sort({ quantity: 1 })
        .limit(8)
        .select("name sku quantity lowStockThreshold")
        .lean()
    : [];

  const openRepairs = await RepairTicket.find({ status: { $ne: "delivered" } })
    .sort({ updatedAt: -1 })
    .limit(4)
    .lean();

  return (
    <DashboardHome
      firstName={firstName}
      todayCents={todayCents}
      weekTotalCents={weekTotalCents}
      maxCents={maxCents}
      buckets={buckets.map((b) => ({
        label: b.label,
        cents: b.cents,
        key: b.key,
        isToday: b.key === todayKey,
      }))}
      openRepairs={openRepairs.map((t) => ({
        id: String(t._id),
        ticketId: t.ticketId,
        status: t.status as RepairStatus,
        watchBrand: t.watchBrand,
        watchModel: t.watchModel,
        customerName: t.customerName,
      }))}
      shortcuts={shortcuts}
      lowStock={lowStock.map((p) => ({
        id: String(p._id),
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        lowStockThreshold: p.lowStockThreshold,
      }))}
    />
  );
}
