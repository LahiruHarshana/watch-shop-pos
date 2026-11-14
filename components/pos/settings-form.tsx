"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  FileText,
  ImageIcon,
  MapPin,
  Phone,
  Receipt,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readResponseJson } from "@/lib/api/read-response-json";
import { phoneError } from "@/lib/repairs/phone";
import { shopAddressError, shopEmailError, shopNameError } from "@/lib/settings/shop-profile";
import { toast } from "sonner";

type SettingsData = {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  receiptThankYouNote: string;
  repairTermsAndConditions: string;
  receiptPaperWidth: string;
};

const empty: SettingsData = {
  shopName: "",
  address: "",
  phone: "",
  email: "",
  logoUrl: "",
  receiptThankYouNote: "",
  repairTermsAndConditions: "",
  receiptPaperWidth: "80mm",
};

export function SettingsForm() {
  const [form, setForm] = useState<SettingsData>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ shopName?: string; address?: string; phone?: string; email?: string }>({});
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion === true;

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setForm({
            shopName: j.data.shopName ?? "",
            address: j.data.address ?? "",
            phone: j.data.phone ?? "",
            email: j.data.email ?? "",
            logoUrl: j.data.logoUrl ?? "",
            receiptThankYouNote: j.data.receiptThankYouNote ?? "",
            repairTermsAndConditions: j.data.repairTermsAndConditions ?? "",
            receiptPaperWidth: j.data.receiptPaperWidth ?? "80mm",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = {
      shopName: shopNameError(form.shopName) ?? undefined,
      address: shopAddressError(form.address) ?? undefined,
      phone: phoneError(form.phone) ?? undefined,
      email: shopEmailError(form.email) ?? undefined,
    };
    const message = nextErrors.shopName || nextErrors.address || nextErrors.phone || nextErrors.email;
    if (message) {
      setErrors(nextErrors);
      toast.error(message);
      return;
    }
    setErrors({});
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await readResponseJson(res);
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Failed to save");
      return;
    }
    const saved = json.data as Partial<SettingsData> | undefined;
    if (saved) {
      setForm((current) => ({
        ...current,
        shopName: saved.shopName ?? current.shopName,
        address: saved.address ?? current.address,
        phone: saved.phone ?? current.phone,
        email: saved.email ?? current.email,
      }));
    }
    toast.success("Settings saved");
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/uploads/image", { method: "POST", body: fd });
    const json = await up.json();
    if (!up.ok) {
      toast.error(json.error?.message ?? "Upload failed");
      return;
    }
    const patch = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: json.data.url, logoCloudinaryId: json.data.publicId }),
    });
    if (patch.ok) {
      setForm((f) => ({ ...f, logoUrl: json.data.url }));
      toast.success("Logo updated");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/70" />
        <div className="h-96 animate-pulse rounded-[1.35rem] bg-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={instant ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pos-surface px-5 py-5"
      >
        <p className="mb-1 text-xs font-medium text-primary">Admin · configuration</p>
        <h1 className="text-4xl md:text-5xl">Shop settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Branding, receipts, and repair terms shown to customers.
        </p>
      </motion.header>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-5">
        <motion.div
          initial={instant ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6 lg:col-span-3"
        >
          <SettingsSection
            icon={Store}
            title="Shop profile"
            description="Name and contact details on receipts"
          >
            <Field icon={Building2} label="Shop name" error={errors.shopName}>
              <Input
                className="rounded-xl bg-white"
                value={form.shopName}
                aria-invalid={errors.shopName ? true : undefined}
                onChange={(e) => {
                  setForm({ ...form, shopName: e.target.value });
                  if (errors.shopName) setErrors((current) => ({ ...current, shopName: shopNameError(e.target.value) ?? undefined }));
                }}
              />
            </Field>
            <Field icon={MapPin} label="Address" error={errors.address}>
              <Input
                className="rounded-xl bg-white"
                value={form.address}
                aria-invalid={errors.address ? true : undefined}
                onChange={(e) => {
                  setForm({ ...form, address: e.target.value });
                  if (errors.address) setErrors((current) => ({ ...current, address: shopAddressError(e.target.value) ?? undefined }));
                }}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field icon={Phone} label="Phone" error={errors.phone}>
                <Input
                  className="rounded-xl bg-white"
                  value={form.phone}
                  aria-invalid={errors.phone ? true : undefined}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    if (errors.phone) setErrors((current) => ({ ...current, phone: phoneError(e.target.value) ?? undefined }));
                  }}
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <Input
                  type="email"
                  className="rounded-xl bg-white"
                  value={form.email}
                  aria-invalid={errors.email ? true : undefined}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (errors.email) setErrors((current) => ({ ...current, email: shopEmailError(e.target.value) ?? undefined }));
                  }}
                />
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Receipt}
            title="Receipts & repairs"
            description="Printed and claim-token copy"
          >
            <Field label="Receipt thank-you note">
              <Textarea
                className="min-h-[88px] rounded-xl bg-white"
                value={form.receiptThankYouNote}
                onChange={(e) => setForm({ ...form, receiptThankYouNote: e.target.value })}
              />
            </Field>
            <Field icon={FileText} label="Repair terms & conditions">
              <Textarea
                rows={5}
                className="rounded-xl bg-white"
                value={form.repairTermsAndConditions}
                onChange={(e) => setForm({ ...form, repairTermsAndConditions: e.target.value })}
              />
            </Field>
            <Field label="Receipt paper width">
              <Select
                value={form.receiptPaperWidth}
                onValueChange={(v) => v && setForm({ ...form, receiptPaperWidth: v })}
              >
                <SelectTrigger className="rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (compact)</SelectItem>
                  <SelectItem value="80mm">80mm (standard)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </SettingsSection>

          <Button
            type="submit"
            disabled={saving}
            className="h-10 w-full rounded-xl font-semibold sm:w-auto sm:px-10"
          >
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </motion.div>

        <motion.aside
          initial={instant ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="lg:col-span-2"
        >
          <div className="sticky top-28 overflow-hidden rounded-[1.35rem] border border-border/80 bg-card shadow-[0_16px_40px_rgb(120_140_180/0.1)]">
            <div className="border-b border-border/60 bg-gradient-to-r from-violet-500/10 to-transparent px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ImageIcon className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-semibold tracking-tight">Brand logo</h2>
                  <p className="text-xs text-muted-foreground">Shown on receipts when set</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-4">
                {form.logoUrl ? (
                  <Image
                    src={form.logoUrl}
                    alt="Shop logo"
                    width={160}
                    height={80}
                    className="max-h-20 w-auto object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    <Store className="mx-auto mb-2 size-8 opacity-40" aria-hidden />
                    No logo uploaded
                  </div>
                )}
              </div>
              <Label className="cursor-pointer">
                <span className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium transition-colors hover:bg-muted/50">
                  Choose image file
                </span>
                <Input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={uploadLogo}
                />
              </Label>
              <div className="rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Preview on receipt</p>
                <p className="mt-2 font-semibold">{form.shopName || "Your shop name"}</p>
                <p className="mt-1">{form.address || "Address line"}</p>
                <p>{form.phone || "Phone"}</p>
                <p className="mt-3 border-t border-border/60 pt-3 italic">
                  {form.receiptThankYouNote || "Thank-you note…"}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      </form>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Store;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-border/80 bg-card shadow-[0_12px_32px_rgb(120_140_180/0.08)]">
      <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent px-6 py-4">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4 p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon?: typeof Building2;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-muted-foreground">
        {Icon && <Icon className="size-3.5" aria-hidden />}
        {label}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
