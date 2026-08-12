"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function url(path: string, type: "error" | "message", value: string) { return `${path}?${type}=${encodeURIComponent(value)}`; }

async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return supabase;
}

function parsePrice(value: string) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export async function createService(formData: FormData) {
  const name = text(formData, "name");
  const description = text(formData, "description");
  const price = parsePrice(text(formData, "price"));
  const active = formData.get("active") === "on";
  if (!name || price === null) redirect(url("/dashboard/servicios/nuevo", "error", "Nombre y precio válido son obligatorios."));

  const supabase = await requireUser();
  const { error } = await supabase.from("services").insert({ name, description: description || null, price, active });
  if (error) redirect(url("/dashboard/servicios/nuevo", "error", `No se pudo crear el servicio: ${error.message}`));
  revalidatePath("/dashboard/servicios");
  revalidatePath("/servicios");
  redirect(url("/dashboard/servicios", "message", "Servicio creado correctamente."));
}

export async function updateService(id: string, formData: FormData) {
  const path = `/dashboard/servicios/${id}/editar`;
  const name = text(formData, "name");
  const description = text(formData, "description");
  const price = parsePrice(text(formData, "price"));
  const active = formData.get("active") === "on";
  if (!name || price === null) redirect(url(path, "error", "Nombre y precio válido son obligatorios."));
  const supabase = await requireUser();
  const { error } = await supabase.from("services").update({ name, description: description || null, price, active }).eq("id", id);
  if (error) redirect(url(path, "error", `No se pudo actualizar el servicio: ${error.message}`));
  revalidatePath("/dashboard/servicios");
  revalidatePath("/servicios");
  revalidatePath("/dashboard/ordenes/nueva");
  redirect(url("/dashboard/servicios", "message", "Servicio actualizado correctamente."));
}

export async function deleteService(id: string) {
  const supabase = await requireUser();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) {
    const message = error.code === "23503" ? "El servicio ya fue usado en una orden. Desactívalo en lugar de eliminarlo." : `No se pudo eliminar: ${error.message}`;
    redirect(url(`/dashboard/servicios/${id}/editar`, "error", message));
  }
  revalidatePath("/dashboard/servicios");
  revalidatePath("/servicios");
  redirect(url("/dashboard/servicios", "message", "Servicio eliminado correctamente."));
}
