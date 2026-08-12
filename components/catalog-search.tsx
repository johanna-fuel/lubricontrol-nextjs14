"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CatalogItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  active: boolean;
};

export function CatalogSearch({ items, basePath, emptyText }: { items: CatalogItem[]; basePath: string; emptyText: string }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.title} ${item.subtitle} ${item.meta}`.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." className="w-full rounded-lg border px-3 py-2" />
        <p className="mt-2 text-xs text-slate-500">{filtered.length} de {items.length} registro(s)</p>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-slate-600">{emptyText}</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <Link href={`${basePath}/${item.id}/editar`} key={item.id} className="rounded-xl border bg-white p-5 transition hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{item.meta}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.active ? "Activo" : "Inactivo"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
