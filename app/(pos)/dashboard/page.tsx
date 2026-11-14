import { auth } from "@/lib/auth/auth";
import { connectDb } from "@/lib/db/mongoose";
import { RepairTicket } from "@/models/RepairTicket";
import { Sale } from "@/models/Sale";
import { Product } from "@/models/Product";
import { DashboardHome } from "@/components/pos/dashboard-home";
import type { RepairStatus } from "@/models/RepairTicket";
import { loadExpenseWindow } from "@/lib/expenses/load";
import { addBusinessDays, businessDateKey, businessDayRange, businessTodayKey, businessWeekdayLabel } from "@/lib/time/business-day";

export const instant = false;

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

  const todayKey = businessTodayKey();
  const weekStartKey = addBusinessDays(todayKey, -6);
  const weekStart = businessDayRange(weekStartKey).start;

  const { start, end } = businessDayRange(todayKey);
  const openJobFilter = { status: { $ne: "delivered" as const } };
  const [weekSales, paidToday, lowStock, expenseWindow, openJobCount, openRepairs] = await Promise.all([
    Sale.find({
      status: "completed",
      createdAt: { $gte: weekStart },
    }).lean(),
    RepairTicket.find({
      status: "delivered",
      "payment.paidAt": { $gte: start, $lte: end },
    })
      .select("payment.amountCents")
      .lean(),
    isAdmin
      ? Product.find({
          isActive: true,
          trackInventory: true,
          $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
        })
          .sort({ quantity: 1 })
          .limit(8)
          .select("name sku quantity lowStockThreshold")
          .lean()
      : Promise.resolve([]),
    loadExpenseWindow(todayKey, 7),
    RepairTicket.countDocuments(openJobFilter),
    RepairTicket.find(openJobFilter).sort({ updatedAt: -1 }).limit(4).lean(),
  ]);

  const buckets = Array.from({ length: 7 }, (_, i) => {
    const key = addBusinessDays(weekStartKey, i);
    return { label: businessWeekdayLabel(key), cents: 0, key };
  });
  for (const sale of weekSales) {
    const createdAt = sale.createdAt ? new Date(sale.createdAt) : null;
    if (!createdAt) continue;
    const key = businessDateKey(createdAt);
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.cents += sale.totalCents;
  }
  const maxCents = Math.max(...buckets.map((b) => b.cents), 1);
  const todayCents = buckets.find((b) => b.key === todayKey)?.cents ?? 0;
  const weekTotalCents = buckets.reduce((sum, b) => sum + b.cents, 0);
  const repairCents = paidToday.reduce((sum, ticket) => sum + (ticket.payment?.amountCents ?? 0), 0);

  return (
    <DashboardHome
      firstName={firstName}
      todayCents={todayCents}
      repairCents={repairCents}
      weekTotalCents={weekTotalCents}
      maxCents={maxCents}
      buckets={buckets.map((b) => ({
        label: b.label,
        cents: b.cents,
        key: b.key,
        isToday: b.key === todayKey,
      }))}
      openJobCount={openJobCount}
      openRepairs={openRepairs.map((t) => ({
        id: String(t._id),
        ticketId: t.ticketId,
        status: t.status as RepairStatus,
        watchBrand: t.watchBrand,
        watchModel: t.watchModel,
        customerName: t.customerName,
        estimatedCostCents: t.estimatedCostCents,
      }))}
      shortcuts={shortcuts}
      expenseToday={{
        totalCents: expenseWindow.today.totalCents,
        count: expenseWindow.today.count,
        topCategory: expenseWindow.today.topCategory?.name ?? null,
        categories: expenseWindow.today.categories.map((category) => ({
          name: category.name,
          amountCents: category.amountCents,
        })),
      }}
      expenseDays={expenseWindow.days.map((day) => ({
        label: businessWeekdayLabel(day.date),
        cents: day.totalCents,
        key: day.date,
        isToday: day.date === todayKey,
      }))}
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
