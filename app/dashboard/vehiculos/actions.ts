"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function vehicleUrl(path: string, type: "error" | "message", value: string) {
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

function parseOptionalInteger(value: string, label: string) {
  if (!value) return { value: null as number | null, error: null as string | null };
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return { value: null, error: `${label} debe ser un número entero.` };
  return { value: parsed, error: null };
}

export async function createVehicle(formData: FormData) {
  const customerId = text(formData, "customer_id");
  const plate = text(formData, "plate").toUpperCase();
  const vin = text(formData, "vin").toUpperCase();
  const brand = text(formData, "brand");
  const model = text(formData, "model");
  const yearInput = text(formData, "year");
  const color = text(formData, "color");
  const mileageInput = text(formData, "current_mileage");

  const returnPath = customerId
    ? `/dashboard/vehiculos/nuevo?customer_id=${encodeURIComponent(customerId)}`
    : "/dashboard/vehiculos/nuevo";

  if (!customerId || !plate || !brand || !model) {
    redirect(vehicleUrl(returnPath, "error", "Cliente, placa, marca y modelo son obligatorios."));
  }

  const yearResult = parseOptionalInteger(yearInput, "El año");
  if (yearResult.error) redirect(vehicleUrl(returnPath, "error", yearResult.error));
  if (yearResult.value !== null && (yearResult.value < 1900 || yearResult.value > 2100)) {
    redirect(vehicleUrl(returnPath, "error", "El año debe estar entre 1900 y 2100."));
  }

  const mileageResult = parseOptionalInteger(mileageInput, "El kilometraje");
  if (mileageResult.error) redirect(vehicleUrl(returnPath, "error", mileageResult.error));
  if (mileageResult.value !== null && mileageResult.value < 0) {
    redirect(vehicleUrl(returnPath, "error", "El kilometraje no puede ser negativo."));
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      customer_id: customerId,
      plate,
      vin: vin || null,
      brand,
      model,
      year: yearResult.value,
      color: color || null,
      current_mileage: mileageResult.value,
    })
    .select("id")
    .single();

  if (error) {
    const message = error.code === "23505"
      ? "Ya existe un vehículo registrado con esa placa."
      : `No se pudo crear el vehículo: ${error.message}`;
    redirect(vehicleUrl(returnPath, "error", message));
  }

  revalidatePath("/dashboard/vehiculos");
  revalidatePath(`/dashboard/clientes/${customerId}`);
  redirect(vehicleUrl(`/dashboard/vehiculos/${data.id}`, "message", "Vehículo creado correctamente."));
}

export async function updateVehicle(id: string, formData: FormData) {
  const customerId = text(formData, "customer_id");
  const plate = text(formData, "plate").toUpperCase();
  const vin = text(formData, "vin").toUpperCase();
  const brand = text(formData, "brand");
  const model = text(formData, "model");
  const yearInput = text(formData, "year");
  const color = text(formData, "color");
  const mileageInput = text(formData, "current_mileage");
  const editPath = `/dashboard/vehiculos/${id}/editar`;

  if (!customerId || !plate || !brand || !model) {
    redirect(vehicleUrl(editPath, "error", "Cliente, placa, marca y modelo son obligatorios."));
  }

  const yearResult = parseOptionalInteger(yearInput, "El año");
  if (yearResult.error) redirect(vehicleUrl(editPath, "error", yearResult.error));
  if (yearResult.value !== null && (yearResult.value < 1900 || yearResult.value > 2100)) {
    redirect(vehicleUrl(editPath, "error", "El año debe estar entre 1900 y 2100."));
  }

  const mileageResult = parseOptionalInteger(mileageInput, "El kilometraje");
  if (mileageResult.error) redirect(vehicleUrl(editPath, "error", mileageResult.error));
  if (mileageResult.value !== null && mileageResult.value < 0) {
    redirect(vehicleUrl(editPath, "error", "El kilometraje no puede ser negativo."));
  }

  const { supabase } = await requireUser();
  const { data: previousVehicle } = await supabase
    .from("vehicles")
    .select("customer_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("vehicles")
    .update({
      customer_id: customerId,
      plate,
      vin: vin || null,
      brand,
      model,
      year: yearResult.value,
      color: color || null,
      current_mileage: mileageResult.value,
    })
    .eq("id", id);

  if (error) {
    const message = error.code === "23505"
      ? "Ya existe otro vehículo registrado con esa placa."
      : `No se pudo actualizar el vehículo: ${error.message}`;
    redirect(vehicleUrl(editPath, "error", message));
  }

  revalidatePath("/dashboard/vehiculos");
  revalidatePath(`/dashboard/vehiculos/${id}`);
  revalidatePath(`/dashboard/clientes/${customerId}`);
  if (previousVehicle?.customer_id && previousVehicle.customer_id !== customerId) {
    revalidatePath(`/dashboard/clientes/${previousVehicle.customer_id}`);
  }
  redirect(vehicleUrl(`/dashboard/vehiculos/${id}`, "message", "Vehículo actualizado correctamente."));
}

export async function deleteVehicle(id: string) {
  const { supabase } = await requireUser();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("customer_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) {
    redirect(vehicleUrl(`/dashboard/vehiculos/${id}`, "error", `No se pudo eliminar el vehículo: ${error.message}`));
  }

  revalidatePath("/dashboard/vehiculos");
  if (vehicle?.customer_id) revalidatePath(`/dashboard/clientes/${vehicle.customer_id}`);
  redirect(vehicleUrl("/dashboard/vehiculos", "message", "Vehículo eliminado correctamente."));
}
