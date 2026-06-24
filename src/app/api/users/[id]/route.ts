import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { name, email, password, role } = await request.json();

  // Tech lead can only edit their own developers
  if (session.role === "tech_lead") {
    const user = await prisma.user.findFirst({ where: { id, createdById: session.id } });
    if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Super admin account can only be edited by the super admin themselves
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (target?.role === "super_admin" && id !== session.id) {
    return Response.json({ error: "Нельзя изменить аккаунт супер администратора" }, { status: 403 });
  }

  const data: Record<string, string> = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.password = await bcrypt.hash(password, 10);
  // Super admin role cannot be changed by anyone (including themselves)
  if (role && session.role === "super_admin" && target?.role !== "super_admin") {
    data.role = role;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true },
  });

  return Response.json(updated);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.id) {
    return Response.json({ error: "Нельзя удалить себя" }, { status: 400 });
  }

  // Super admin accounts cannot be deleted
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (target?.role === "super_admin") {
    return Response.json({ error: "Нельзя удалить супер администратора" }, { status: 403 });
  }

  if (session.role === "tech_lead") {
    const user = await prisma.user.findFirst({ where: { id, createdById: session.id } });
    if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });
  return Response.json({ ok: true });
}
