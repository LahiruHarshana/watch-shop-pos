"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Phone, Ticket, User, Watch, Wrench } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseLkrInput } from "@/lib/money/format";
import { customerNameError } from "@/lib/repairs/customer-name";
import { estimatedCostInputError } from "@/lib/repairs/estimated-cost";
import { phoneError } from "@/lib/repairs/phone";
import { watchTextError } from "@/lib/repairs/watch-text";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fieldClass =
  "min-h-11 rounded-xl border border-border bg-white text-foreground shadow-sm placeholder:text-muted-foreground/70";

export function RepairForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [costError, setCostError] = useState<string | null>(null);
  const [phoneFieldError, setPhoneFieldError] = useState<string | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    watchBrand: "",
    watchModel: "",
    issueDescription: "",
    estimatedCost: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const invalidName = customerNameError(form.customerName);
    if (invalidName) {
      setNameError(invalidName);
      toast.error(invalidName);
      return;
    }
    const invalidPhone = phoneError(form.customerPhone);
    if (invalidPhone) {
      setPhoneFieldError(invalidPhone);
      toast.error(invalidPhone);
      return;
    }
    const invalidBrand = watchTextError(form.watchBrand, "watch brand");
    if (invalidBrand) {
      setBrandError(invalidBrand);
      toast.error(invalidBrand);
      return;
    }
    const invalidModel = watchTextError(form.watchModel, "model");
    if (invalidModel) {
      setModelError(invalidModel);
      toast.error(invalidModel);
      return;
    }
    const invalidCost = estimatedCostInputError(form.estimatedCost);
    if (invalidCost) {
      setCostError(invalidCost);
      toast.error(invalidCost);
      return;
    }
    setNameError(null);
    setPhoneFieldError(null);
    setBrandError(null);
    setModelError(null);
    setCostError(null);
    setLoading(true);
    const res = await fetch("/api/repairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        estimatedCostCents: parseLkrInput(form.estimatedCost),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Failed to create ticket");
      return;
    }
    toast.success(`Ticket ${json.data.ticketId} created`);
    router.push(`/repairs/${json.data._id}/token`);
  }

  return (
    <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <section className="pos-surface p-5 sm:p-6">
          <SectionHeading
            icon={User}
            title="Customer"
            description="Who is leaving the watch."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name" icon={User}>
              <Input
                required
                autoFocus
                autoComplete="name"
                aria-invalid={nameError ? true : undefined}
                placeholder="e.g. Nimal Perera"
                className={fieldClass}
                value={form.customerName}
                onChange={(e) => {
                  set("customerName", e.target.value);
                  if (nameError) setNameError(customerNameError(e.target.value));
                }}
              />
              {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}
            </Field>
            <Field label="Phone" icon={Phone}>
              <Input
                required
                type="tel"
                autoComplete="tel"
                aria-invalid={phoneFieldError ? true : undefined}
                placeholder="07X XXX XXXX"
                className={fieldClass}
                value={form.customerPhone}
                onChange={(e) => {
                  set("customerPhone", e.target.value);
                  if (phoneFieldError) setPhoneFieldError(phoneError(e.target.value));
                }}
              />
              {phoneFieldError ? <p className="text-sm text-destructive">{phoneFieldError}</p> : null}
            </Field>
          </div>
        </section>

        <section className="pos-surface p-5 sm:p-6">
          <SectionHeading
            icon={Watch}
            title="Watch and job"
            description="What came in, and the estimate you quote."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Watch brand" icon={Watch}>
              <Input
                required
                maxLength={40}
                aria-invalid={brandError ? true : undefined}
                placeholder="e.g. Seiko"
                className={fieldClass}
                value={form.watchBrand}
                onChange={(e) => {
                  set("watchBrand", e.target.value);
                  if (brandError) setBrandError(watchTextError(e.target.value, "watch brand"));
                }}
              />
              {brandError ? <p className="text-sm text-destructive">{brandError}</p> : null}
            </Field>
            <Field label="Model" icon={Watch}>
              <Input
                required
                maxLength={40}
                aria-invalid={modelError ? true : undefined}
                placeholder="e.g. Presage"
                className={fieldClass}
                value={form.watchModel}
                onChange={(e) => {
                  set("watchModel", e.target.value);
                  if (modelError) setModelError(watchTextError(e.target.value, "model"));
                }}
              />
              {modelError ? <p className="text-sm text-destructive">{modelError}</p> : null}
            </Field>
            <Field label="Issue description" icon={Wrench} className="sm:col-span-2">
              <Textarea
                required
                rows={4}
                placeholder="What the customer reported — stopped, loose crown, battery, crystal…"
                className={cn(fieldClass, "min-h-28 py-3")}
                value={form.issueDescription}
                onChange={(e) => set("issueDescription", e.target.value)}
              />
            </Field>
            <Field label="Estimated cost (LKR)" icon={Banknote} className="sm:col-span-2">
              <Input
                required
                inputMode="decimal"
                aria-invalid={costError ? true : undefined}
                placeholder="2500"
                className={cn(fieldClass, "max-w-xs")}
                value={form.estimatedCost}
                onChange={(e) => {
                  set("estimatedCost", e.target.value);
                  if (costError) setCostError(estimatedCostInputError(e.target.value));
                }}
              />
              {costError ? <p className="text-sm text-destructive">{costError}</p> : null}
            </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/repairs"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-11 rounded-xl bg-white")}
          >
            Cancel
          </Link>
          <Button type="submit" className="min-h-11 rounded-xl px-6 font-semibold" disabled={loading}>
            {loading ? "Saving…" : "Create ticket"}
          </Button>
        </div>
      </div>

      <aside className="pos-ink p-5 lg:sticky lg:top-24">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#f6f1ea] text-[#141218]">
          <Ticket className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-2xl text-[#f6f1ea]">Claim token</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          After you save, a ticket number and claim slip are ready to print for the customer.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-white/75">
          <li>Customer name and phone go on the slip.</li>
          <li>Brand, model, and the quoted estimate print with the job.</li>
          <li>The ticket starts on the repair board as received.</li>
        </ul>
      </aside>
    </form>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof User;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon?: typeof User;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium text-foreground">
        {Icon && <Icon className="size-3.5 text-muted-foreground" aria-hidden />}
        {label}
      </Label>
      {children}
    </div>
  );
}
