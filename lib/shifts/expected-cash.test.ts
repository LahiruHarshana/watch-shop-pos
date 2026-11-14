import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expectedCashFromEvents } from "./expected-cash";

const cash = (amountCents: number) => [{ method: "cash", amountCents }];
const card = (amountCents: number) => [{ method: "card", amountCents }];

describe("expectedCashFromEvents", () => {
  it("counts retail cash only", () => {
    assert.equal(
      expectedCashFromEvents({
        openingFloatCents: 1000,
        completedSales: [{ payments: cash(5000) }],
        voidedSales: [],
        repairPayments: [],
      }),
      6000,
    );
  });

  it("counts repair cash only", () => {
    assert.equal(
      expectedCashFromEvents({
        openingFloatCents: 0,
        completedSales: [],
        voidedSales: [],
        repairPayments: [{ method: "cash", amountCents: 2500 }],
      }),
      2500,
    );
  });

  it("adds retail and repair cash together", () => {
    assert.equal(
      expectedCashFromEvents({
        openingFloatCents: 500,
        completedSales: [{ payments: cash(1000) }, { payments: cash(2000) }],
        voidedSales: [],
        repairPayments: [{ method: "cash", amountCents: 700 }],
      }),
      4200,
    );
  });

  it("ignores card repair payments", () => {
    assert.equal(
      expectedCashFromEvents({
        openingFloatCents: 100,
        completedSales: [{ payments: card(9000) }],
        voidedSales: [],
        repairPayments: [{ method: "card", amountCents: 4000 }],
      }),
      100,
    );
  });

  it("subtracts a voided retail cash sale", () => {
    assert.equal(
      expectedCashFromEvents({
        openingFloatCents: 0,
        completedSales: [{ payments: cash(3000) }],
        voidedSales: [{ payments: cash(3000) }],
        repairPayments: [],
      }),
      0,
    );
  });

  it("combines several transactions in one shift", () => {
    assert.equal(
      expectedCashFromEvents({
        openingFloatCents: 2000,
        completedSales: [
          { payments: cash(1500) },
          { payments: card(8000) },
          { payments: cash(500) },
        ],
        voidedSales: [{ payments: cash(500) }],
        repairPayments: [
          { method: "cash", amountCents: 1200 },
          { method: "bank_transfer", amountCents: 9000 },
        ],
      }),
      4700,
    );
  });
});
