import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import UserManagement from "@/components/admin/UserManagement";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") redirect("/dashboard");

  return <UserManagement currentUserRole="super_admin" currentUserId={session.id} />;
}
