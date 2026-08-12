import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CatalogSearch } from "@/components/catalog-search";

export default async function ProductsPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login");
  const { data, error } = await supabase.from("products").select("id, category, brand, name, viscosity, presentation, sale_price, stock, active").order("name");
  const items = (data ?? []).map((item) => ({ id: item.id, title: [item.brand, item.name].filter(Boolean).join(" "), subtitle: [item.category, item.viscosity, item.presentation].filter(Boolean).join(" · "), meta: `$${Number(item.sale_price).toFixed(2)} · Stock: ${Number(item.stock)}`, active: item.active }));
  return <section className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold">Productos</h1><p className="mt-1 text-slate-600">Aceites, filtros, aditivos e insumos utilizados en las órdenes.</p></div><Link href="/dashboard/productos/nuevo" className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white">+ Nuevo producto</Link></div>
    {searchParams.message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</div>}
    {searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}
    {error ? <div className="rounded-lg bg-red-50 p-4 text-red-800">No se pudieron cargar los productos: {error.message}</div> : <CatalogSearch items={items} basePath="/dashboard/productos" emptyText="No hay productos que coincidan con la búsqueda." />}
  </section>;
}
