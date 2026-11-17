import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "../lib/db/mongoose";
import { calculateSaleTotals } from "../lib/money/calculate-sale";
import { Counter } from "../models/Counter";
import { User } from "../models/User";
import { ShopSettings } from "../models/ShopSettings";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { Shift } from "../models/Shift";
import { Sale } from "../models/Sale";
import { RepairTicket } from "../models/RepairTicket";
import { StockAdjustment } from "../models/StockAdjustment";
import { Expense } from "../models/Expense";
import { ExpenseCategory } from "../models/ExpenseCategory";
import { ensureDefaultExpenseCategories } from "../lib/expenses/ensure";
import { SHOP_NAME } from "../lib/settings/shop-profile";
import { addBusinessDays, businessTodayKey } from "../lib/time/business-day";

const SEED_NOTE = "seed";

const categories = [
  { name: "Men's Watches", slug: "mens-watches", sortOrder: 1 },
  { name: "Women's Watches", slug: "womens-watches", sortOrder: 2 },
  { name: "Smartwatches", slug: "smartwatches", sortOrder: 3 },
  { name: "Leather Straps", slug: "leather-straps", sortOrder: 4 },
  { name: "Metal Bracelets", slug: "metal-bracelets", sortOrder: 5 },
  { name: "Batteries", slug: "batteries", sortOrder: 6 },
];

type ProductSeed = {
  sku: string;
  name: string;
  categorySlug: string;
  priceCents: number;
  quantity: number;
  lowStockThreshold: number;
  attributes?: { batterySize?: string; brand?: string };
};

const productCatalog: ProductSeed[] = [
  {
    sku: "WCH-M-CLASSIC",
    name: "Classic Men's Dress Watch",
    categorySlug: "mens-watches",
    priceCents: 1250000,
    quantity: 8,
    lowStockThreshold: 2,
    attributes: { brand: "Premier" },
  },
  {
    sku: "WCH-M-DIVER",
    name: "Men's Diver 200m",
    categorySlug: "mens-watches",
    priceCents: 1890000,
    quantity: 4,
    lowStockThreshold: 2,
    attributes: { brand: "AquaLine" },
  },
  {
    sku: "WCH-M-CHRONO",
    name: "Men's Chronograph Steel",
    categorySlug: "mens-watches",
    priceCents: 2450000,
    quantity: 3,
    lowStockThreshold: 1,
    attributes: { brand: "Premier" },
  },
  {
    sku: "WCH-W-PETITE",
    name: "Women's Petite Dress Watch",
    categorySlug: "womens-watches",
    priceCents: 980000,
    quantity: 6,
    lowStockThreshold: 2,
    attributes: { brand: "Luna" },
  },
  {
    sku: "WCH-W-ROSE",
    name: "Women's Rose Gold Mesh",
    categorySlug: "womens-watches",
    priceCents: 1120000,
    quantity: 5,
    lowStockThreshold: 2,
    attributes: { brand: "Luna" },
  },
  {
    sku: "SMT-FIT-PRO",
    name: "Fitness Smartwatch Pro",
    categorySlug: "smartwatches",
    priceCents: 650000,
    quantity: 10,
    lowStockThreshold: 3,
    attributes: { brand: "Pulse" },
  },
  {
    sku: "SMT-URBAN",
    name: "Urban Smartwatch 44mm",
    categorySlug: "smartwatches",
    priceCents: 890000,
    quantity: 7,
    lowStockThreshold: 2,
    attributes: { brand: "Pulse" },
  },
  {
    sku: "STR-LTH-20",
    name: "Leather Strap 20mm Black",
    categorySlug: "leather-straps",
    priceCents: 350000,
    quantity: 14,
    lowStockThreshold: 3,
  },
  {
    sku: "STR-LTH-22",
    name: "Leather Strap 22mm Brown",
    categorySlug: "leather-straps",
    priceCents: 380000,
    quantity: 11,
    lowStockThreshold: 3,
  },
  {
    sku: "BRC-MTL-OYS",
    name: "Oyster Steel Bracelet 20mm",
    categorySlug: "metal-bracelets",
    priceCents: 420000,
    quantity: 9,
    lowStockThreshold: 2,
  },
  {
    sku: "BAT-CR2032",
    name: "CR2032 Watch Battery",
    categorySlug: "batteries",
    priceCents: 45000,
    quantity: 52,
    lowStockThreshold: 10,
    attributes: { batterySize: "CR2032" },
  },
  {
    sku: "BAT-CR2016",
    name: "CR2016 Watch Battery",
    categorySlug: "batteries",
    priceCents: 40000,
    quantity: 4,
    lowStockThreshold: 10,
    attributes: { batterySize: "CR2016" },
  },
  {
    sku: "BAT-SR626SW",
    name: "SR626SW Silver Oxide Cell",
    categorySlug: "batteries",
    priceCents: 55000,
    quantity: 30,
    lowStockThreshold: 8,
    attributes: { batterySize: "SR626SW" },
  },
];

