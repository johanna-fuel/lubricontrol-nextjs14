import type { ReactNode } from "react";

export type VehicleFormValues = {
  customer_id?: string | null;
  plate?: string | null;
  vin?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  current_mileage?: number | null;
};

export type CustomerOption = {
  id: string;
  identification: string;
  full_name: string;
};

export function VehicleForm({
  action,
  vehicle,
  customers,
  defaultCustomerId,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  vehicle?: VehicleFormValues;
  customers: CustomerOption[];
  defaultCustomerId?: string;
  submitLabel: string;
}) {
  const selectedCustomer = vehicle?.customer_id ?? defaultCustomerId ?? "";

  return (
    <form action={action} className="space-y-5 rounded-xl border bg-white p-6">
      <Field label="Cliente propietario *">
        <select
          name="customer_id"
          defaultValue={selectedCustomer}
          className="w-full rounded-lg border px-3 py-2"
          required
        >
          <option value="" disabled>Seleccione un cliente</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.full_name} · {customer.identification}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Placa *">
          <input
            name="plate"
            defaultValue={vehicle?.plate ?? ""}
            placeholder="ABC-1234"
            className="w-full rounded-lg border px-3 py-2 uppercase"
            required
          />
        </Field>
        <Field label="VIN / Chasis">
          <input
            name="vin"
            defaultValue={vehicle?.vin ?? ""}
            placeholder="Opcional"
            className="w-full rounded-lg border px-3 py-2 uppercase"
          />
        </Field>
        <Field label="Marca *">
          <input
            name="brand"
            defaultValue={vehicle?.brand ?? ""}
            placeholder="Toyota"
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </Field>
        <Field label="Modelo *">
          <input
            name="model"
            defaultValue={vehicle?.model ?? ""}
            placeholder="Corolla"
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </Field>
        <Field label="Año">
          <input
            name="year"
            type="number"
            min={1900}
            max={2100}
            defaultValue={vehicle?.year ?? ""}
            placeholder="2022"
            className="w-full rounded-lg border px-3 py-2"
          />
        </Field>
        <Field label="Color">
          <input
            name="color"
            defaultValue={vehicle?.color ?? ""}
            placeholder="Blanco"
            className="w-full rounded-lg border px-3 py-2"
          />
        </Field>
        <Field label="Kilometraje actual">
          <input
            name="current_mileage"
            type="number"
            min={0}
            step={1}
            defaultValue={vehicle?.current_mileage ?? ""}
            placeholder="85000"
            className="w-full rounded-lg border px-3 py-2"
          />
        </Field>
      </div>

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
