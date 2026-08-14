import { requireRoles } from "@/lib/auth/permissions";
export default async function PaymentsLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["admin", "receptionist"]);
  return children;
}
