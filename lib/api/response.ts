import { NextResponse } from "next/server";
import type { PaginationMeta } from "@/lib/api/pagination";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonPaginated<T>(
  data: T[],
  pagination: PaginationMeta,
  extra?: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json({ data, pagination, ...extra }, { status });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status },
  );
}
