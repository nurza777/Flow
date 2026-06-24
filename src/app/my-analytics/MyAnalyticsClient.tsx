"use client";

import Link from "next/link";
import { PRIORITY_COLORS, PRIORITY_LABELS, formatDate, isOverdue } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  status: { name: string; color: string };
  project: { id: string; name: string; color: string };
}

interface Stats {
  total: number;
  completed: number;
  overdue: number;
  inProgress: number;
  recentDone: number;
  completionRate: number;
  onTimeRate: number;
  avgDays: number;
}

function RateBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{value}%</span>
      </div>
      <div className="bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function MyAnalyticsClient({
  tasks,
  stats,
  userName,
}: {
  tasks: Task[];
  stats: Stats;
  userName: string;
}) {
  const activeTasks = tasks.filter((t) => t.status.name !== "Готово");
  const overdueTasks = activeTasks.filter((t) => isOverdue(t.dueDate));

  function getPerformanceTip(): string {
    if (stats.overdue > 3) return "У вас много просроченных задач. Сосредоточьтесь на их закрытии.";
    if (stats.onTimeRate < 50) return "Старайтесь планировать время выполнения задач точнее.";
    if (stats.completionRate > 80) return "Отличный результат! Продолжайте в том же темпе.";
    if (stats.inProgress > 5) return "У вас много задач в работе. Завершите начатое перед стартом нового.";
    return "Хорошая работа! Держите дедлайны под контролем.";
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Моя аналитика</h1>
        <p className="text-slate-500 mt-1">{userName} — персональная статистика</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Всего задач</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Выполнено</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">В работе</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Просрочено</p>
          <p className={`text-3xl font-bold mt-1 ${stats.overdue > 0 ? "text-red-500" : "text-slate-300"}`}>
            {stats.overdue}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Performance metrics */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Показатели эффективности</h2>
          <div className="space-y-4">
            <RateBar value={stats.completionRate} color="bg-indigo-500" label="Выполнение задач" />
            <RateBar
              value={stats.onTimeRate}
              color={stats.onTimeRate >= 70 ? "bg-green-500" : "bg-orange-400"}
              label="Сдача в срок"
            />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div className="text-center bg-slate-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-slate-900">
                {stats.avgDays > 0 ? `${stats.avgDays}д` : "—"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Среднее время</p>
            </div>
            <div className="text-center bg-slate-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-indigo-600">{stats.recentDone}</p>
              <p className="text-xs text-slate-400 mt-0.5">За 30 дней</p>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900 mb-1">Рекомендация</p>
                <p className="text-sm text-indigo-700">{getPerformanceTip()}</p>
              </div>
            </div>
          </div>

          {overdueTasks.length > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <p className="text-sm font-semibold text-red-900 mb-2">
                Просроченные задачи ({overdueTasks.length})
              </p>
              <div className="space-y-1.5">
                {overdueTasks.slice(0, 3).map((t) => (
                  <Link
                    key={t.id}
                    href={`/projects/${t.project.id}?task=${t.id}`}
                    className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="truncate">{t.title}</span>
                    <span className="text-xs text-red-400 flex-shrink-0">{formatDate(t.dueDate)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active tasks list */}
      {activeTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Активные задачи ({activeTasks.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {activeTasks.map((task) => {
              const overdue = isOverdue(task.dueDate);
              return (
                <Link
                  key={task.id}
                  href={`/projects/${task.project.id}?task=${task.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <span
                    className="w-1.5 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.project.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{task.project.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority] ?? ""}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: task.status.color + "20", color: task.status.color }}
                    >
                      {task.status.name}
                    </span>
                    {task.dueDate && (
                      <span className={`text-xs ${overdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
