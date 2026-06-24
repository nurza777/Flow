import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/chat — list of conversation partners
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Get all unique partners
  const [sent, received] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { senderId: session.id },
      select: { receiverId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.chatMessage.findMany({
      where: { receiverId: session.id },
      select: { senderId: true, createdAt: true, read: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const partnerIds = new Set<string>();
  sent.forEach((m) => partnerIds.add(m.receiverId));
  received.forEach((m) => partnerIds.add(m.senderId));

  if (partnerIds.size === 0) return Response.json([]);

  const partners = await prisma.user.findMany({
    where: { id: { in: Array.from(partnerIds) } },
    select: { id: true, name: true, role: true, email: true },
  });

  // Unread count per partner
  const unreadCounts = await prisma.chatMessage.groupBy({
    by: ["senderId"],
    where: { receiverId: session.id, read: false },
    _count: { id: true },
  });

  // Latest message per partner
  const conversations = await Promise.all(
    partners.map(async (p) => {
      const last = await prisma.chatMessage.findFirst({
        where: {
          OR: [
            { senderId: session.id, receiverId: p.id },
            { senderId: p.id, receiverId: session.id },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
      const unread = unreadCounts.find((u) => u.senderId === p.id)?._count.id ?? 0;
      return {
        partner: p,
        lastMessage: last ? { ...last, createdAt: last.createdAt.toISOString() } : null,
        unread,
      };
    })
  );

  return Response.json(conversations.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? "";
    const bTime = b.lastMessage?.createdAt ?? "";
    return bTime.localeCompare(aTime);
  }));
}
