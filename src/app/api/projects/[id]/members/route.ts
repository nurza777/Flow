import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return Response.json(members);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "developer") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const { userId } = await request.json();

  // super_admin can always manage members; others must be project members
  if (session.role !== "super_admin") {
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: session.id },
    });
    if (!isMember) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (existing) return Response.json({ error: "Уже участник" }, { status: 400 });

  const member = await prisma.projectMember.create({
    data: { userId, projectId, role: "member" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return Response.json(member, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "developer") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const { userId } = await request.json();

  if (session.role !== "super_admin") {
    const myMembership = await prisma.projectMember.findFirst({
      where: { projectId, userId: session.id },
    });
    if (!myMembership) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Super admin members cannot be removed from projects
  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (targetUser?.role === "super_admin") {
    return Response.json({ error: "Нельзя убрать супер администратора из проекта" }, { status: 403 });
  }

  await prisma.projectMember.deleteMany({ where: { projectId, userId } });
  return Response.json({ ok: true });
}
