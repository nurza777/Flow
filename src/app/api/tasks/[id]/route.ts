import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notify, logActivity } from "@/lib/notify";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: {
      id,
      project: { members: { some: { userId: session.id } } },
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      createdBy: { select: { id: true, name: true } },
      status: true,
      labels: { include: { label: true } },
      subtasks: {
        include: {
          assignee: { select: { id: true, name: true } },
          status: true,
        },
      },
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
      activityLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!task) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const existing = await prisma.task.findFirst({
    where: { id, project: { members: { some: { userId: session.id } } } },
    include: { status: true, assignee: true, project: { select: { name: true } } },
  });
  if (!existing) return Response.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.statusId !== undefined && { statusId: data.statusId }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
      ...(data.order !== undefined && { order: data.order }),
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      status: true,
      labels: { include: { label: true } },
      _count: { select: { subtasks: true, comments: true } },
    },
  });

  // Log changes and send notifications
  if (data.statusId && data.statusId !== existing.statusId) {
    await logActivity({
      taskId: id, userId: session.id, action: "status_changed",
      oldValue: existing.status.name, newValue: updated.status.name,
    });
    if (existing.assigneeId && existing.assigneeId !== session.id) {
      await notify({
        userId: existing.assigneeId, type: "status_changed",
        title: "Статус задачи изменён",
        body: `«${existing.title}»: ${existing.status.name} → ${updated.status.name}`,
        taskId: id, projectId: existing.projectId,
      });
    }
  }
  if (data.priority && data.priority !== existing.priority) {
    await logActivity({
      taskId: id, userId: session.id, action: "priority_changed",
      oldValue: existing.priority, newValue: data.priority,
    });
  }
  if (data.title && data.title !== existing.title) {
    await logActivity({
      taskId: id, userId: session.id, action: "title_changed",
      oldValue: existing.title, newValue: data.title,
    });
  }
  if (data.dueDate !== undefined && data.dueDate !== (existing.dueDate?.toISOString().split("T")[0] ?? null)) {
    await logActivity({
      taskId: id, userId: session.id, action: "due_date_changed",
      oldValue: existing.dueDate?.toISOString().split("T")[0] ?? "нет",
      newValue: data.dueDate ?? "нет",
    });
  }
  if (data.assigneeId !== undefined && data.assigneeId !== existing.assigneeId) {
    await logActivity({
      taskId: id, userId: session.id, action: "assignee_changed",
      oldValue: existing.assignee?.name ?? "нет",
      newValue: updated.assignee?.name ?? "нет",
    });
    if (data.assigneeId && data.assigneeId !== session.id) {
      await notify({
        userId: data.assigneeId, type: "task_assigned",
        title: "Вам назначена задача",
        body: `«${existing.title}» в проекте ${existing.project.name}`,
        taskId: id, projectId: existing.projectId,
      });
    }
  }

  return Response.json(updated);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, project: { members: { some: { userId: session.id } } } },
  });
  if (!task) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.task.delete({ where: { id } });
  return Response.json({ ok: true });
}
