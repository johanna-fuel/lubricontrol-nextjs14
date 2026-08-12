import type { ReactNode } from "react";

export type CustomerFormValues = {
  identification?: string | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export function CustomerForm({
  action,
  customer,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  customer?: CustomerFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5 rounded-xl border bg-white p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Identificación *">
          <input
            name="identification"
            defaultValue={customer?.identification ?? ""}
            placeholder="Cédula o RUC"
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </Field>
        <Field label="Nombre completo *">
          <input
            name="full_name"
            defaultValue={customer?.full_name ?? ""}
            placeholder="Nombre o razón social"
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </Field>
        <Field label="Teléfono">
          <input
            name="phone"
            defaultValue={customer?.phone ?? ""}
            placeholder="0999999999"
            className="w-full rounded-lg border px-3 py-2"
          />
        </Field>
        <Field label="Correo">
          <input
            name="email"
            type="email"
            defaultValue={customer?.email ?? ""}
            placeholder="cliente@correo.com"
            className="w-full rounded-lg border px-3 py-2"
          />
        </Field>
      </div>
      <Field label="Dirección">
        <textarea
          name="address"
          defaultValue={customer?.address ?? ""}
          rows={3}
          placeholder="Dirección del cliente"
          className="w-full rounded-lg border px-3 py-2"
        />
      </Field>
      <div className="flex justify-end">
        <button className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-800">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
