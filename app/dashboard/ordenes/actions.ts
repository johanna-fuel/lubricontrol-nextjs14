"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RequestedLine = { id: string; quantity: number };
const allowedStatuses = new Set(["pending","assigned","in_progress","completed","delivered","cancelled"]);
function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function url(path: string, type: "error" | "message", value: string) { return `${path}?${type}=${encodeURIComponent(value)}`; }
async function requireUser() { const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login"); return { supabase, user }; }
function parseLines(value: string): RequestedLine[] { try { const parsed = JSON.parse(value || "[]"); if (!Array.isArray(parsed)) return []; return parsed.map((line)=>({ id: String(line.id ?? ""), quantity: Number(line.quantity) })).filter((line)=>line.id && Number.isFinite(line.quantity) && line.quantity > 0); } catch { return []; } }

export async function createOrder(formData: FormData) {
  const customerId=text(formData,"customer_id"), vehicleId=text(formData,"vehicle_id"), assignedEmployeeId=text(formData,"assigned_employee_id"), observations=text(formData,"observations"), mileageRaw=text(formData,"mileage");
  const servicesRequested=parseLines(text(formData,"services_json")), productsRequested=parseLines(text(formData,"products_json"));
  const returnPath = `/dashboard/ordenes/nueva?customer_id=${encodeURIComponent(customerId)}&vehicle_id=${encodeURIComponent(vehicleId)}`;
  if (!customerId || !vehicleId) redirect(url(returnPath,"error","Cliente y vehículo son obligatorios."));
  if (servicesRequested.length===0 && productsRequested.length===0) redirect(url(returnPath,"error","Selecciona al menos un servicio o producto."));
  const mileage = mileageRaw ? Number(mileageRaw) : null; if (mileage !== null && (!Number.isInteger(mileage) || mileage < 0)) redirect(url(returnPath,"error","El kilometraje debe ser un entero positivo."));
  const { supabase, user } = await requireUser();
  const { data: vehicle } = await supabase.from("vehicles").select("id, customer_id, current_mileage").eq("id",vehicleId).single();
  if (!vehicle || vehicle.customer_id !== customerId) redirect(url(returnPath,"error","El vehículo seleccionado no pertenece al cliente indicado."));

  const serviceIds = Array.from(
    new Set(servicesRequested.map((line) => line.id))
  );

  const productIds = Array.from(
    new Set(productsRequested.map((line) => line.id))
  );
  
  let serviceRows: { id: string; price: number | string; active: boolean }[] = [];
  let productRows: { id: string; sale_price: number | string; stock: number | string; active: boolean }[] = [];
  if (serviceIds.length) {
    const { data, error } = await supabase.from("services").select("id, price, active").in("id",serviceIds);
    if (error) redirect(url(returnPath,"error",`No se pudieron validar los servicios: ${error.message}`));
    serviceRows = (data ?? []) as typeof serviceRows;
  }
  if (productIds.length) {
    const { data, error } = await supabase.from("products").select("id, sale_price, stock, active").in("id",productIds);
    if (error) redirect(url(returnPath,"error",`No se pudieron validar los productos: ${error.message}`));
    productRows = (data ?? []) as typeof productRows;
  }
  if (serviceRows.length!==serviceIds.length || serviceRows.some((s)=>!s.active)) redirect(url(returnPath,"error","Uno de los servicios ya no está disponible."));
  if (productRows.length!==productIds.length || productRows.some((p)=>!p.active)) redirect(url(returnPath,"error","Uno de los productos ya no está disponible."));
  const serviceMap = new Map<string, number>(serviceRows.map((s)=>[s.id,Number(s.price)]));
  const productMap = new Map<string, { price: number; stock: number }>(productRows.map((p)=>[p.id,{price:Number(p.sale_price),stock:Number(p.stock)}]));
  for (const line of productsRequested) { const p=productMap.get(line.id); if (!p || line.quantity > p.stock) redirect(url(returnPath,"error","La cantidad solicitada supera el stock disponible de uno de los productos.")); }
  const serviceLines=servicesRequested.map((l)=>({service_id:l.id,quantity:l.quantity,unit_price:serviceMap.get(l.id) ?? 0})); const productLines=productsRequested.map((l)=>({product_id:l.id,quantity:l.quantity,unit_price:productMap.get(l.id)?.price ?? 0}));
  const subtotal = serviceLines.reduce((sum,l)=>sum+l.quantity*l.unit_price,0)+productLines.reduce((sum,l)=>sum+l.quantity*l.unit_price,0);
  const { data: order, error: orderError } = await supabase.from("service_orders").insert({ customer_id:customerId, vehicle_id:vehicleId, assigned_employee_id:assignedEmployeeId||null, status:assignedEmployeeId?"assigned":"pending", mileage, observations:observations||null, subtotal, tax:0, total:subtotal, created_by:user.id }).select("id").single();
  if (orderError || !order) redirect(url(returnPath,"error",`No se pudo crear la orden: ${orderError?.message ?? "error desconocido"}`));
  if (serviceLines.length) { const { error }=await supabase.from("order_services").insert(serviceLines.map((l)=>({...l,order_id:order.id}))); if (error) { await supabase.from("service_orders").delete().eq("id",order.id); redirect(url(returnPath,"error",`No se pudieron guardar los servicios: ${error.message}`)); } }
  if (productLines.length) { const { error }=await supabase.from("order_products").insert(productLines.map((l)=>({...l,order_id:order.id}))); if (error) { await supabase.from("service_orders").delete().eq("id",order.id); redirect(url(returnPath,"error",`No se pudieron guardar los productos: ${error.message}`)); } }
  if (mileage !== null && (vehicle.current_mileage === null || mileage > vehicle.current_mileage)) await supabase.from("vehicles").update({current_mileage:mileage}).eq("id",vehicleId);
  revalidatePath("/dashboard/ordenes"); revalidatePath("/dashboard"); revalidatePath(`/dashboard/vehiculos/${vehicleId}`);
  redirect(url(`/dashboard/ordenes/${order.id}`,"message","Orden creada correctamente."));
}

export async function updateOrder(id: string, formData: FormData) {
  const path=`/dashboard/ordenes/${id}/editar`; const assigned=text(formData,"assigned_employee_id"), status=text(formData,"status"), observations=text(formData,"observations"), mileageRaw=text(formData,"mileage");
  if (!allowedStatuses.has(status)) redirect(url(path,"error","Estado de orden no válido.")); const mileage=mileageRaw?Number(mileageRaw):null; if (mileage!==null&&(!Number.isInteger(mileage)||mileage<0)) redirect(url(path,"error","Kilometraje no válido."));
  const { supabase }=await requireUser(); const { data: current }=await supabase.from("service_orders").select("vehicle_id").eq("id",id).single(); if(!current) redirect(url("/dashboard/ordenes","error","La orden no existe."));
  const completed_at = status === "completed" || status === "delivered" ? new Date().toISOString() : null;
  const { error }=await supabase.from("service_orders").update({assigned_employee_id:assigned||null,status,mileage,observations:observations||null,completed_at}).eq("id",id); if(error) redirect(url(path,"error",`No se pudo actualizar la orden: ${error.message}`));
  if(mileage!==null) { const { data:v }=await supabase.from("vehicles").select("current_mileage").eq("id",current.vehicle_id).single(); if(v && (v.current_mileage===null||mileage>v.current_mileage)) await supabase.from("vehicles").update({current_mileage:mileage}).eq("id",current.vehicle_id); }
  revalidatePath(`/dashboard/ordenes/${id}`); revalidatePath("/dashboard/ordenes"); revalidatePath("/dashboard"); redirect(url(`/dashboard/ordenes/${id}`,"message","Orden actualizada correctamente."));
}

export async function deleteOrder(id: string) {
  const { supabase }=await requireUser(); const { data:order }=await supabase.from("service_orders").select("status").eq("id",id).single(); if(!order) redirect(url("/dashboard/ordenes","error","La orden no existe."));
  if(!["pending","cancelled"].includes(order.status)) redirect(url(`/dashboard/ordenes/${id}`,"error","Solo se pueden eliminar órdenes pendientes o canceladas."));
  const { count }=await supabase.from("payments").select("id",{count:"exact",head:true}).eq("order_id",id); if((count??0)>0) redirect(url(`/dashboard/ordenes/${id}`,"error","La orden tiene pagos registrados y no puede eliminarse."));
  const { error }=await supabase.from("service_orders").delete().eq("id",id); if(error) redirect(url(`/dashboard/ordenes/${id}`,"error",`No se pudo eliminar la orden: ${error.message}`)); revalidatePath("/dashboard/ordenes"); revalidatePath("/dashboard"); redirect(url("/dashboard/ordenes","message","Orden eliminada correctamente."));
}
