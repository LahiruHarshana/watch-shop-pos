import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateSaleTotals } from "./calculate-sale";

describe("calculateSaleTotals", () => {
  it("applies a flat line discount and a percent cart discount", () => {
    const totals = calculateSaleTotals(
      [
        { unitPriceCents: 10000, quantity: 2, lineDiscount: { type: "flat", value: 1000 } },
        { unitPriceCents: 5000, quantity: 1 },
      ],
      { type: "percent", value: 10 },
    );
    assert.equal(totals.subtotalCents, 24000);
    assert.equal(totals.lineDiscountCents, 1000);
    assert.equal(totals.cartDiscountCents, 2400);
    assert.equal(totals.totalCents, 21600);
  });
});