function daysAgo(n: number, hour = 11) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 30, 0, 0);
  return d;
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function clearSeedTransactionalData() {
  await Sale.deleteMany({ invoiceNumber: /^INV-SEED-/ });
  await RepairTicket.deleteMany({ ticketId: /^R-SEED-/ });
  await StockAdjustment.deleteMany({ note: SEED_NOTE });
  await Shift.deleteMany({ notes: SEED_NOTE });
  await Expense.deleteMany({ note: SEED_NOTE });
}

async function upsertUsers() {
  const adminHash = await bcrypt.hash("Admin@12345", 12);
  const admin = await User.findOneAndUpdate(
    { email: "admin@shop.local" },
    {
      email: "admin@shop.local",
      name: "Shop Admin",
      passwordHash: adminHash,
      role: "admin",
      isActive: true,
    },
    { upsert: true, returnDocument: "after" },
  );

  const cashierHash = await bcrypt.hash("Cashier@12345", 12);
  const cashier = await User.findOneAndUpdate(
    { email: "cashier@shop.local" },
    {
      email: "cashier@shop.local",
      name: "Front Counter",
      passwordHash: cashierHash,
      role: "cashier",
      isActive: true,
    },
    { upsert: true, returnDocument: "after" },
  );

  const techHash = await bcrypt.hash("Tech@12345", 12);
  const technician = await User.findOneAndUpdate(
    { email: "tech@shop.local" },
    {
      email: "tech@shop.local",
      name: "Bench Technician",
      passwordHash: techHash,
      role: "cashier",
      isActive: true,
    },
    { upsert: true, returnDocument: "after" },
  );

  return { admin, cashier, technician };
}

async function upsertCatalog() {
  await ShopSettings.findByIdAndUpdate(
    "shop",
    {
      shopName: SHOP_NAME,
      address: "42 Galle Road, Colombo 03, Sri Lanka",
      phone: "+94 11 234 5678",
      email: "hello@premierwatch.local",
      receiptThankYouNote: `Thank you for choosing ${SHOP_NAME}.`,
      repairTermsAndConditions:
        "Unclaimed repairs after 60 days may incur storage fees. We are not responsible for water damage not disclosed at intake.",
      defaultLowStockThreshold: 10,
      receiptPaperWidth: "80mm",
      taxEnabled: false,
    },
    { upsert: true },
  );

  for (const cat of categories) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
  }

  const slugToId = new Map<string, mongoose.Types.ObjectId>();
  const allCats = await Category.find().lean();
  for (const c of allCats) {
    slugToId.set(c.slug, c._id);
  }

  const productsBySku = new Map<string, mongoose.Types.ObjectId>();
  for (const p of productCatalog) {
    const categoryId = slugToId.get(p.categorySlug);
    if (!categoryId) continue;
    const doc = await Product.findOneAndUpdate(
      { sku: p.sku },
      {
        name: p.name,
        sku: p.sku,
        categoryId,
        priceCents: p.priceCents,
        quantity: p.quantity,
        lowStockThreshold: p.lowStockThreshold,
        attributes: p.attributes ?? {},
        trackInventory: true,
        isActive: true,
      },
      { upsert: true, returnDocument: "after" },
    );
    productsBySku.set(p.sku, doc._id);
  }

  return productsBySku;
}

type SaleLineSeed = { sku: string; quantity: number };

