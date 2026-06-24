import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: session.id, receiverId: userId },
        { senderId: userId, receiverId: session.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Mark as read
  await prisma.chatMessage.updateMany({
    where: { senderId: userId, receiverId: session.id, read: false },
    data: { read: true },
  });

  return Response.json(
    messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: receiverId } = await params;
  const { body } = await request.json();

  if (!body?.trim()) return Response.json({ error: "Пустое сообщение" }, { status: 400 });

  // Check receiver exists and is accessible (dev can msg tech lead of their project, tech lead can msg any dev)
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, name: true, role: true },
  });
  if (!receiver) return Response.json({ error: "Пользователь не найден" }, { status: 404 });

  const msg = await prisma.chatMessage.create({
    data: { body: body.trim(), senderId: session.id, receiverId },
  });

  return Response.json({ ...msg, createdAt: msg.createdAt.toISOString() }, { status: 201 });
}
