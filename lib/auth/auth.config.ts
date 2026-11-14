import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Mongoose/bcrypt).
 * Used by middleware; providers are added in auth.ts for Node route handlers.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "cashier";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
