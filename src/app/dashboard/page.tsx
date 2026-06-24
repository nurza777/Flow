import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import DeveloperDashboard from "./DeveloperDashboard";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Developer: show their own task dashboard
  if (session.role === "developer") {
    const now = new Date();
    const myTasks = await prisma.task.findMany({
      where: { assigneeId: session.id },
      include: {
        project: { select: { id: true, name: true, color: true } },
        status: true,
      },
      orderBy: [{ dueDate: "asc" }],
    });

    const serialized = myTasks.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    const overdue = myTasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status.name !== "Готово"
    ).length;

    return (
      <DeveloperDashboard
        tasks={serialized}
        userName={session.name}
        overdueCount={overdue}
      />
    );
  }

  // Admin / Tech Lead: show projects overview
  const [projects, myTasks] = await Promise.all([
    prisma.project.findMany({
      where:
        session.role === "super_admin"
          ? { deletedAt: null }
          : { deletedAt: null, members: { some: { userId: session.id } } },
      include: {
        _count: { select: { tasks: true } },
        members: { select: { userId: true } },
        statuses: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: session.id,
        status: { name: { not: "Готово" } },
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        status: true,
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      take: 10,
    }),
  ]);

  const serializedProjects = projects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    statuses: p.statuses.map((s) => ({ ...s })),
  }));

  const serializedTasks = myTasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient
      projects={serializedProjects}
      myTasks={serializedTasks}
      userName={session.name}
      userRole={session.role}
    />
  );
}
