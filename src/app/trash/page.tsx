import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import TrashClient from "./TrashClient";

export default async function TrashPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "developer") redirect("/dashboard");

  // Auto-purge old trash
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.project.deleteMany({ where: { deletedAt: { lt: cutoff } } });

  const [sidebarProjects, trashed] = await Promise.all([
    prisma.project.findMany({
      where: { deletedAt: null, members: { some: { userId: session.id } } },
      select: { id: true, name: true, color: true },
    }),
    prisma.project.findMany({
      where: {
        deletedAt: { not: null },
        ...(session.role !== "super_admin" && { members: { some: { userId: session.id } } }),
      },
      include: {
        _count: { select: { tasks: true } },
        members: { include: { user: { select: { id: true, name: true } } }, take: 3 },
      },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  const serialized = trashed.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt!.toISOString(),
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={{ name: session.name, email: session.email, role: session.role }} projects={sidebarProjects} />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <TrashClient projects={serialized} isSuperAdmin={session.role === "super_admin"} />
      </main>
    </div>
  );
}
