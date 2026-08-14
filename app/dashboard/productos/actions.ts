"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/auth/permissions";

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function url(path: string, type: "error" | "message", value: string) { return `${path}?${type}=${encodeURIComponent(value)}`; }
async function requireAdmin() { const { supabase } = await requireRoles(["admin"]); return supabase; }
function parseNonNegative(value: string) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : null; }

export async function createProduct(formData: FormData) {
  const category = text(formData, "category"); const brand = text(formData, "brand"); const name = text(formData, "name"); const viscosity = text(formData, "viscosity").toUpperCase(); const presentation = text(formData, "presentation");
  const salePrice = parseNonNegative(text(formData, "sale_price")); const stock = parseNonNegative(text(formData, "stock")); const active = formData.get("active") === "on";
  if (!category || !name || salePrice === null || stock === null) redirect(url("/dashboard/productos/nuevo", "error", "Categoría, nombre, precio y stock válidos son obligatorios."));
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").insert({ category, brand: brand || null, name, viscosity: viscosity || null, presentation: presentation || null, sale_price: salePrice, stock, active });
  if (error) redirect(url("/dashboard/productos/nuevo", "error", `No se pudo crear el producto: ${error.message}`));
  revalidatePath("/dashboard/productos"); revalidatePath("/dashboard/ordenes/nueva");
  redirect(url("/dashboard/productos", "message", "Producto creado correctamente."));
}

export async function updateProduct(id: string, formData: FormData) {
  const path = `/dashboard/productos/${id}/editar`;
  const category = text(formData, "category"); const brand = text(formData, "brand"); const name = text(formData, "name"); const viscosity = text(formData, "viscosity").toUpperCase(); const presentation = text(formData, "presentation");
  const salePrice = parseNonNegative(text(formData, "sale_price")); const stock = parseNonNegative(text(formData, "stock")); const active = formData.get("active") === "on";
  if (!category || !name || salePrice === null || stock === null) redirect(url(path, "error", "Categoría, nombre, precio y stock válidos son obligatorios."));
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").update({ category, brand: brand || null, name, viscosity: viscosity || null, presentation: presentation || null, sale_price: salePrice, stock, active }).eq("id", id);
  if (error) redirect(url(path, "error", `No se pudo actualizar el producto: ${error.message}`));
  revalidatePath("/dashboard/productos"); revalidatePath("/dashboard/ordenes/nueva");
  redirect(url("/dashboard/productos", "message", "Producto actualizado correctamente."));
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    const message = error.code === "23503" ? "El producto ya fue usado en una orden. Desactívalo en lugar de eliminarlo." : `No se pudo eliminar: ${error.message}`;
    redirect(url(`/dashboard/productos/${id}/editar`, "error", message));
  }
  revalidatePath("/dashboard/productos");
  redirect(url("/dashboard/productos", "message", "Producto eliminado correctamente."));
}
