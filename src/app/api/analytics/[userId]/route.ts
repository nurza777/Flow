import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;

  // Developer can only see their own analytics
  if (session.role === "developer" && session.id !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const [allTasks, completedTasks, overdueTasks, inProgressTasks] = await Promise.all([
    prisma.task.findMany({
      where: { assigneeId: userId },
      include: { status: true },
    }),
    prisma.task.findMany({
      where: { assigneeId: userId, status: { name: "Готово" } },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        dueDate: { lt: now },
        status: { name: { not: "Готово" } },
      },
    }),
    prisma.task.findMany({
      where: { assigneeId: userId, status: { name: "В работе" } },
    }),
  ]);

  // Calculate average completion time (days from createdAt to updatedAt for done tasks)
  let avgCompletionDays = 0;
  if (completedTasks.length > 0) {
    const total = completedTasks.reduce((acc, t) => {
      const diff = (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return acc + diff;
    }, 0);
    avgCompletionDays = Math.round(total / completedTasks.length);
  }

  // Tasks completed on time (done and dueDate not exceeded)
  const completedOnTime = completedTasks.filter(
    (t) => !t.dueDate || t.updatedAt <= t.dueDate
  ).length;

  // Priority breakdown
  const byPriority = {
    urgent: allTasks.filter((t) => t.priority === "urgent").length,
    high: allTasks.filter((t) => t.priority === "high").length,
    medium: allTasks.filter((t) => t.priority === "medium").length,
    low: allTasks.filter((t) => t.priority === "low").length,
  };

  // Last 30 days activity
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentCompleted = completedTasks.filter(
    (t) => t.updatedAt >= thirtyDaysAgo
  ).length;

  const completionRate =
    allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

  const onTimeRate =
    completedTasks.length > 0
      ? Math.round((completedOnTime / completedTasks.length) * 100)
      : 0;

  return Response.json({
    total: allTasks.length,
    completed: completedTasks.length,
    overdue: overdueTasks.length,
    inProgress: inProgressTasks.length,
    completionRate,
    onTimeRate,
    avgCompletionDays,
    recentCompleted,
    byPriority,
  });
}
