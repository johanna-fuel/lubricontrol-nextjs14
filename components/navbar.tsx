import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">LubriControl</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/servicios">Servicios</Link>
          <Link href="/auth/login">Ingresar</Link>
          <Link href="/dashboard/clientes">Clientes</Link>
          <Link href="/dashboard/vehiculos">Vehículos</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>
    </header>
  );
}
