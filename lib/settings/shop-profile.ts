import { normalizeSriLankaPhone, phoneError } from "@/lib/repairs/phone";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function shopNameError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "Enter the shop name.";
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || !/\p{L}/u.test(name)) return "Enter a shop name using letters.";
  return null;
}

export function shopAddressError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "Enter the shop address.";
  return null;
}

export function shopEmailError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "Enter an email address.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email address.";
  return null;
}

export function shopProfileError(input: {
  shopName?: unknown;
  address?: unknown;
  phone?: unknown;
  email?: unknown;
}): string | null {
  if ("shopName" in input) {
    const error = shopNameError(input.shopName);
    if (error) return error;
  }
  if ("address" in input) {
    const error = shopAddressError(input.address);
    if (error) return error;
  }
  if ("phone" in input) {
    const error = phoneError(input.phone);
    if (error) return error;
  }
  if ("email" in input) {
    const error = shopEmailError(input.email);
    if (error) return error;
  }
  return null;
}

export function normalizeShopProfile(input: {
  shopName?: unknown;
  address?: unknown;
  phone?: unknown;
  email?: unknown;
}) {
  return {
    shopName:
      typeof input.shopName === "string" ? input.shopName.trim().replace(/\s+/g, " ") : undefined,
    address: typeof input.address === "string" ? input.address.trim().replace(/\s+/g, " ") : undefined,
    phone: "phone" in input ? normalizeSriLankaPhone(input.phone) : undefined,
    email: typeof input.email === "string" ? input.email.trim().toLowerCase() : undefined,
  };
}
