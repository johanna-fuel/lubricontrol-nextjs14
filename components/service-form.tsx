import type { ReactNode } from "react";

export type ServiceFormValues = {
  name?: string | null;
  description?: string | null;
  price?: number | string | null;
  active?: boolean | null;
};

export function ServiceForm({
  action,
  service,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  service?: ServiceFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5 rounded-xl border bg-white p-6">
      <Field label="Nombre del servicio *">
        <input name="name" defaultValue={service?.name ?? ""} placeholder="Cambio de aceite" className="w-full rounded-lg border px-3 py-2" required />
      </Field>
      <Field label="Descripción">
        <textarea name="description" defaultValue={service?.description ?? ""} rows={4} placeholder="Detalle del servicio" className="w-full rounded-lg border px-3 py-2" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Precio *">
          <input name="price" type="number" min={0} step="0.01" defaultValue={service?.price ?? ""} placeholder="10.00" className="w-full rounded-lg border px-3 py-2" required />
        </Field>
        <label className="flex items-center gap-3 rounded-lg border px-4 py-3 sm:self-end">
          <input name="active" type="checkbox" defaultChecked={service?.active ?? true} className="h-4 w-4" />
          <span className="text-sm font-medium text-slate-700">Servicio activo</span>
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
