"use client";

import { useState, useEffect } from "react";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Супер Админ",
  tech_lead: "Тех Лид",
  developer: "Разработчик",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-50 text-red-700",
  tech_lead: "bg-indigo-50 text-indigo-700",
  developer: "bg-green-50 text-green-700",
};

interface Member {
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; role: string };
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProjectAccessModal({
  projectId,
  projectName,
  onClose,
}: {
  projectId: string;
  projectName: string;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/members`).then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([m, u]) => {
      setMembers(Array.isArray(m) ? m : []);
      setAllUsers(Array.isArray(u) ? u : []);
      setLoading(false);
    });
  }, [projectId]);

  const memberIds = new Set(members.map((m) => m.userId));
  const available = allUsers.filter((u) => !memberIds.has(u.id));

  async function handleAdd() {
    if (!selectedUserId) return;
    setAdding(true);
    setError("");
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка");
      setAdding(false);
      return;
    }
    setMembers((prev) => [...prev, data]);
    setSelectedUserId("");
    setAdding(false);
  }

  async function handleRemove(userId: string) {
    setRemoving(userId);
    await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
    setRemoving(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Доступ к проекту</h2>
            <p className="text-xs text-slate-400 mt-0.5">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Add member */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Добавить участника</label>
            {error && (
              <p className="text-xs text-red-600 mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                disabled={loading || available.length === 0}
              >
                <option value="">
                  {loading ? "Загрузка..." : available.length === 0 ? "Все добавлены" : "Выберите пользователя..."}
                </option>
                {available.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {ROLE_LABELS[u.role] ?? u.role}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!selectedUserId || adding}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {adding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : "Добавить"}
              </button>
            </div>
          </div>

          {/* Members list */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Участники
              <span className="ml-1.5 text-xs font-normal text-slate-400">({members.length})</span>
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Нет участников</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-indigo-700">
                        {m.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{m.user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{m.user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLORS[m.user.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {ROLE_LABELS[m.user.role] ?? m.user.role}
                    </span>
                    {m.user.role === "super_admin" ? (
                      <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <button
                        onClick={() => handleRemove(m.userId)}
                        disabled={removing === m.userId}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                        title="Убрать из проекта"
                      >
                        {removing === m.userId ? (
                          <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
