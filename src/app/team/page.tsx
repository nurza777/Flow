import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import UserManagement from "@/components/admin/UserManagement";

export default async function TeamPage() {
  const session = await getSession();
  if (!session || session.role !== "tech_lead") redirect("/dashboard");

  return (
    <div>
      <UserManagement currentUserRole="tech_lead" currentUserId={session.id} />
    </div>
  );
}
