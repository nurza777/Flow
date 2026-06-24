"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TrashedProject {
  id: string;
  name: string;
  color: string;
  description: string | null;
  deletedAt: string;
  _count: { tasks: number };
  members: { user: { id: string; name: string } }[];
}

function daysLeft(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime();
  const purgeAt = deleted + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function TrashClient({
  projects: initial,
  isSuperAdmin,
}: {
  projects: TrashedProject[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function restore(id: string) {
    setLoading(id);
    await fetch(`/api/projects/${id}/restore`, { method: "POST" });
    setProjects((p) => p.filter((x) => x.id !== id));
    setLoading(null);
    router.refresh();
  }

  async function purge(id: string, name: string) {
    if (!confirm(`Удалить «${name}» навсегда? Это действие необратимо.`)) return;
    setLoading(id);
    await fetch(`/api/projects/${id}/purge`, { method: "DELETE" });
    setProjects((p) => p.filter((x) => x.id !== id));
    setLoading(null);
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Корзина</h1>
          <p className="text-slate-500 text-sm mt-0.5">Проекты хранятся 7 дней, затем удаляются автоматически</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Корзина пуста</p>
          <p className="text-slate-400 text-sm mt-1">Удалённые проекты появятся здесь</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const days = daysLeft(p.deletedAt);
            const urgent = days <= 1;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: p.color + "20" }}
                >
                  <span className="font-bold text-sm" style={{ color: p.color }}>
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgent ? "bg-red-100 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                      {days === 0 ? "удаляется сегодня" : `${days} дн. до удаления`}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-sm text-slate-400 mt-0.5 truncate">{p.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">
                    {p._count.tasks} задач · удалён {new Date(p.deletedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => restore(p.id)}
                    disabled={loading === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                    Восстановить
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => purge(p.id, p.name)}
                      disabled={loading === p.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Удалить навсегда
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
