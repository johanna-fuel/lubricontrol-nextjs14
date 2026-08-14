"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoles, type UserRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const validRoles = new Set<UserRole>(["admin", "receptionist", "technician"]);

function target(path: string, type: "error" | "message", value: string) {
  return `${path}?${type}=${encodeURIComponent(value)}`;
}

export async function createUser(formData: FormData) {
  // La comprobación de rol ocurre ANTES de crear el cliente service_role.
  await requireRoles(["admin"]);

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const role = String(formData.get("role") ?? "technician").trim() as UserRole;

  const returnPath = "/dashboard/usuarios/nuevo";

  if (!fullName || !email || !password || !validRoles.has(role)) {
    redirect(target(returnPath, "error", "Completa los campos obligatorios con datos válidos."));
  }

  if (password.length < 8) {
    redirect(target(returnPath, "error", "La contraseña temporal debe tener al menos 8 caracteres."));
  }

  if (password !== passwordConfirm) {
    redirect(target(returnPath, "error", "Las contraseñas no coinciden."));
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone: phone || null,
    },
  });

  if (error || !data.user) {
    const message = error?.message ?? "Supabase no devolvió el usuario creado.";
    redirect(target(returnPath, "error", `No se pudo crear el usuario: ${message}`));
  }

  // El trigger on_auth_user_created crea profiles. Como el cliente admin usa
  // service_role, podemos completar rol/teléfono sin relajar las políticas RLS.
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      role,
      active: true,
    })
    .eq("id", data.user.id);

  if (profileError) {
    // Evita dejar una cuenta de Auth huérfana si el perfil no pudo prepararse.
    await admin.auth.admin.deleteUser(data.user.id);
    redirect(
      target(
        returnPath,
        "error",
        `Se creó Auth pero no el perfil operativo; la cuenta fue revertida: ${profileError.message}`
      )
    );
  }

  revalidatePath("/dashboard/usuarios");
  redirect(target("/dashboard/usuarios", "message", `Usuario ${fullName} creado correctamente como ${role}.`));
}

export async function updateUserRole(formData: FormData) {
  const { supabase, user } = await requireRoles(["admin"]);
  const profileId = String(formData.get("profile_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as UserRole;
  const active = String(formData.get("active") ?? "") === "true";

  if (!profileId || !validRoles.has(role)) {
    redirect(target("/dashboard/usuarios", "error", "Datos de usuario no válidos."));
  }

  if (profileId === user.id && (!active || role !== "admin")) {
    redirect(target("/dashboard/usuarios", "error", "El administrador actual no puede quitarse a sí mismo el rol admin ni desactivarse."));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role, active })
    .eq("id", profileId);

  if (error) {
    redirect(target("/dashboard/usuarios", "error", `No se pudo actualizar el usuario: ${error.message}`));
  }

  revalidatePath("/dashboard/usuarios");
  redirect(target("/dashboard/usuarios", "message", "Rol y estado actualizados correctamente."));
}
