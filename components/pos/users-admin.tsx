"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Shield,
  User,
  UserCircle,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PaginationMeta } from "@/lib/api/pagination";
import { DataPagination } from "@/components/ui/data-pagination";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserRow = { _id: string; name: string; email: string; role: string; isActive: boolean };

const inputClass =
  "min-h-11 rounded-xl border border-border bg-white shadow-sm placeholder:text-muted-foreground/70";

const roleOptions = [
  {
    value: "cashier",
    label: "Cashier",
    description: "Checkout, repairs, view inventory",
    icon: UserCircle,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Full access including settings & staff",
    icon: Shield,
  },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UsersAdmin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState({ adminCount: 0, cashierCount: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cashier" });
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "cashier", password: "", isActive: true });
  const [savingEdit, setSavingEdit] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/users?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((j) => {
        setUsers(j.data ?? []);
        setPagination(j.pagination ?? null);
        setSummary(j.summary ?? { adminCount: 0, cashierCount: 0 });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const adminCount = summary.adminCount;
  const cashierCount = summary.cashierCount;

  async function saveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    const body: Record<string, unknown> = {
      name: editForm.name,
      role: editForm.role,
      isActive: editForm.isActive,
    };
    if (editForm.password.trim()) body.password = editForm.password;
    const res = await fetch(`/api/users/${editing._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSavingEdit(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Update failed");
      return;
    }
    toast.success("Staff updated");
    setEditing(null);
    load();
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Failed");
      return;
    }
    toast.success("User created");
    setForm({ name: "", email: "", password: "", role: "cashier" });
    load();
  }

  function clearForm() {
    setForm({ name: "", email: "", password: "", role: "cashier" });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Team logins for the shop floor and back office.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-xl bg-muted px-3 py-1.5">
            <strong>{pagination?.total ?? users.length}</strong> total
          </span>
          <span className="rounded-xl bg-primary/10 px-3 py-1.5 text-primary">
            <strong>{adminCount}</strong> admins
          </span>
          <span className="rounded-xl bg-muted px-3 py-1.5">
            <strong>{cashierCount}</strong> cashiers
          </span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <Users className="size-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold">Team members</h2>
            </div>
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">No staff yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {users.map((u) => (
                  <StaffRow
                    key={u._id}
                    user={u}
                    onEdit={() => {
                      setEditing(u);
                      setEditForm({ name: u.name, role: u.role, password: "", isActive: u.isActive });
                    }}
                  />
                ))}
              </ul>
            )}
            <DataPagination pagination={pagination} onPageChange={setPage} disabled={loading} />
          </div>
        </section>

        <aside className="lg:col-span-2">
          <form
            onSubmit={createUser}
            className="sticky top-28 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_12px_32px_rgb(120_140_180/0.08)]"
          >
            <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-primary/8 to-transparent px-5 py-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <UserPlus className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold">Add staff</h2>
                <p className="text-xs text-muted-foreground">Creates a new login</p>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <FormSection title="Account" description="Name and email for sign-in.">
                <div className="space-y-4">
                  <Field label="Full name" hint="Shown in the app and on receipts.">
                    <Input
                      className={inputClass}
                      placeholder="e.g. Front Counter"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Email" hint="Used as the username at login.">
                    <Input
                      type="email"
                      className={inputClass}
                      placeholder="cashier@shop.local"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Password" hint="Minimum 8 characters recommended.">
                    <Input
                      type="password"
                      className={inputClass}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      autoComplete="new-password"
                      minLength={8}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Role" description="What this person can do in the POS.">
                <div className="grid gap-2">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = form.role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, role: opt.value })}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                          active
                            ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                            : "border-border bg-white hover:border-primary/30",
                        )}
                      >
                        <Icon
                          className={cn(
                            "mt-0.5 size-5 shrink-0",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                          aria-hidden
                        />
                        <div>
                          <p className="font-semibold text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Preview
                </p>
                <p className="mt-1 font-medium">{form.name.trim() || "New team member"}</p>
                <p className="text-xs text-muted-foreground">{form.email || "email@shop.local"}</p>
                <Badge className="mt-2 capitalize" variant="secondary">
                  {form.role}
                </Badge>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4">
                <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={clearForm}>
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="min-h-11 rounded-xl bg-gradient-to-r from-primary to-violet-500 font-semibold shadow-[0_8px_20px_rgb(91_92_246/0.28)] hover:brightness-110"
                >
                  {submitting ? "Creating…" : "Create user"}
                </Button>
              </div>
            </div>
          </form>
        </aside>
      </div>

      <Dialog open={editing != null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit staff</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Field label="Name">
                <Input
                  className={inputClass}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </Field>
              <Field label="Role">
                <select
                  className={cn(inputClass, "w-full px-3")}
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <Field label="New password" hint="Leave blank to keep the current password.">
                <Input
                  type="password"
                  className={inputClass}
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  autoComplete="new-password"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
                Active login
              </label>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={savingEdit} onClick={saveEdit}>
              {savingEdit ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
    <section className="rounded-xl border border-border/50 bg-muted/15 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
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
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StaffRow({ user, onEdit }: { user: UserRow; onEdit: () => void }) {
  const isAdmin = user.role === "admin";
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:px-5">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
          isAdmin ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        {initials(user.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{user.name}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="size-3 shrink-0" aria-hidden />
          {user.email}
        </p>
      </div>
      <Badge
        variant="secondary"
        className={cn(
          "rounded-full capitalize",
          isAdmin && "bg-primary/15 text-primary",
        )}
      >
        {isAdmin ? <Shield className="mr-1 size-3" /> : <User className="mr-1 size-3" />}
        {user.role}
      </Badge>
      {!user.isActive && (
        <Badge variant="outline" className="rounded-full">
          Inactive
        </Badge>
      )}
      <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onEdit}>
        Edit
      </Button>
    </li>
  );
}