async function createSale(
  invoiceNumber: string,
  createdAt: Date,
  soldBy: mongoose.Types.ObjectId,
  shiftId: mongoose.Types.ObjectId | undefined,
  paymentMethod: "cash" | "card" | "bank_transfer",
  lines: SaleLineSeed[],
  productsBySku: Map<string, mongoose.Types.ObjectId>,
) {
  const productDocs = await Product.find({
    sku: { $in: lines.map((l) => l.sku) },
  });
  const bySku = new Map(productDocs.map((p) => [p.sku, p]));

  const cartLines = lines.map((l) => {
    const p = bySku.get(l.sku)!;
    return {
      unitPriceCents: p.priceCents,
      quantity: l.quantity,
    };
  });
  const totals = calculateSaleTotals(cartLines);

  const enrichedLines = lines.map((l) => {
    const p = bySku.get(l.sku)!;
    const lineTotal = calculateSaleTotals([
      { unitPriceCents: p.priceCents, quantity: l.quantity },
    ]).totalCents;
    return {
      productId: p._id,
      name: p.name,
      sku: p.sku,
      quantity: l.quantity,
      unitPriceCents: p.priceCents,
      lineTotalCents: lineTotal,
    };
  });

  for (const l of lines) {
    const p = bySku.get(l.sku)!;
    if (p.trackInventory) {
      p.quantity = Math.max(0, p.quantity - l.quantity);
      await p.save();
    }
  }

  const payments =
    paymentMethod === "cash"
      ? [
          {
            method: "cash" as const,
            amountCents: totals.totalCents,
            tenderedCents: totals.totalCents + 50000,
            changeCents: 50000,
          },
        ]
      : [{ method: paymentMethod, amountCents: totals.totalCents }];

  await Sale.findOneAndUpdate(
    { invoiceNumber },
    {
      invoiceNumber,
      status: "completed",
      lineItems: enrichedLines,
      subtotalCents: totals.subtotalCents,
      discountTotalCents: totals.discountTotalCents,
      totalCents: totals.totalCents,
      payments,
      soldBy,
      shiftId,
      createdAt,
    },
    { upsert: true, timestamps: false },
  );
}

async function seedShiftsAndSales(
  cashierId: mongoose.Types.ObjectId,
  productsBySku: Map<string, mongoose.Types.ObjectId>,
) {
  const closedOpened = daysAgo(1, 8);
  const closedClosed = daysAgo(1, 19);
  const closedShift = await Shift.create({
    openedBy: cashierId,
    openedAt: closedOpened,
    openingFloatCents: 500000,
    closedBy: cashierId,
    closedAt: closedClosed,
    expectedCashCents: 850000,
    countedCashCents: 850000,
    varianceCents: 0,
    status: "closed",
    notes: SEED_NOTE,
  });

  await createSale(
    "INV-SEED-0001",
    daysAgo(6, 14),
    cashierId,
    undefined,
    "card",
    [{ sku: "BAT-CR2032", quantity: 2 }],
    productsBySku,
  );
  await createSale(
    "INV-SEED-0002",
    daysAgo(5, 12),
    cashierId,
    undefined,
    "cash",
    [{ sku: "STR-LTH-20", quantity: 1 }],
    productsBySku,
  );
  await createSale(
    "INV-SEED-0003",
    daysAgo(4, 16),
    cashierId,
    undefined,
    "cash",
    [{ sku: "WCH-M-CLASSIC", quantity: 1 }],
    productsBySku,
  );
  await createSale(
    "INV-SEED-0004",
    daysAgo(3, 11),
    cashierId,
    undefined,
    "bank_transfer",
    [{ sku: "SMT-FIT-PRO", quantity: 1 }, { sku: "BAT-CR2032", quantity: 1 }],
    productsBySku,
  );
  await createSale(
    "INV-SEED-0005",
    daysAgo(2, 15),
    cashierId,
    undefined,
    "card",
    [{ sku: "WCH-W-PETITE", quantity: 1 }],
    productsBySku,
  );
  await createSale(
    "INV-SEED-0006",
    daysAgo(1, 10),
    cashierId,
    closedShift._id,
    "cash",
    [{ sku: "BAT-SR626SW", quantity: 3 }, { sku: "STR-LTH-22", quantity: 1 }],
    productsBySku,
  );

  const openShift = await Shift.create({
    openedBy: cashierId,
    openedAt: daysAgo(0, 8),
    openingFloatCents: 750000,
    status: "open",
    notes: SEED_NOTE,
  });

  await createSale(
    "INV-SEED-0007",
    daysAgo(0, 10),
    cashierId,
    openShift._id,
    "cash",
    [{ sku: "BAT-CR2032", quantity: 4 }, { sku: "BRC-MTL-OYS", quantity: 1 }],
    productsBySku,
  );
  await createSale(
    "INV-SEED-0008",
    daysAgo(0, 14),
    cashierId,
    openShift._id,
    "card",
    [{ sku: "SMT-URBAN", quantity: 1 }],
    productsBySku,
  );
}

