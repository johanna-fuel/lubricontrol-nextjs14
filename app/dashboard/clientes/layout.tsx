import { requireRoles } from "@/lib/auth/permissions";

export default async function ReceptionSectionLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["admin", "receptionist"]);
  return children;
}
