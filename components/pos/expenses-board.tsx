"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Tags, Wallet } from "lucide-react";
import { toast } from "sonner";
import { ExpenseBreakdown } from "@/components/pos/expense-breakdown";
import { EmptyState } from "@/components/pos/design";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { suggestCategoryMatch } from "@/lib/expenses/suggest";
import { summarizeExpenses } from "@/lib/expenses/summary";
import { formatLkr, parseLkrInput } from "@/lib/money/format";
import { addBusinessDays, BUSINESS_TIME_ZONE, businessDayRange, businessWeekdayLabel } from "@/lib/time/business-day";
import { cn } from "@/lib/utils";

type Category = {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  keywords: string[];
};

type ExpenseRow = {
  id: string;
  amountCents: number;
  categoryId: string;
  categoryName: string;
  description: string;
  spentOn: string;
  note: string;
};

type DaySummary = {
  date: string;
  totalCents: number;
  count: number;
  categories: { categoryId: string; name: string; amountCents: number; count: number }[];
  topCategory: { name: string; amountCents: number } | null;
  days: { date: string; totalCents: number; count: number }[];
};

const emptyForm = { amount: "", description: "", categoryId: "", note: "" };

function friendlyDate(dateStr: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(businessDayRange(dateStr).start);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("weekday")}, ${value("day")} ${value("month")}`;
}

function dayNumber(dateStr: string) {
  return String(Number(dateStr.slice(8)));
}

export function ExpensesBoard({ initialDate, canDelete }: { initialDate: string; canDelete: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("date");
  const date = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : initialDate;
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [keptCategory, setKeptCategory] = useState<Category | null>(null);

  function showDay(next: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next) || next === date) return;
    setCategoryFilter("");
    const params = new URLSearchParams(searchParams.toString());
    if (next === initialDate) params.delete("date");
    else params.set("date", next);
    const query = params.toString();
    router.push(query ? `/expenses?${query}` : "/expenses");
  }

  async function load(nextDate = date) {
    const params = new URLSearchParams({ date: nextDate, limit: "100" });
    const [listRes, summaryRes, categoryRes] = await Promise.all([
      fetch(`/api/expenses?${params}`),
      fetch(`/api/expenses/summary?date=${initialDate}&days=7`),
      fetch("/api/expense-categories"),
    ]);
    const listJson = await listRes.json();
    const summaryJson = await summaryRes.json();
    const categoryJson = await categoryRes.json();
    setExpenses(listJson.data ?? []);
    setSummary(summaryJson.data ?? null);
    setCategories(categoryJson.data ?? []);
  }

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ date, limit: "100" });
    Promise.all([
      fetch(`/api/expenses?${params}`).then((res) => res.json()),
      fetch(`/api/expenses/summary?date=${initialDate}&days=7`).then((res) => res.json()),
      fetch("/api/expense-categories").then((res) => res.json()),
    ]).then(([listJson, summaryJson, categoryJson]) => {
      if (ignore) return;
      setExpenses(listJson.data ?? []);
      setSummary(summaryJson.data ?? null);
      setCategories(categoryJson.data ?? []);
    });
    return () => {
      ignore = true;
    };
  }, [date, initialDate]);

  const match = useMemo(
    () => suggestCategoryMatch(form.description, categories),
    [form.description, categories],
  );
  const matchedCategory = categories.find((category) => category._id === match?.categoryId);

  function onDescription(description: string) {
    const nextMatch = categoryTouched ? null : suggestCategoryMatch(description, categories);
    setForm((current) => ({
      ...current,
      description,
      categoryId: nextMatch?.categoryId ?? current.categoryId,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setEditingDay(null);
    setKeptCategory(null);
    setCategoryTouched(false);
    setShowNote(false);
  }

  async function saveExpense(event: React.FormEvent) {
    event.preventDefault();
    const amountCents = parseLkrInput(form.amount);
    if (amountCents < 1) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    if (!form.categoryId) {
      toast.error("Choose what type of expense this is.");
      return;
    }
    setSaving(true);
    const payload = {
      amountCents,
      categoryId: form.categoryId,
      description: form.description,
      spentOn: date,
      note: form.note,
    };
    const res = await fetch(editingId ? `/api/expenses/${editingId}` : "/api/expenses", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Could not save the expense");
      return;
    }
    toast.success(editingId ? "Expense updated" : "Expense saved");
    resetForm();
    await load();
  }

  async function removeExpense(id: string) {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error?.message ?? "Could not delete the expense");
      return;
    }
    if (editingId === id) resetForm();
    setPendingDeleteId(null);
    toast.success("Expense deleted");
    await load();
  }

  const typeChoices =
    keptCategory && !categories.some((category) => category._id === keptCategory._id)
      ? [...categories, keptCategory]
      : categories;
  const visible = categoryFilter ? expenses.filter((expense) => expense.categoryId === categoryFilter) : expenses;
  const selectedDay = summarizeExpenses(
    date,
    expenses.map((expense) => ({
      amountCents: expense.amountCents,
      categoryId: expense.categoryId,
      categoryName: expense.categoryName,
    })),
  );
  const spent = selectedDay.totalCents;
  const typeCount = selectedDay.categories.length;
  const dayLabel = friendlyDate(date);
  const moved = Boolean(editingId && editingDay && editingDay !== date);

  return (
    <div className="space-y-6">
      <header className="pos-surface flex flex-wrap items-end justify-between gap-4 px-5 py-5">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-medium text-primary">
            <Wallet className="size-3.5" aria-hidden />
            Money the shop spent
          </p>
          <h1 className="text-4xl md:text-5xl">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dayLabel}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Show this day</span>
            <span className="flex h-11 items-center gap-2 rounded-xl border bg-white px-3">
              <CalendarDays className="size-4 text-primary" aria-hidden />
              <Input
                type="date"
                value={date}
                onChange={(event) => showDay(event.target.value)}
                className="h-9 w-36 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
            </span>
          </label>
          <Button type="button" variant="outline" className="h-11" onClick={() => showDay(initialDate)} disabled={date === initialDate}>
            Today
          </Button>
          {canDelete && (
            <Link href="/expenses/categories" className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm font-medium">
              <Tags className="size-4" aria-hidden />
              Manage types
            </Link>
          )}
        </div>
      </header>

      {summary && summary.days.length > 0 && (
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Last 7 days</h2>
            <div className="flex gap-1">
              <Button type="button" variant="outline" className="h-11" onClick={() => showDay(addBusinessDays(date, -1))} aria-label="Previous day">
                <ChevronLeft className="size-4" aria-hidden />
                Previous
              </Button>
              <Button type="button" variant="outline" className="h-11" onClick={() => showDay(addBusinessDays(date, 1))} aria-label="Next day">
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            {summary.days.map((day) => {
              const selected = day.date === date;
              const isToday = day.date === initialDate;
              return (
                <button
                  key={day.date}
                  type="button"
                  title={friendlyDate(day.date)}
                  onClick={() => showDay(day.date)}
                  className={cn(
                    "min-h-11 min-w-[4.5rem] shrink-0 snap-start rounded-2xl border px-3 py-2 text-left",
                    selected ? "border-primary bg-primary/5" : "bg-white",
                  )}
                >
                  <span className="block text-[11px] text-muted-foreground">
                    {isToday ? "Today" : businessWeekdayLabel(day.date)}
                  </span>
                  <span className="block text-sm font-semibold">{dayNumber(day.date)}</span>
                  <span className="metric block text-xs text-muted-foreground">
                    {day.totalCents > 0 ? formatLkr(day.totalCents) : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <form onSubmit={saveExpense} className="pos-surface flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Wallet className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{editingId ? "Editing this expense" : "Add an expense"}</h2>
              <p className="text-sm text-muted-foreground">For {dayLabel}</p>
            </div>
          </div>
          {editingId && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-brand/5 px-3 py-2.5 text-sm">
              <span>{moved ? `This will move to ${dayLabel}.` : "You are changing a saved expense."}</span>
              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={resetForm}>Cancel</Button>
            </div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Amount</span>
            <span className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-white px-4 shadow-sm focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
              <span className="text-sm font-medium text-muted-foreground">LKR</span>
              <Input
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                inputMode="decimal"
                placeholder="0.00"
                aria-label="Amount (LKR)"
                className="metric h-12 border-0 bg-transparent p-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
                required
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">What you paid for</span>
            <Input
              value={form.description}
              onChange={(event) => onDescription(event.target.value)}
              placeholder="Bus fare, staff lunch, electricity bill"
              className="h-12 rounded-2xl border-border bg-white px-4 shadow-sm"
              required
            />
          </label>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Type</legend>
            <div className="flex flex-wrap gap-2">
              {typeChoices.map((category) => {
                const selected = form.categoryId === category._id;
                return (
                  <button
                    key={category._id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setCategoryTouched(true);
                      setForm({ ...form, categoryId: category._id });
                    }}
                    className={cn(
                      "min-h-10 rounded-full border px-3.5 text-sm transition-colors",
                      selected
                        ? "border-brand bg-brand font-medium text-white shadow-[0_8px_18px_rgb(61_53_196/0.22)]"
                        : "border-border bg-white text-foreground hover:border-brand/40",
                    )}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
            {match && matchedCategory && !categoryTouched && form.categoryId === match.categoryId && (
              <p className="mt-3 rounded-xl bg-[#f6f1ea] px-3 py-2 text-xs text-muted-foreground">
                Selected {matchedCategory.name} because you wrote “{match.keyword}”. Tap another type to change it.
              </p>
            )}
          </fieldset>
          <div className="flex flex-col gap-3 border-t border-border/70 pt-4">
            {showNote ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Note</span>
                <Input
                  value={form.note}
                  onChange={(event) => setForm({ ...form, note: event.target.value })}
                  placeholder="Optional detail"
                  className="h-12 rounded-2xl border-border bg-white px-4 shadow-sm"
                />
              </label>
            ) : (
              <button type="button" className="self-start text-sm font-medium text-brand" onClick={() => setShowNote(true)}>
                Add a note
              </button>
            )}
            <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={saving}>
              {saving ? "Saving…" : `Save for ${dayLabel}`}
            </Button>
          </div>
        </form>

        <section className="pos-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">What was spent</h2>
            {typeCount > 1 && (
              <select
                aria-label="Show one type"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 rounded-lg border bg-white px-2 text-sm"
              >
                <option value="">All types</option>
                {selectedDay.categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
                ))}
              </select>
            )}
          </div>

          {spent > 0 && !categoryFilter ? (
            <div className="mb-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-2xl bg-[#f6f1ea] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Spent</p>
                  <p className="metric mt-1 text-2xl font-semibold">{formatLkr(spent)}</p>
                </article>
                <article className="rounded-2xl bg-[#f6f1ea] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Number of expenses</p>
                  <p className="metric mt-1 text-2xl font-semibold">{selectedDay.count}</p>
                </article>
                <article className="rounded-2xl bg-[#f6f1ea] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Biggest type</p>
                  <p className="metric mt-1 text-2xl font-semibold">{selectedDay.topCategory?.name}</p>
                  {selectedDay.topCategory && (
                    <p className="mt-1 text-xs text-muted-foreground">{formatLkr(selectedDay.topCategory.amountCents)}</p>
                  )}
                </article>
              </div>
              <ExpenseBreakdown
                totalCents={spent}
                categories={selectedDay.categories.map((category) => ({
                  name: category.name,
                  amountCents: category.amountCents,
                }))}
              />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState title="Nothing was spent on this day" description="Add it with the form." />
          ) : null}

          <ul className="divide-y divide-border">
            {visible.map((expense) => (
              <li key={expense.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{expense.description}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{expense.categoryName}</span>
                    {expense.note ? <span>{expense.note}</span> : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="metric font-semibold">{formatLkr(expense.amountCents)}</span>
                  {pendingDeleteId === expense.id ? (
                    <>
                      <span className="text-sm">Delete this expense?</span>
                      <Button type="button" variant="destructive" size="sm" className="min-h-11" onClick={() => removeExpense(expense.id)}>
                        Delete
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setPendingDeleteId(null)}>
                        Keep
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-11"
                        onClick={() => {
                          setEditingId(expense.id);
                          setEditingDay(expense.spentOn);
                          setKeptCategory(
                            categories.some((category) => category._id === expense.categoryId)
                              ? null
                              : {
                                  _id: expense.categoryId,
                                  name: expense.categoryName,
                                  slug: "",
                                  isActive: false,
                                  keywords: [],
                                },
                          );
                          setCategoryTouched(true);
                          setShowNote(Boolean(expense.note));
                          setPendingDeleteId(null);
                          showDay(expense.spentOn);
                          setForm({
                            amount: (expense.amountCents / 100).toFixed(2),
                            description: expense.description,
                            categoryId: expense.categoryId,
                            note: expense.note,
                          });
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Edit
                      </Button>
                      {canDelete && (
                        <Button type="button" variant="destructive" size="sm" className="min-h-11" onClick={() => setPendingDeleteId(expense.id)}>
                          Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
