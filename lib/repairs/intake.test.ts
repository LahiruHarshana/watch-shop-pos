import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { customerNameError } from "./customer-name";
import { estimatedCostInputError } from "./estimated-cost";
import { issueDescriptionError } from "./issue-description";
import { phoneError } from "./phone";
import { watchTextError } from "./watch-text";

describe("repair intake validation", () => {
  it("rejects numbers and symbols in every field", () => {
    assert.ok(customerNameError("123"));
    assert.ok(phoneError("abc"));
    assert.ok(watchTextError("22", "watch brand"));
    assert.ok(watchTextError("@@@", "model"));
    assert.ok(issueDescriptionError("###"));
    assert.ok(estimatedCostInputError("-90"));
  });

  it("accepts a real intake", () => {
    assert.equal(customerNameError("Nimal Perera"), null);
    assert.equal(phoneError("0771234567"), null);
    assert.equal(watchTextError("Seiko", "watch brand"), null);
    assert.equal(watchTextError("Presage", "model"), null);
    assert.equal(issueDescriptionError("Stopped, loose crown"), null);
    assert.equal(estimatedCostInputError("2500"), null);
  });
});
