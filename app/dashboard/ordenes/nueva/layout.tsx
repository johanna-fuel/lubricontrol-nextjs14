import { requireRoles } from "@/lib/auth/permissions";
export default async function NewOrderLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["admin", "receptionist"]);
  return children;
}
