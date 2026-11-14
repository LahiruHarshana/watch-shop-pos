import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeExpenseDays, summarizeExpenses } from "./summary";

describe("summarizeExpenses", () => {
  it("groups cents by category and picks the highest spend", () => {
    const summary = summarizeExpenses("2026-11-14", [
      { amountCents: 15000, categoryId: "food", categoryName: "Food" },
      { amountCents: 5000, categoryId: "food", categoryName: "Food" },
      { amountCents: 40000, categoryId: "rent", categoryName: "Rent" },
    ]);
    assert.equal(summary.date, "2026-11-14");
    assert.equal(summary.totalCents, 60000);
    assert.equal(summary.count, 3);
    assert.deepEqual(
      summary.categories.map((category) => [category.name, category.amountCents, category.count]),
      [
        ["Rent", 40000, 1],
        ["Food", 20000, 2],
      ],
    );
    assert.equal(summary.topCategory?.name, "Rent");
  });

  it("returns an empty day when nothing was spent", () => {
    const summary = summarizeExpenses("2026-11-14", []);
    assert.equal(summary.totalCents, 0);
    assert.equal(summary.count, 0);
    assert.equal(summary.topCategory, null);
  });

  it("splits a window into one summary per business day", () => {
    const days = summarizeExpenseDays(
      ["2026-11-13", "2026-11-14"],
      [
        { amountCents: 1000, spentOn: "2026-11-13", categoryId: "bus", categoryName: "Transportation" },
        { amountCents: 2500, spentOn: "2026-11-14", categoryId: "food", categoryName: "Food" },
        { amountCents: 2500, spentOn: "2026-11-14", categoryId: "food", categoryName: "Food" },
      ],
    );
    assert.equal(days[0]?.totalCents, 1000);
    assert.equal(days[0]?.count, 1);
    assert.equal(days[1]?.totalCents, 5000);
    assert.equal(days[1]?.categories[0]?.count, 2);
  });
});
