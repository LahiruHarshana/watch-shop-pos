"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Package,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Menu,
  Layers,
  Search,
  Bell,
  Watch,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ShiftBar } from "@/components/pos/shift-bar";
import { formatLkr } from "@/lib/money/format";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, roles: ["admin", "cashier"] },
  { href: "/checkout", label: "Checkout", icon: ShoppingCart, roles: ["admin", "cashier"] },
  { href: "/repairs", label: "Repairs", icon: Wrench, roles: ["admin", "cashier"] },
  { href: "/inventory/products", label: "Inventory", icon: Package, roles: ["admin", "cashier"] },
  { href: "/inventory/adjustments", label: "Stock", icon: Layers, roles: ["admin"] },
  { href: "/reports/daily", label: "Reports", icon: BarChart3, roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  { href: "/users", label: "Staff", icon: Users, roles: ["admin"] },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-white text-foreground shadow-[0_8px_20px_rgb(140_160_200/0.25)]"
          : "text-muted-foreground hover:bg-white/60 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

function RightRail() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [shift, setShift] = useState<{ open: boolean; cash: number }>({ open: false, cash: 0 });

  useEffect(() => {
    fetch("/api/shifts")
      .then((r) => r.json())
      .then((j) => {
        setShift({
          open: Boolean(j.data?.open),
          cash: j.data?.expectedCashCents ?? 0,
        });
      })
      .catch(() => undefined);
  }, []);

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col gap-4 border-l border-border/60 px-5 py-6 xl:flex">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(q ? `/checkout?q=${encodeURIComponent(q)}` : "/checkout");
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="h-11 rounded-full border-0 bg-white pl-9 shadow-[0_6px_18px_rgb(140_160_200/0.12)]"
          />
        </div>
        <span className="relative flex size-11 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgb(140_160_200/0.12)]">
          <Bell className="size-4 text-muted-foreground" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-orange-400" />
        </span>
      </form>

      <Link
        href="/checkout"
        className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-primary to-violet-500 p-5 text-primary-foreground shadow-[0_16px_30px_rgb(91_92_246/0.35)]"
      >
        <p className="text-lg font-semibold leading-tight">Start a new sale</p>
        <p className="mt-1 text-sm text-primary-foreground/80">Watches, straps, and batteries</p>
        <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-primary">
          Open checkout
        </span>
      </Link>

      <div className="rounded-[1.4rem] bg-white p-5 shadow-[0_10px_24px_rgb(140_160_200/0.12)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Drawer</p>
            <p className="text-xs text-muted-foreground">
              {shift.open ? "Shift is open" : "No open shift"}
            </p>
          </div>
          <div className="flex size-14 items-center justify-center rounded-full border-[6px] border-muted text-xs font-semibold text-primary">
            {shift.open ? "On" : "Off"}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Expected cash {formatLkr(shift.cash)}</p>
        <div className="mt-3">
          <ShiftBar />
        </div>
      </div>
    </aside>
  );
}

export function PosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "cashier";
  const items = nav.filter((n) => n.roles.includes(role));
  const name = session?.user?.name ?? "Staff";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const links = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
        />
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen p-3 md:p-5">
      <div className="pos-frame flex min-h-[calc(100vh-1.5rem)] md:min-h-[calc(100vh-2.5rem)]">
        <aside className="hidden w-[230px] shrink-0 flex-col px-4 py-6 lg:flex">
          <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2 text-lg font-semibold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Watch className="size-4" />
            </span>
            Watch POS
          </Link>
          <div className="flex-1">{links}</div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-3 flex items-center gap-3 px-2">
              <Avatar className="size-9">
                <AvatarFallback className="bg-muted text-xs text-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs capitalize text-muted-foreground">{role}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/70"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 px-4 pt-4 lg:hidden">
            <Sheet>
              <SheetTrigger className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm" aria-label="Open menu">
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-background">
                <div className="mb-6 flex items-center gap-2 font-semibold text-foreground">
                  <Watch className="size-5 text-primary" />
                  Watch POS
                </div>
                {links}
              </SheetContent>
            </Sheet>
            <span className="font-semibold">Watch POS</span>
          </div>
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 bg-transparent px-4 py-6 text-foreground md:px-6">{children}</main>
            <RightRail />
          </div>
        </div>
      </div>
    </div>
  );
}
