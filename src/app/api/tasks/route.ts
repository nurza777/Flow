import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notify, logActivity } from "@/lib/notify";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, priority, dueDate, projectId, statusId, assigneeId, parentId } =
    await request.json();

  if (!title || !projectId || !statusId) {
    return Response.json({ error: "Необходимы title, projectId, statusId" }, { status: 400 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.id, projectId } },
  });
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  const lastTask = await prisma.task.findFirst({
    where: { statusId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      statusId,
      assigneeId: assigneeId || null,
      createdById: session.id,
      parentId: parentId || null,
      order: (lastTask?.order ?? -1) + 1,
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      status: true,
      project: { select: { name: true } },
      labels: { include: { label: true } },
      _count: { select: { subtasks: true, comments: true } },
    },
  });

  await logActivity({ taskId: task.id, userId: session.id, action: "created", newValue: title });

  if (assigneeId && assigneeId !== session.id) {
    await notify({
      userId: assigneeId,
      type: "task_assigned",
      title: "Вам назначена задача",
      body: `«${title}» в проекте ${task.project.name}`,
      taskId: task.id,
      projectId,
    });
  }

  return Response.json(task, { status: 201 });
}
