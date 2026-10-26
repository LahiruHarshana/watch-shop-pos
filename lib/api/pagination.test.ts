import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPaginationMeta, parsePagination } from "./pagination";

describe("parsePagination", () => {
  it("defaults to page 1 and limit 20", () => {
    const result = parsePagination(new URLSearchParams());
    assert.deepEqual(result, { page: 1, limit: 20, skip: 0 });
  });

  it("clamps limit and ignores invalid page", () => {
    const result = parsePagination(new URLSearchParams("page=-3&limit=500"), { maxLimit: 100 });
    assert.equal(result.page, 1);
    assert.equal(result.limit, 100);
  });
});

describe("buildPaginationMeta", () => {
  it("computes next and previous flags", () => {
    const meta = buildPaginationMeta(2, 10, 25);
    assert.equal(meta.totalPages, 3);
    assert.equal(meta.hasNextPage, true);
    assert.equal(meta.hasPrevPage, true);
  });
});
