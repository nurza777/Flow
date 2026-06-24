import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") redirect("/dashboard");

  const [userCount, projectCount, taskCount, users] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { assignedTasks: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const roleStats = await prisma.user.groupBy({
    by: ["role"],
    _count: { role: true },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Панель управления</h1>
        <p className="text-slate-500 mt-1">Добро пожаловать, {session.name}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Пользователей" value={userCount} color="indigo" />
        <StatCard label="Проектов" value={projectCount} color="blue" />
        <StatCard label="Задач" value={taskCount} color="green" />
        <StatCard
          label="Тех Лидов"
          value={roleStats.find((r) => r.role === "tech_lead")?._count.role ?? 0}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Пользователи по ролям</h2>
          </div>
          <div className="space-y-3">
            {roleStats.map((r) => (
              <div key={r.role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RoleBadge role={r.role} />
                </div>
                <span className="text-sm font-semibold text-slate-900">{r._count.role}</span>
              </div>
            ))}
          </div>
          <Link
            href="/admin/users"
            className="mt-4 block w-full py-2 text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Управление пользователями →
          </Link>
          <Link
            href="/admin/integrations"
            className="mt-2 block w-full py-2 text-center text-sm text-purple-600 hover:text-purple-700 font-medium border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            Настройки интеграций →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Последние пользователи</h2>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-700">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
                <RoleBadge role={u.role} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color]?.split(" ")[1] || "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = { super_admin: "Супер Админ", tech_lead: "Тех Лид", developer: "Разработчик" };
  const colors: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700",
    tech_lead: "bg-blue-100 text-blue-700",
    developer: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[role] || "bg-slate-100 text-slate-600"}`}>
      {labels[role] || role}
    </span>
  );
}
