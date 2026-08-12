import type { ReactNode } from "react";

export type ProductFormValues = {
  category?: string | null;
  brand?: string | null;
  name?: string | null;
  viscosity?: string | null;
  presentation?: string | null;
  sale_price?: number | string | null;
  stock?: number | string | null;
  active?: boolean | null;
};

export function ProductForm({
  action,
  product,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  product?: ProductFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5 rounded-xl border bg-white p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Categoría *">
          <select name="category" defaultValue={product?.category ?? ""} className="w-full rounded-lg border px-3 py-2" required>
            <option value="" disabled>Seleccione una categoría</option>
            <option value="Aceite">Aceite</option>
            <option value="Filtro de aceite">Filtro de aceite</option>
            <option value="Filtro de aire">Filtro de aire</option>
            <option value="Aditivo">Aditivo</option>
            <option value="Refrigerante">Refrigerante</option>
            <option value="Otro">Otro</option>
          </select>
        </Field>
        <Field label="Marca">
          <input name="brand" defaultValue={product?.brand ?? ""} placeholder="Mobil, Bosch, Mann..." className="w-full rounded-lg border px-3 py-2" />
        </Field>
        <Field label="Nombre del producto *">
          <input name="name" defaultValue={product?.name ?? ""} placeholder="Super 2000" className="w-full rounded-lg border px-3 py-2" required />
        </Field>
        <Field label="Viscosidad">
          <input name="viscosity" defaultValue={product?.viscosity ?? ""} placeholder="10W-40" className="w-full rounded-lg border px-3 py-2 uppercase" />
        </Field>
        <Field label="Presentación">
          <input name="presentation" defaultValue={product?.presentation ?? ""} placeholder="1 litro / unidad" className="w-full rounded-lg border px-3 py-2" />
        </Field>
        <Field label="Precio de venta *">
          <input name="sale_price" type="number" min={0} step="0.01" defaultValue={product?.sale_price ?? ""} placeholder="8.50" className="w-full rounded-lg border px-3 py-2" required />
        </Field>
        <Field label="Stock *">
          <input name="stock" type="number" min={0} step="0.01" defaultValue={product?.stock ?? 0} className="w-full rounded-lg border px-3 py-2" required />
        </Field>
        <label className="flex items-center gap-3 rounded-lg border px-4 py-3 md:self-end">
          <input name="active" type="checkbox" defaultChecked={product?.active ?? true} className="h-4 w-4" />
          <span className="text-sm font-medium text-slate-700">Producto activo</span>
        </label>
      </div>
      <div className="flex justify-end">
        <button className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-800">{submitLabel}</button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
