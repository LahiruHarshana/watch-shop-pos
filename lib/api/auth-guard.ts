import { auth } from "@/lib/auth/auth";
import { jsonError } from "@/lib/api/response";
import type { UserRole } from "@/types/next-auth";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireSession() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: jsonError("UNAUTHORIZED", "Sign in required", 401) };
  }
  return { user, response: null };
}

export async function requireRole(roles: UserRole[]) {
  const { user, response } = await requireSession();
  if (response) return { user: null, response };
  if (!roles.includes(user!.role)) {
    return {
      user: null,
      response: jsonError("UNAUTHORIZED", "You don't have permission for this action.", 403),
    };
  }
  return { user, response: null };
}
