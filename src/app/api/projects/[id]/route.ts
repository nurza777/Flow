import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(session.role !== "super_admin" && { members: { some: { userId: session.id } } }),
    },
    include: {
      statuses: { orderBy: { order: "asc" } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          createdBy: { select: { id: true, name: true } },
          labels: { include: { label: true } },
          _count: { select: { subtasks: true, comments: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await request.json();

  const member = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.id, role: "owner" },
  });
  if (!member && session.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.longDesc !== undefined && { longDesc: data.longDesc }),
      ...(data.documents !== undefined && {
        documents: data.documents ? JSON.stringify(data.documents) : null,
      }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });

  return Response.json(updated);
}

// Soft delete → move to trash
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.id, role: "owner" },
  });
  if (!member && session.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  return Response.json({ ok: true });
}
