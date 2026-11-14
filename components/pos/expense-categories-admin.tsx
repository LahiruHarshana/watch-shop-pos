"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryNameError } from "@/lib/categories/validate";

type Category = {
  _id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  keywords: string[];
};

const empty = { name: "", keywords: "" };

export function ExpenseCategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(empty);

  function load() {
    fetch("/api/expense-categories?all=true")
      .then((res) => res.json())
      .then((json) => setCategories(json.data ?? []));
  }

  useEffect(() => {
    let ignore = false;
    fetch("/api/expense-categories?all=true")
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
    const invalid = categoryNameError(form.name);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    const nextOrder = categories.reduce((max, category) => Math.max(max, category.sortOrder), 0) + 1;
    const res = await fetch("/api/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        sortOrder: nextOrder,
        keywords: form.keywords.split(",").map((word) => word.trim()).filter(Boolean),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error?.message ?? "Could not create this type");
      return;
    }
    setForm(empty);
    toast.success("Type added");
    load();
  }

  async function patch(id: string, body: Record<string, unknown>, success: string) {
    const res = await fetch(`/api/expense-categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error?.message ?? "Could not update this type");
      return;
    }
    toast.success(success);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-primary">Expenses</p>
          <h1 className="text-4xl">Expense types</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            These names are the choices when you add an expense, and they group the dashboard chart.
          </p>
        </div>
        <Link href="/expenses" className="inline-flex h-11 items-center text-sm font-medium text-primary">
          Back to expenses
        </Link>
      </header>

      <form onSubmit={createCategory} className="pos-surface grid gap-3 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Name</span>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-11" required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Words that pick this type</span>
          <Input
            value={form.keywords}
            onChange={(event) => setForm({ ...form, keywords: event.target.value })}
            placeholder="bus, fuel"
            className="h-11"
            title="If the description contains one of these words, this type is selected for you."
          />
          <span className="mt-1 block text-xs text-muted-foreground">Example: bus, fuel. Separate words with commas.</span>
        </label>
        <Button type="submit" className="h-11">Add type</Button>
      </form>

      <ul className="pos-surface divide-y divide-border">
        {categories.map((category) => (
          <li key={category._id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {category.keywords.length ? category.keywords.join(", ") : "No suggestion words"}
                {" · "}
                {category.isActive ? "In use" : "Not in use"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Older expenses keep this name.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() =>
                patch(
                  category._id,
                  { isActive: !category.isActive },
                  category.isActive ? "Type is no longer offered" : "Type is in use again",
                )
              }
            >
              {category.isActive ? "Stop using" : "Use again"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
