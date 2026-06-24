import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeamAnalyticsClient from "./TeamAnalyticsClient";

export default async function TeamAnalyticsPage() {
  const session = await getSession();
  if (!session || session.role !== "tech_lead") redirect("/dashboard");

  const developers = await prisma.user.findMany({
    where: { createdById: session.id, role: "developer" },
    select: {
      id: true,
      name: true,
      email: true,
      assignedTasks: {
        include: { status: true },
      },
    },
  });

  const now = new Date();

  const devStats = developers.map((dev) => {
    const total = dev.assignedTasks.length;
    const completed = dev.assignedTasks.filter((t) => t.status.name === "Готово").length;
    const overdue = dev.assignedTasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status.name !== "Готово"
    ).length;
    const inProgress = dev.assignedTasks.filter((t) => t.status.name === "В работе").length;

    const completedOnTime = dev.assignedTasks.filter(
      (t) => t.status.name === "Готово" && (!t.dueDate || t.updatedAt <= t.dueDate)
    ).length;

    let avgDays = 0;
    const doneTasks = dev.assignedTasks.filter((t) => t.status.name === "Готово");
    if (doneTasks.length > 0) {
      const total = doneTasks.reduce(
        (acc, t) => acc + (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        0
      );
      avgDays = Math.round(total / doneTasks.length);
    }

    return {
      id: dev.id,
      name: dev.name,
      email: dev.email,
      total,
      completed,
      overdue,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      onTimeRate: completed > 0 ? Math.round((completedOnTime / completed) * 100) : 0,
      avgDays,
    };
  });

  return <TeamAnalyticsClient stats={devStats} />;
}
