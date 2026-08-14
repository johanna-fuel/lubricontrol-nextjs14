import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "receptionist" | "technician";

export type SessionProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  active: boolean;
};

export async function getSessionProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .single();

  return {
    supabase,
    user,
    profile: profile as SessionProfile | null,
  };
}

export async function requireActiveProfile() {
  const session = await getSessionProfile();
  if (!session.user) redirect("/auth/login");
  if (!session.profile?.active) redirect("/?error=Usuario inactivo");
  return session as typeof session & { user: NonNullable<typeof session.user>; profile: SessionProfile };
}

export async function requireRoles(roles: UserRole[]) {
  const session = await requireActiveProfile();
  if (!roles.includes(session.profile.role)) {
    redirect("/dashboard?error=No tienes permisos para acceder a esa sección.");
  }
  return session;
}

export const canOperateReception = (role: UserRole) => role === "admin" || role === "receptionist";
export const canManageCatalogs = (role: UserRole) => role === "admin";
