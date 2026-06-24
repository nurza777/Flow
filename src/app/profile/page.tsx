import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [projects, stats] = await Promise.all([
    prisma.project.findMany({
      where: { deletedAt: null, members: { some: { userId: session.id } } },
      select: { id: true, name: true, color: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.groupBy({
      by: ["statusId"],
      where: { assigneeId: session.id },
      _count: { statusId: true },
    }),
  ]);

  const totalTasks = stats.reduce((a, s) => a + s._count.statusId, 0);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={{ name: session.name, email: session.email, role: session.role }} projects={projects} />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <ProfileClient
          user={{ name: session.name, email: session.email, role: session.role }}
          totalTasks={totalTasks}
        />
      </main>
    </div>
  );
}
