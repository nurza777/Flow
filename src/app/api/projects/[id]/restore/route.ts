import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "developer") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await prisma.project.update({ where: { id }, data: { deletedAt: null } });
  return Response.json({ ok: true });
}
