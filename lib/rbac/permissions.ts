import type { UserRole } from "@/types/next-auth";

export const adminOnlyPaths = [
  "/settings",
  "/users",
  "/inventory/adjustments",
  "/inventory/categories",
  "/reports",
  "/expenses/categories",
] as const;

export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (role === "admin") return true;
  return !adminOnlyPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function requireRoles(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role);
}
