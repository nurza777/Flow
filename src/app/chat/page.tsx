import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import ChatClient from "./ChatClient";

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const sidebarProjects = await prisma.project.findMany({
    where: { deletedAt: null, members: { some: { userId: session.id } } },
    select: { id: true, name: true, color: true },
  });

  // Available contacts: for developer → tech leads of their projects; for tech lead → their devs; for admin → all
  let contacts: { id: string; name: string; role: string; email: string }[] = [];

  if (session.role === "developer") {
    // Find tech leads of projects the developer is in
    const projectIds = await prisma.projectMember.findMany({
      where: { userId: session.id },
      select: { projectId: true },
    });
    const techLeads = await prisma.user.findMany({
      where: {
        role: "tech_lead",
        projects: { some: { projectId: { in: projectIds.map((p) => p.projectId) } } },
        id: { not: session.id },
      },
      select: { id: true, name: true, role: true, email: true },
    });
    contacts = techLeads;
  } else if (session.role === "tech_lead") {
    // Find all developers created by this tech lead
    const devs = await prisma.user.findMany({
      where: { role: "developer", createdById: session.id },
      select: { id: true, name: true, role: true, email: true },
    });
    contacts = devs;
  } else {
    // Super admin can chat with everyone
    const everyone = await prisma.user.findMany({
      where: { id: { not: session.id } },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: "asc" },
    });
    contacts = everyone;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={{ name: session.name, email: session.email, role: session.role }} projects={sidebarProjects} />
      <main className="flex-1 overflow-hidden">
        <ChatClient
          currentUser={{ id: session.id, name: session.name, role: session.role }}
          contacts={contacts}
        />
      </main>
    </div>
  );
}
