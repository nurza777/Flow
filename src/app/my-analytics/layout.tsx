import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export default async function MyAnalyticsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { deletedAt: null, members: { some: { userId: session.id } } },
    select: { id: true, name: true, color: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={{ name: session.name, email: session.email, role: session.role }} projects={projects} />
      <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  );
}
