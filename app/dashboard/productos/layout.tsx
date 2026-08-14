import { requireRoles } from "@/lib/auth/permissions";

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["admin"]);
  return children;
}
