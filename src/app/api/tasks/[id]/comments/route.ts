import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notify, logActivity } from "@/lib/notify";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const { body } = await request.json();

  if (!body?.trim()) return Response.json({ error: "Комментарий пуст" }, { status: 400 });

  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { members: { some: { userId: session.id } } } },
    include: { project: { select: { name: true } } },
  });
  if (!task) return Response.json({ error: "Forbidden" }, { status: 403 });

  const comment = await prisma.comment.create({
    data: { body, taskId, userId: session.id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  await logActivity({ taskId, userId: session.id, action: "comment_added", newValue: body.slice(0, 80) });

  // Notify assignee if not the commenter
  if (task.assigneeId && task.assigneeId !== session.id) {
    await notify({
      userId: task.assigneeId,
      type: "comment_added",
      title: "Новый комментарий к задаче",
      body: `${session.name}: «${body.slice(0, 60)}»`,
      taskId,
      projectId: task.projectId,
    });
  }

  return Response.json(comment, { status: 201 });
}
