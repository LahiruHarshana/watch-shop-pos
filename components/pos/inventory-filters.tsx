"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type InventoryFilterState = {
  q: string;
  category: string;
  stock: string;
  brand: string;
  priceMinLkr: string;
  priceMaxLkr: string;
  trackInventory: string;
  includeInactive: boolean;
  sort: string;
};

type Category = { _id: string; name: string; slug: string };

const stockOptions = [
  { value: "all", label: "All stock" },
  { value: "in_stock", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

const sortOptions = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "price_asc", label: "Price low–high" },
  { value: "price_desc", label: "Price high–low" },
  { value: "stock_asc", label: "Stock low–high" },
  { value: "stock_desc", label: "Stock high–low" },
  { value: "updated_desc", label: "Recently updated" },
];

export function InventoryFilters({
  value,
  categories,
  brands,
  isAdmin,
  open,
  onOpenChange,
  onChange,
  onClear,
}: {
  value: InventoryFilterState;
  categories: Category[];
  brands: string[];
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<InventoryFilterState>) => void;
  onClear: () => void;
}) {
  const chips = activeChips(value, categories);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-xl bg-white pl-9"
            placeholder="Search name or SKU…"
            value={value.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <Select
          value={value.category || "all"}
          onValueChange={(v) => onChange({ category: !v || v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-full rounded-xl bg-white lg:w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c._id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={value.sort} onValueChange={(v) => v && onChange({ sort: v })}>
          <SelectTrigger className="w-full rounded-xl bg-white lg:w-[180px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={open ? "default" : "outline"}
          className="rounded-xl"
          onClick={() => onOpenChange(!open)}
        >
          <SlidersHorizontal className="mr-1.5 size-4" />
          Filters
          {chips.length > 0 && (
            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{chips.length}</span>
          )}
        </Button>
      </div>

      {open && (
        <div className="grid gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Stock</Label>
            <Select value={value.stock || "all"} onValueChange={(v) => v && onChange({ stock: v })}>
              <SelectTrigger className="rounded-xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stockOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Brand</Label>
            <Select
              value={value.brand || "all"}
              onValueChange={(v) => onChange({ brand: !v || v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-xl bg-white">
                <SelectValue placeholder="Any brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any brand</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Min price (LKR)</Label>
            <Input
              className="rounded-xl bg-white"
              inputMode="decimal"
              value={value.priceMinLkr}
              onChange={(e) => onChange({ priceMinLkr: e.target.value })}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max price (LKR)</Label>
            <Input
              className="rounded-xl bg-white"
              inputMode="decimal"
              value={value.priceMaxLkr}
              onChange={(e) => onChange({ priceMaxLkr: e.target.value })}
              placeholder="Any"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Inventory tracking</Label>
            <Select
              value={value.trackInventory || "all"}
              onValueChange={(v) => onChange({ trackInventory: !v || v === "all" ? "" : v })}
            >
              <SelectTrigger className="rounded-xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Tracked</SelectItem>
                <SelectItem value="false">Not tracked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <label className="flex items-center gap-2 self-end rounded-xl border border-border bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={value.includeInactive}
                onChange={(e) => onChange({ includeInactive: e.target.checked })}
              />
              Include inactive
            </label>
          )}
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange(chip.clear)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary",
              )}
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
          <button type="button" onClick={onClear} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function activeChips(value: InventoryFilterState, categories: Category[]) {
  const chips: { key: string; label: string; clear: Partial<InventoryFilterState> }[] = [];
  if (value.stock && value.stock !== "all") {
    const label = stockOptions.find((s) => s.value === value.stock)?.label ?? value.stock;
    chips.push({ key: "stock", label, clear: { stock: "all" } });
  }
  if (value.brand) chips.push({ key: "brand", label: `Brand: ${value.brand}`, clear: { brand: "" } });
  if (value.priceMinLkr || value.priceMaxLkr) {
    chips.push({
      key: "price",
      label: `LKR ${value.priceMinLkr || "0"}–${value.priceMaxLkr || "∞"}`,
      clear: { priceMinLkr: "", priceMaxLkr: "" },
    });
  }
  if (value.trackInventory === "true") {
    chips.push({ key: "track", label: "Tracked", clear: { trackInventory: "" } });
  }
  if (value.trackInventory === "false") {
    chips.push({ key: "track", label: "Not tracked", clear: { trackInventory: "" } });
  }
  if (value.includeInactive) {
    chips.push({ key: "inactive", label: "Including inactive", clear: { includeInactive: false } });
  }
  if (value.category) {
    const name = categories.find((c) => c.slug === value.category)?.name ?? value.category;
    chips.push({ key: "cat", label: name, clear: { category: "" } });
  }
  return chips;
}
