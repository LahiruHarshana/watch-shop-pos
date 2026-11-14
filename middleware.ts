import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";
import { canAccessPath } from "@/lib/rbac/permissions";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLogin = pathname.startsWith("/login");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isHealth = pathname === "/api/health";
  const isPublic = isLogin || isApiAuth || isHealth;

  if (!req.auth && !isPublic && (pathname.startsWith("/api") || !pathname.startsWith("/_next"))) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      );
    }
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (req.auth?.user?.role && !canAccessPath(req.auth.user.role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (req.auth && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
