import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      members: { some: { userId: session.id } },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(projects);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, longDesc, documents, color } = await request.json();
  if (!name) return Response.json({ error: "Название обязательно" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name,
      description,
      longDesc: longDesc || null,
      documents: documents ? JSON.stringify(documents) : null,
      color: color || "#6366f1",
      members: {
        create: { userId: session.id, role: "owner" },
      },
      statuses: {
        createMany: {
          data: [
            { name: "Бэклог", color: "#94a3b8", order: 0 },
            { name: "В работе", color: "#3b82f6", order: 1 },
            { name: "На проверке", color: "#f59e0b", order: 2 },
            { name: "Готово", color: "#22c55e", order: 3 },
          ],
        },
      },
    },
    include: {
      statuses: true,
      members: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return Response.json(project, { status: 201 });
}
