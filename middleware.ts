import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";
import { canAccessPath } from "@/lib/rbac/permissions";

const { auth } = NextAuth(authConfig);

const guarded = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLogin = pathname.startsWith("/login");
  const isHealth = pathname === "/api/health";
  const isPublic = isLogin || isHealth;

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
}) as unknown as NextMiddleware;

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // Auth.js reads the JWT while handling these routes and attaches a fresh
  // session cookie to the middleware response. On sign-out that cookie is
  // written after the expired cookie, so the browser stays signed in.
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  return guarded(request, event);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
