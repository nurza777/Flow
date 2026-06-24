import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return Response.json([]);

  const tasks = await prisma.task.findMany({
    where: {
      project: { members: { some: { userId: session.id } } },
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
      ],
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      status: { select: { name: true, color: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const serialized = tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return Response.json(serialized);
}
