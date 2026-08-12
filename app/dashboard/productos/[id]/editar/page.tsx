import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/product-form";
import { deleteProduct, updateProduct } from "../../actions";
export default async function EditProductPage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login");
  const { data: product } = await supabase.from("products").select("id, category, brand, name, viscosity, presentation, sale_price, stock, active").eq("id", params.id).single(); if (!product) notFound();
  const save = updateProduct.bind(null, product.id); const remove = deleteProduct.bind(null, product.id);
  return <section className="mx-auto max-w-3xl space-y-6"><div className="flex items-start justify-between gap-4"><div><Link href="/dashboard/productos" className="text-sm text-slate-600 hover:underline">← Volver a productos</Link><h1 className="mt-2 text-3xl font-bold">Editar producto</h1></div><form action={remove}><button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700">Eliminar</button></form></div>{searchParams.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</div>}<ProductForm action={save} product={product} submitLabel="Guardar cambios" /></section>;
}
