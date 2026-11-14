"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { categoryNameError, categorySlugError, sortOrderError } from "@/lib/categories/validate";
import { toast } from "sonner";

type Category = {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
};

const empty = { name: "", slug: "", parentId: "", sortOrder: "0" };

export function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = categories.find((category) => category._id === selectedId) ?? categories[0] ?? null;

  function load() {
    fetch("/api/categories?all=true")
      .then((res) => res.json())
      .then((json) => setCategories(json.data ?? []));
  }

  useEffect(() => {
    let ignore = false;
    fetch("/api/categories?all=true")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) setCategories(json.data ?? []);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    const invalid =
      categoryNameError(form.name) ||
      (form.slug.trim() ? categorySlugError(form.slug) : null) ||
      sortOrderError(form.sortOrder);
    if (invalid) {
      setFormError(invalid);
      setForm(empty);
      toast.error(invalid);
      return;
    }
    setFormError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug.trim() || undefined,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder) || 0,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const message = json.error?.message ?? "Could not create category";
      setFormError(message);
      setForm(empty);
      toast.error(message);
      return;
    }
    setForm(empty);
    toast.success("Category created");
    load();
  }

  async function save(category: Category, patch: Partial<Category>) {
    const res = await fetch(`/api/categories/${category._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error?.message ?? "Could not update category");
      return;
    }
    toast.success("Category updated");
    load();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="pos-surface p-3">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Categories</p>
        <div className="flex flex-col gap-1">
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => setSelectedId(category._id)}
              className={`rounded-xl px-3 py-2 text-left text-sm ${selected?._id === category._id ? "bg-brand-soft text-brand" : "hover:bg-surface-muted"}`}
            >
              <span className="block break-words font-medium">{category.name}</span>
              <span className="text-xs text-muted-foreground">{category.isActive ? "Active" : "Inactive"}</span>
            </button>
          ))}
          {categories.length === 0 && <p className="px-2 py-6 text-sm text-muted-foreground">No categories yet.</p>}
        </div>
      </aside>
      <div className="space-y-4">
        <header>
          <h1 className="text-4xl md:text-5xl">Categories</h1>
          <p className="text-sm text-muted-foreground">Deactivate a category instead of deleting it. Products keep their assignment.</p>
        </header>
        <form onSubmit={createCategory} className="pos-surface grid gap-3 p-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Name</span>
            <input
              className="h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={form.name}
              aria-invalid={formError ? true : undefined}
              maxLength={40}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (formError) setFormError(null);
              }}
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Slug</span>
            <input className="h-10 w-full rounded-xl border border-border px-3 text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Optional" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Parent</span>
            <select className="h-10 w-full rounded-xl border border-border px-3 text-sm" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">No parent</option>
              {categories.filter((c) => c.isActive).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Sort order</span>
            <input className="h-10 w-full rounded-xl border border-border px-3 text-sm" inputMode="numeric" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          </label>
          {formError ? <p className="text-sm text-destructive sm:col-span-2">{formError}</p> : null}
          <Button type="submit" className="h-10 rounded-xl sm:col-span-2">Add category</Button>
        </form>
        {selected && (
          <section className="pos-raised space-y-3 p-4">
            <h2 className="text-sm font-semibold">Selected category</h2>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Name</span>
              <input
                key={selected._id}
                className="h-10 w-full rounded-xl border border-border px-3 text-sm"
                defaultValue={selected.name}
                onBlur={(e) => e.target.value !== selected.name && save(selected, { name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Parent</span>
              <select
                key={`${selected._id}-parent`}
                className="h-10 w-full rounded-xl border border-border px-3 text-sm"
                defaultValue={selected.parentId ? String(selected.parentId) : ""}
                onChange={(e) => save(selected, { parentId: e.target.value || null })}
              >
                <option value="">No parent</option>
                {categories.filter((c) => c._id !== selected._id).map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => {
                if (selected.isActive && !window.confirm(`Deactivate ${selected.name}? Products that use it will stay assigned.`)) return;
                save(selected, { isActive: !selected.isActive });
              }}
            >
              {selected.isActive ? "Deactivate" : "Activate"}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
