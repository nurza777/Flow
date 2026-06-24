import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return Response.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, currentPassword, newPassword } = await request.json();

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, string> = {};

  if (name && name !== user.name) {
    updateData.name = name.trim();
  }

  if (newPassword) {
    if (!currentPassword) {
      return Response.json({ error: "Введите текущий пароль" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return Response.json({ error: "Неверный текущий пароль" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json({ error: "Новый пароль минимум 6 символов" }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "Нет изменений" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });

  // Refresh session with new name
  await createSession({ id: updated.id, email: updated.email, name: updated.name, role: updated.role });

  return Response.json(updated);
}
