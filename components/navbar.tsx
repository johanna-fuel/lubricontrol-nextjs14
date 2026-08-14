import Link from "next/link";
import { getSessionProfile, canManageCatalogs, canOperateReception } from "@/lib/auth/permissions";

export async function Navbar() {
  const { user, profile } = await getSessionProfile();
  const role = profile?.role;

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-xl font-bold">LubriControl</Link>
        <div className="flex flex-wrap items-center justify-end gap-4 text-sm">
          <Link href="/servicios">Servicios</Link>
          <Link href="/consulta-vin">Consulta VIN</Link>
          {!user && <Link href="/auth/login">Ingresar</Link>}
          {user && role && (
            <>
              {canOperateReception(role) && <Link href="/dashboard/clientes">Clientes</Link>}
              {canOperateReception(role) && <Link href="/dashboard/vehiculos">Vehículos</Link>}
              {canManageCatalogs(role) && <Link href="/dashboard/servicios">Cat. servicios</Link>}
              {canManageCatalogs(role) && <Link href="/dashboard/productos">Productos</Link>}
              <Link href="/dashboard/ordenes">Órdenes</Link>
              {role === "admin" && <Link href="/dashboard/usuarios">Usuarios</Link>}
              <Link href="/dashboard">Dashboard</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