async function seedRepairs(
  adminId: mongoose.Types.ObjectId,
  cashierId: mongoose.Types.ObjectId,
) {
  const tickets = [
    {
      ticketId: "R-SEED-0001",
      customerName: "Nimal Perera",
      customerPhone: "+94 77 123 4567",
      watchBrand: "Seiko",
      watchModel: "5 Sports",
      issueDescription: "Crystal scratched; needs polish and new gasket.",
      estimatedCostCents: 1850000,
      status: "pending" as const,
      statusHistory: [],
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      ticketId: "R-SEED-0002",
      customerName: "Ayesha Fernando",
      customerPhone: "+94 71 555 0199",
      watchBrand: "Citizen",
      watchModel: "Eco-Drive",
      issueDescription: "Battery replaced elsewhere — still not running.",
      estimatedCostCents: 950000,
      status: "in_progress" as const,
      statusHistory: [
        {
          status: "pending" as const,
          changedBy: cashierId,
          changedAt: daysAgo(4),
          note: "Intake complete",
        },
        {
          status: "in_progress" as const,
          changedBy: adminId,
          changedAt: daysAgo(3),
          note: "On bench — movement inspection",
        },
      ],
      createdAt: daysAgo(4),
      updatedAt: daysAgo(0, 8),
    },
    {
      ticketId: "R-SEED-0003",
      customerName: "Rohan Silva",
      customerPhone: "+94 76 888 2211",
      watchBrand: "Tissot",
      watchModel: "PRX Powermatic",
      issueDescription: "Bracelet resize and clasp adjustment.",
      estimatedCostCents: 450000,
      status: "ready" as const,
      statusHistory: [
        {
          status: "pending" as const,
          changedBy: cashierId,
          changedAt: daysAgo(5),
        },
        {
          status: "in_progress" as const,
          changedBy: adminId,
          changedAt: daysAgo(4),
        },
        {
          status: "ready" as const,
          changedBy: adminId,
          changedAt: daysAgo(1),
          note: "Ready for pickup — SMS sent",
        },
      ],
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
    {
      ticketId: "R-SEED-0004",
      customerName: "Dilani Jayawardena",
      customerPhone: "+94 70 334 7788",
      watchBrand: "Fossil",
      watchModel: "Gen 6",
      issueDescription: "Screen replacement and water seal test.",
      estimatedCostCents: 1250000,
      status: "delivered" as const,
      statusHistory: [
        {
          status: "pending" as const,
          changedBy: cashierId,
          changedAt: daysAgo(8),
        },
        {
          status: "in_progress" as const,
          changedBy: adminId,
          changedAt: daysAgo(7),
        },
        {
          status: "ready" as const,
          changedBy: adminId,
          changedAt: daysAgo(2),
        },
        {
          status: "delivered" as const,
          changedBy: cashierId,
          changedAt: daysAgo(0, 9),
          note: "Paid on collection",
        },
      ],
      payment: {
        method: "cash" as const,
        amountCents: 1250000,
        paidAt: daysAgo(0, 9),
        receivedBy: cashierId,
      },
      createdAt: daysAgo(8),
      updatedAt: daysAgo(0, 9),
    },
    {
      ticketId: "R-SEED-0005",
      customerName: "Kasun Wickramasinghe",
      customerPhone: "+94 77 900 1122",
      watchBrand: "Orient",
      watchModel: "Bambino",
      issueDescription: "Full service — clean, oil, regulate.",
      estimatedCostCents: 780000,
      status: "in_progress" as const,
      statusHistory: [
        {
          status: "pending" as const,
          changedBy: cashierId,
          changedAt: daysAgo(1),
        },
        {
          status: "in_progress" as const,
          changedBy: adminId,
          changedAt: daysAgo(0, 8),
        },
      ],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(0, 8),
    },
  ];

  for (const t of tickets) {
    const { ticketId, createdAt, updatedAt, ...rest } = t;
    await RepairTicket.findOneAndUpdate(
      { ticketId },
      {
        ticketId,
        ...rest,
        createdBy: cashierId,
        createdAt,
        updatedAt,
      },
      { upsert: true, timestamps: false },
    );
  }
}

async function seedStockAdjustments(
  adminId: mongoose.Types.ObjectId,
  productsBySku: Map<string, mongoose.Types.ObjectId>,
) {
  const batteryId = productsBySku.get("BAT-CR2032");
  const strapId = productsBySku.get("STR-LTH-20");
  if (!batteryId || !strapId) return;

  const bat = await Product.findById(batteryId);
  const strap = await Product.findById(strapId);
  if (!bat || !strap) return;

  await StockAdjustment.create({
    productId: batteryId,
    delta: 24,
    reason: "purchase",
    note: SEED_NOTE,
    performedBy: adminId,
    createdAt: daysAgo(7),
  });
  bat.quantity += 24;
  await bat.save();

  await StockAdjustment.create({
    productId: strapId,
    delta: -1,
    reason: "damage",
    note: SEED_NOTE,
    performedBy: adminId,
    createdAt: daysAgo(3),
  });
  strap.quantity = Math.max(0, strap.quantity - 1);
  await strap.save();
}

async function seedExpenses(adminId: mongoose.Types.ObjectId) {
  await ensureDefaultExpenseCategories();
  const categories = await ExpenseCategory.find().select("slug").lean();
  const bySlug = new Map(categories.map((category) => [category.slug, category._id]));
  const today = businessTodayKey();
  const samples = [
    { slug: "food", daysAgo: 0, amountCents: 185000, description: "Staff lunch" },
    { slug: "transportation", daysAgo: 0, amountCents: 75000, description: "Bus fare for a delivery" },
    { slug: "utilities", daysAgo: 1, amountCents: 640000, description: "Electricity bill" },
    { slug: "supplies", daysAgo: 2, amountCents: 240000, description: "Packaging supplies" },
    { slug: "maintenance", daysAgo: 3, amountCents: 450000, description: "Counter maintenance" },
    { slug: "marketing", daysAgo: 4, amountCents: 300000, description: "Instagram advert" },
    { slug: "transportation", daysAgo: 5, amountCents: 120000, description: "Fuel for the shop bike" },
    { slug: "food", daysAgo: 6, amountCents: 95000, description: "Tea and snacks" },
    { slug: "rent", daysAgo: 6, amountCents: 7500000, description: "Shop rent" },
  ];
  await Expense.insertMany(
    samples.flatMap((sample) => {
      const categoryId = bySlug.get(sample.slug);
      if (!categoryId) return [];
      return [{
        amountCents: sample.amountCents,
        categoryId,
        description: sample.description,
        spentOn: addBusinessDays(today, -sample.daysAgo),
        note: SEED_NOTE,
        createdBy: adminId,
      }];
    }),
  );
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Refusing to seed demo users while NODE_ENV=production. Create staff from the admin screen, or set ALLOW_DEMO_SEED=true only on a disposable database.",
    );
  }
  await connectDb();

  await clearSeedTransactionalData();

  const { admin, cashier } = await upsertUsers();
  const productsBySku = await upsertCatalog();

  if (!admin || !cashier) {
    throw new Error("Failed to create seed users");
  }

  await seedShiftsAndSales(cashier._id, productsBySku);
  await seedRepairs(admin._id, cashier._id);
  await seedStockAdjustments(admin._id, productsBySku);
  await seedExpenses(admin._id);

  const dateKey = todayKey();
  await Counter.findByIdAndUpdate(
    `invoice-${dateKey}`,
    { seq: 100, dateKey },
    { upsert: true },
  );
  await Counter.findByIdAndUpdate(
    `repair-${dateKey}`,
    { seq: 100, dateKey },
    { upsert: true },
  );

  console.log("Seed complete.");
  console.log("");
  console.log("Users:");
  console.log("  Admin:   admin@shop.local / Admin@12345");
  console.log("  Cashier: cashier@shop.local / Cashier@12345");
  console.log("  Tech:    tech@shop.local / Tech@12345");
  console.log("");
  console.log("Catalog: 6 categories, 13 products (incl. low-stock CR2016)");
  console.log("Repairs: 5 tickets (pending → delivered)");
  console.log("Sales: 8 sample invoices (last 7 days + today on open shift)");
  console.log("Shifts: 1 closed (yesterday) + 1 open (today)");
  console.log("Stock: 2 adjustment records");
  console.log("Expenses: 8 categories and 9 sample expenses");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
