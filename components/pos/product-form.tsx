"use client";

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

export type ProductFormValues = {
  name: string;
  sku: string;
  categoryId: string;
  price: string;
  quantity: string;
  lowStockThreshold: string;
  brand: string;
  batterySize: string;
  isActive: boolean;
};

type Category = { _id: string; name: string };

const inputClass =
  "min-h-11 rounded-xl border border-border bg-white shadow-sm placeholder:text-muted-foreground/70";

export function ProductForm({
  categories,
  values,
  onChange,
  onSubmit,
  submitLabel,
  disabled,
  onCancel,
  cancelLabel = "Cancel",
  lockQuantity = false,
}: {
  categories: Category[];
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  disabled?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
  lockQuantity?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormSection title="Product details" description="What customers see at checkout.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" hint="Display name on receipts and search." className="sm:col-span-2">
            <Input
              className={inputClass}
              placeholder="e.g. Classic Men's Dress Watch"
              value={values.name}
              onChange={(e) => onChange({ ...values, name: e.target.value })}
              required
              autoFocus
            />
          </Field>
          <Field label="SKU" hint="Unique stock code (saved uppercase).">
            <Input
              className={cn(inputClass, "font-mono text-sm uppercase")}
              placeholder="WCH-M-CLASSIC"
              value={values.sku}
              onChange={(e) => onChange({ ...values, sku: e.target.value })}
              required
            />
          </Field>
          <Field label="Category">
            <Select
              value={values.categoryId || undefined}
              onValueChange={(v) => v && onChange({ ...values, categoryId: v })}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Pricing & stock" description="Shelf price and how many you have now.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (LKR)" hint="Retail price before discounts.">
            <Input
              className={inputClass}
              inputMode="decimal"
              placeholder="12500.00"
              value={values.price}
              onChange={(e) => onChange({ ...values, price: e.target.value })}
              required
            />
          </Field>
          {lockQuantity ? (
            <Field label="Quantity on hand" hint="Change stock from Stock adjustments so every movement is logged.">
              <Input className={inputClass} value={values.quantity} readOnly />
            </Field>
          ) : (
            <Field label="Opening quantity" hint="Logged as an opening-stock adjustment.">
              <Input
                className={inputClass}
                inputMode="numeric"
                placeholder="0"
                value={values.quantity}
                onChange={(e) => onChange({ ...values, quantity: e.target.value })}
              />
            </Field>
          )}
          <Field label="Low stock alert" hint="Warn when stock falls to this level or below." className="sm:col-span-2">
            <Input
              className={cn(inputClass, "max-w-[140px]")}
              inputMode="numeric"
              value={values.lowStockThreshold}
              onChange={(e) => onChange({ ...values, lowStockThreshold: e.target.value })}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Attributes" description="Brand and battery size help staff find the right item.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand" hint="Optional. Used by inventory filters.">
            <Input
              className={inputClass}
              placeholder="e.g. Premier"
              value={values.brand}
              onChange={(e) => onChange({ ...values, brand: e.target.value })}
            />
          </Field>
          <Field label="Battery size" hint="For batteries, e.g. CR2032.">
            <Input
              className={inputClass}
              placeholder="CR2032"
              value={values.batterySize}
              onChange={(e) => onChange({ ...values, batterySize: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => onChange({ ...values, isActive: e.target.checked })}
            />
            Active in catalog
          </label>
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          disabled={disabled || !values.categoryId}
          className="h-10 w-full rounded-xl font-semibold sm:w-auto sm:min-w-[180px]"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pos-surface p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}
