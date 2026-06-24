import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/tasks/KanbanBoard";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, members: { some: { userId: session.id } } },
    include: {
      statuses: { orderBy: { order: "asc" } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          labels: { include: { label: true } },
          _count: { select: { subtasks: true, comments: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!project) notFound();

  const serialized = {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    tasks: project.tasks.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  };

  const isReadOnly = session.role === "developer";

  return (
    <KanbanBoard
      project={serialized}
      currentUserId={session.id}
      currentUserRole={session.role}
      readOnly={isReadOnly}
    />
  );
}
