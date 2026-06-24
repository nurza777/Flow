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

export default function DeveloperDashboard({
  tasks,
  userName,
  overdueCount,
}: {
  tasks: Task[];
  userName: string;
  overdueCount: number;
}) {
  const active = tasks.filter((t) => t.status.name !== "Готово");
  const done = tasks.filter((t) => t.status.name === "Готово");
  const inProgress = tasks.filter((t) => t.status.name === "В работе");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Привет, {userName.split(" ")[0]}
          </h1>
          <p className="text-slate-500 mt-1">Ваши задачи и прогресс</p>
        </div>
        <Link
          href="/my-analytics"
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Моя аналитика
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Активных задач</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{active.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">В работе</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{inProgress.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Выполнено</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{done.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Просрочено</p>
          <p className={`text-3xl font-bold mt-1 ${overdueCount > 0 ? "text-red-500" : "text-slate-300"}`}>
            {overdueCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Мои задачи ({active.length})</h2>
          {overdueCount > 0 && (
            <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full font-medium">
              {overdueCount} просрочено
            </span>
          )}
        </div>

        {active.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">Нет активных задач</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {active.map((task) => {
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
                      <span className={`text-xs min-w-[60px] text-right ${overdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
