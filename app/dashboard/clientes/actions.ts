"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function customerUrl(path: string, type: "error" | "message", value: string) {
  return `${path}?${type}=${encodeURIComponent(value)}`;
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  return { supabase, user };
}

export async function createCustomer(formData: FormData) {
  const fullName = text(formData, "full_name");
  const identification = text(formData, "identification");
  const phone = text(formData, "phone");
  const email = text(formData, "email");
  const address = text(formData, "address");

  if (!fullName) {
    redirect(customerUrl("/dashboard/clientes/nuevo", "error", "El nombre completo es obligatorio."));
  }

  if (!identification) {
    redirect(customerUrl("/dashboard/clientes/nuevo", "error", "La identificación es obligatoria."));
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("customers").insert({
    full_name: fullName,
    identification,
    phone: phone || null,
    email: email || null,
    address: address || null,
    created_by: user.id,
  });

  if (error) {
    const message = error.code === "23505"
      ? "Ya existe un cliente con esa identificación."
      : `No se pudo crear el cliente: ${error.message}`;
    redirect(customerUrl("/dashboard/clientes/nuevo", "error", message));
  }

  revalidatePath("/dashboard/clientes");
  redirect(customerUrl("/dashboard/clientes", "message", "Cliente creado correctamente."));
}

export async function updateCustomer(id: string, formData: FormData) {
  const fullName = text(formData, "full_name");
  const identification = text(formData, "identification");
  const phone = text(formData, "phone");
  const email = text(formData, "email");
  const address = text(formData, "address");

  if (!fullName || !identification) {
    redirect(customerUrl(`/dashboard/clientes/${id}/editar`, "error", "Nombre e identificación son obligatorios."));
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("customers")
    .update({
      full_name: fullName,
      identification,
      phone: phone || null,
      email: email || null,
      address: address || null,
    })
    .eq("id", id);

  if (error) {
    const message = error.code === "23505"
      ? "Ya existe otro cliente con esa identificación."
      : `No se pudo actualizar el cliente: ${error.message}`;
    redirect(customerUrl(`/dashboard/clientes/${id}/editar`, "error", message));
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${id}`);
  redirect(customerUrl(`/dashboard/clientes/${id}`, "message", "Cliente actualizado correctamente."));
}

export async function deleteCustomer(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    redirect(customerUrl(`/dashboard/clientes/${id}`, "error", `No se pudo eliminar el cliente: ${error.message}`));
  }

  revalidatePath("/dashboard/clientes");
  redirect(customerUrl("/dashboard/clientes", "message", "Cliente eliminado correctamente."));
}
