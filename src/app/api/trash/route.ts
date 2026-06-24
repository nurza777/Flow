import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role === "developer") return Response.json({ error: "Forbidden" }, { status: 403 });

  // Auto-purge projects deleted more than 7 days ago
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.project.deleteMany({ where: { deletedAt: { lt: cutoff } } });

  const projects = await prisma.project.findMany({
    where: {
      deletedAt: { not: null },
      ...(session.role !== "super_admin" && { members: { some: { userId: session.id } } }),
    },
    include: {
      _count: { select: { tasks: true } },
      members: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { deletedAt: "desc" },
  });

  const serialized = projects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt!.toISOString(),
  }));

  return Response.json(serialized);
}
