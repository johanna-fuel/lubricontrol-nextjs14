import { requireRoles } from "@/lib/auth/permissions";
export default async function EditOrderLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["admin", "receptionist"]);
  return children;
}
