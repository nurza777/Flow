import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MyAnalyticsClient from "./MyAnalyticsClient";

export default async function MyAnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: { assigneeId: session.id },
    include: {
      status: true,
      project: { select: { id: true, name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const doneTasks = tasks.filter((t) => t.status.name === "Готово");
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < now && t.status.name !== "Готово"
  );
  const inProgressTasks = tasks.filter((t) => t.status.name === "В работе");
  const recentDone = doneTasks.filter((t) => t.updatedAt >= thirtyDaysAgo);

  const completedOnTime = doneTasks.filter(
    (t) => !t.dueDate || t.updatedAt <= t.dueDate
  ).length;

  let avgDays = 0;
  if (doneTasks.length > 0) {
    const sum = doneTasks.reduce(
      (acc, t) => acc + (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      0
    );
    avgDays = Math.round(sum / doneTasks.length);
  }

  const serializedTasks = tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <MyAnalyticsClient
      tasks={serializedTasks}
      stats={{
        total: tasks.length,
        completed: doneTasks.length,
        overdue: overdueTasks.length,
        inProgress: inProgressTasks.length,
        recentDone: recentDone.length,
        completionRate: tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
        onTimeRate: doneTasks.length > 0 ? Math.round((completedOnTime / doneTasks.length) * 100) : 0,
        avgDays,
      }}
      userName={session.name}
    />
  );
}
