import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { name, email, password, role } = await request.json();

  if (!name || !email || !password) {
    return Response.json({ error: "Заполните все поля" }, { status: 400 });
  }

  // Self-registration is only allowed if no users exist yet, otherwise must be admin/tech_lead
  const userCount = await prisma.user.count();
  const session = await getSession();

  if (userCount > 0 && !session) {
    return Response.json({ error: "Регистрация закрыта" }, { status: 403 });
  }

  // Role assignment rules
  let assignedRole = "developer";
  if (session?.role === "super_admin") {
    assignedRole = role || "developer";
  } else if (session?.role === "tech_lead") {
    assignedRole = "developer"; // tech leads can only create developers
  } else if (userCount === 0) {
    assignedRole = role || "developer"; // first user
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email уже используется" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: assignedRole,
      createdById: session?.id ?? null,
    },
  });

  // Only create session if self-registering (no existing session)
  if (!session) {
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  }

  return Response.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
