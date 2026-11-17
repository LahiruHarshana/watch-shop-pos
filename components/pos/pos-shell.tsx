"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Package,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  Tags,
  Users,
  LogOut,
  Menu,
  Layers,
  Search,
  Bell,
  Watch,
  PanelLeft,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HistoryNav } from "@/components/pos/history-nav";
import { ShiftBar } from "@/components/pos/shift-bar";
import { springSoft } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const groups = [
  {
    label: "Counter",
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard, roles: ["admin", "cashier"] },
      { href: "/checkout", label: "Checkout", icon: ShoppingCart, roles: ["admin", "cashier"] },
      { href: "/sales", label: "Sales", icon: Receipt, roles: ["admin", "cashier"] },
      { href: "/repairs", label: "Repairs", icon: Wrench, roles: ["admin", "cashier"] },
      { href: "/expenses", label: "Expenses", icon: Wallet, roles: ["admin", "cashier"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/inventory/products", label: "Inventory", icon: Package, roles: ["admin", "cashier"] },
      { href: "/inventory/categories", label: "Categories", icon: Tags, roles: ["admin"] },
      { href: "/inventory/adjustments", label: "Stock", icon: Layers, roles: ["admin"] },
    ],
  },
  {
    label: "Shop",
    items: [
      { href: "/reports/daily", label: "Reports", icon: BarChart3, roles: ["admin"] },
      { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
      { href: "/users", label: "Staff", icon: Users, roles: ["admin"] },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  role,
  pathname,
  collapsed,
  onNavigate,
}: {
  role: string;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        const items = group.items.filter((item) => item.roles.includes(role));
        if (items.length === 0) return null;
        return (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center px-0",
                      active && "text-white",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={reduce ? undefined : "nav-active"}
                        className="absolute inset-0 rounded-xl bg-white/10"
                        transition={springSoft}
                      />
                    )}
                    {active && <span className="absolute top-2 bottom-2 left-0 z-10 w-0.5 rounded-full bg-[#c4a574]" />}
                    <Icon className="relative z-10 size-4 shrink-0" />
                    {!collapsed && <span className="relative z-10">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const role = session?.user?.role ?? "cashier";
  const [collapsed, setCollapsed] = useState(false);
  const [q, setQ] = useState("");
  const name = session?.user?.name ?? "Staff";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <motion.aside
        animate={{ width: collapsed ? 76 : 232 }}
        transition={springSoft}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/8 bg-[#141218] px-3 py-4 text-[#f6f1ea] lg:flex"
      >
        <div className={cn("mb-6 flex items-center gap-2.5 px-1", collapsed && "justify-center")}>
          <Link href="/dashboard" className="flex size-9 items-center justify-center rounded-xl bg-[#f6f1ea] text-[#141218]" title="LUMINA">
            <Watch className="size-4" />
          </Link>
          {!collapsed && (
            <span>
              <span className="block text-sm font-semibold tracking-tight">LUMINA</span>
              <span className="block text-[10px] tracking-[0.14em] text-white/40 uppercase">Retail & repair</span>
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavLinks role={role} pathname={pathname} collapsed={collapsed} />
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-2">
          <div className={cn("mb-1 flex items-center gap-2 px-1", collapsed && "justify-center")}>
            <Avatar className="size-8">
              <AvatarFallback className="bg-[#c4a574] text-[11px] font-semibold text-[#141218]">{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="text-xs capitalize text-white/45">{role}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mb-1 flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs text-white/45 hover:bg-white/8 hover:text-white"
          >
            <PanelLeft className="size-4" />
            {!collapsed && "Collapse"}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Log out"
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-white/55 hover:bg-white/8 hover:text-white",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="size-4" />
            {!collapsed && "Log out"}
          </button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 md:px-6">
          <Sheet>
            <SheetTrigger className="flex size-9 items-center justify-center rounded-xl border border-border bg-white lg:hidden" aria-label="Open menu">
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-white/10 bg-[#141218] text-[#f6f1ea]">
              <div className="mb-6 flex items-center gap-2 text-sm font-semibold">
                <Watch className="size-4" />
                LUMINA
              </div>
              <NavLinks role={role} pathname={pathname} />
            </SheetContent>
          </Sheet>
          <Suspense fallback={null}>
            <HistoryNav />
          </Suspense>
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              router.push(q.trim() ? `/checkout?q=${encodeURIComponent(q.trim())}` : "/checkout");
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-11 w-full rounded-2xl border border-border bg-white pl-9 pr-16 text-sm shadow-[var(--shadow-surface)] outline-none focus-visible:border-brand"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-surface-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </form>
          <div className="hidden w-[220px] sm:block">
            <ShiftBar />
          </div>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => toast.message("No new alerts")}
            className="flex size-11 items-center justify-center rounded-2xl border border-border bg-white text-muted-foreground shadow-[var(--shadow-surface)] hover:text-foreground"
          >
            <Bell className="size-4" />
          </button>
          <Link href="/checkout" className="hidden h-11 items-center rounded-2xl bg-brand px-4 text-sm font-medium text-white shadow-[0_8px_20px_rgb(61_53_196/0.28)] hover:bg-brand-hover md:inline-flex">
            New sale
          </Link>
        </header>
        <main className="min-w-0 flex-1 px-4 pb-8 md:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 sm:hidden">
            <ShiftBar />
          </div>
        </main>
      </div>
    </div>
  );
}
