import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type AppRole = "admin" | "manager" | "telecaller";

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(roles: AppRole[]) {
  const session = await requireSession();

  const role = session.user.role as AppRole | undefined;

  if (!role || !roles.includes(role)) {
    redirect("/dashboard");
  }

  return session;
}