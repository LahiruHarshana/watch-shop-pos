import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { businessDateKey, businessDayRange } from "./business-day";

describe("Asia/Colombo business day", () => {
  it("includes 00:30 and 23:30 on the selected Colombo date", () => {
    const { start, end } = businessDayRange("2026-10-28");
    const early = new Date("2026-10-27T19:00:00.000Z"); // 00:30 Colombo
    const late = new Date("2026-10-28T18:00:00.000Z"); // 23:30 Colombo
    assert.equal(businessDateKey(early), "2026-10-28");
    assert.equal(businessDateKey(late), "2026-10-28");
    assert.ok(early >= start && early <= end);
    assert.ok(late >= start && late <= end);
  });

  it("excludes the previous evening and the next morning", () => {
    const { start, end } = businessDayRange("2026-10-28");
    const previousLate = new Date("2026-10-27T18:00:00.000Z"); // 23:30 on 27 Oct Colombo
    const nextEarly = new Date("2026-10-28T19:00:00.000Z"); // 00:30 on 29 Oct Colombo
    assert.equal(businessDateKey(previousLate), "2026-10-27");
    assert.equal(businessDateKey(nextEarly), "2026-10-29");
    assert.ok(previousLate < start);
    assert.ok(nextEarly > end);
  });

  it("converts Colombo midnight to 18:30 UTC the previous day", () => {
    const { start } = businessDayRange("2026-10-28");
    assert.equal(start.toISOString(), "2026-10-27T18:30:00.000Z");
  });
});
