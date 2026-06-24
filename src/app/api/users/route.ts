import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageUsers, canCreateTechLead } from "@/lib/roles";

export async function GET() {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const where =
    session.role === "tech_lead"
      ? { createdById: session.id }
      : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { assignedTasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(users);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password, role } = await request.json();

  if (!name || !email || !password) {
    return Response.json({ error: "Заполните все поля" }, { status: 400 });
  }

  // Tech lead can only create developers
  const assignedRole =
    session.role === "super_admin" && canCreateTechLead(session.role) && role === "tech_lead"
      ? "tech_lead"
      : session.role === "super_admin" && role === "super_admin"
      ? "super_admin"
      : "developer";

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
      createdById: session.id,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return Response.json(user, { status: 201 });
}
