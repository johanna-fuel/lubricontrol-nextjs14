"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/auth/permissions";

const paymentMethods = new Set(["cash", "card", "transfer", "other"]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function url(path: string, type: "error" | "message", value: string) {
  return `${path}?${type}=${encodeURIComponent(value)}`;
}

export async function registerPayment(orderId: string, formData: FormData) {
  const path = `/dashboard/ordenes/${orderId}/pagos`;
  const method = text(formData, "payment_method");
  const reference = text(formData, "reference");
  const amount = Number(text(formData, "amount"));

  if (!paymentMethods.has(method)) redirect(url(path, "error", "Forma de pago no válida."));
  if (!Number.isFinite(amount) || amount <= 0) redirect(url(path, "error", "El valor del cobro debe ser mayor que cero."));

  const { supabase, user } = await requireRoles(["admin", "receptionist"]);

  const { data: order } = await supabase
    .from("service_orders")
    .select("id, status, total, inventory_applied")
    .eq("id", orderId)
    .single();

  if (!order) redirect(url("/dashboard/ordenes", "error", "La orden no existe."));
  if (order.status !== "completed" || !order.inventory_applied) {
    redirect(url(path, "error", "La orden debe estar Finalizada antes de registrar cobros."));
  }

  const { data: payments } = await supabase.from("payments").select("amount").eq("order_id", orderId);
  const paid = (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Math.max(0, Number(order.total) - paid);

  if (remaining <= 0) redirect(url(path, "error", "La orden ya está totalmente pagada."));
  if (amount > remaining + 0.00001) {
    redirect(url(path, "error", `El cobro supera el saldo pendiente de $${remaining.toFixed(2)}.`));
  }

  const { error } = await supabase.from("payments").insert({
    order_id: orderId,
    payment_method: method,
    amount,
    reference: reference || null,
    received_by: user.id,
  });

  if (error) redirect(url(path, "error", `No se pudo registrar el cobro: ${error.message}`));

  revalidatePath(path);
  revalidatePath(`/dashboard/ordenes/${orderId}`);
  revalidatePath(`/dashboard/ordenes/${orderId}/comprobante`);
  redirect(url(path, "message", "Cobro registrado correctamente."));
}

export async function deletePayment(orderId: string, paymentId: string) {
  const path = `/dashboard/ordenes/${orderId}/pagos`;
  const { supabase, user } = await requireRoles(["admin", "receptionist"]);

  const { data: order } = await supabase.from("service_orders").select("status").eq("id", orderId).single();
  if (!order) redirect(url("/dashboard/ordenes", "error", "La orden no existe."));
  if (order.status === "delivered") {
    redirect(url(path, "error", "Los cobros de una orden entregada ya no pueden eliminarse."));
  }

  const { error } = await supabase.from("payments").delete().eq("id", paymentId).eq("order_id", orderId);
  if (error) redirect(url(path, "error", `No se pudo eliminar el cobro: ${error.message}`));

  revalidatePath(path);
  revalidatePath(`/dashboard/ordenes/${orderId}`);
  revalidatePath(`/dashboard/ordenes/${orderId}/comprobante`);
  redirect(url(path, "message", "Cobro eliminado correctamente."));
}
