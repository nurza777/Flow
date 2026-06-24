"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, isOverdue, PRIORITY_COLORS, PRIORITY_LABELS, ACTION_LABELS } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

interface Status {
  id: string;
  name: string;
  color: string;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: User;
}

interface ActivityLog {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: User;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  aiRecommendation: string | null;
  priority: string;
  dueDate: string | null;
  statusId: string;
  assignee: User | null;
  createdBy: User;
  status: Status;
  labels: { label: { id: string; name: string; color: string } }[];
  subtasks: { id: string; title: string; status: Status; assignee: User | null }[];
  comments: Comment[];
  activityLogs: ActivityLog[];
  _count?: { subtasks: number; comments: number };
}

interface TaskDetailModalProps {
  taskId: string;
  projectId: string;
  members: User[];
  statuses: Status[];
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdated: (task: any) => void;
  onDeleted: (id: string) => void;
}

const PRIORITIES = ["urgent", "high", "medium", "low"] as const;

export default function TaskDetailModal({
  taskId,
  projectId,
  members,
  statuses,
  onClose,
  onUpdated,
  onDeleted,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [rightTab, setRightTab] = useState<"comments" | "activity">("comments");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchTask = useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}`);
    if (res.ok) {
      const data = await res.json();
      setTask(data);
      setTitle(data.title);
      setDescription(data.description || "");
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  async function updateField(field: string, value: string | null) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTask((prev) => prev ? { ...prev, ...updated } : null);
      onUpdated(updated);
    }
  }

  async function saveTitle() {
    if (!title.trim() || title === task?.title) {
      setEditing(false);
      return;
    }
    await updateField("title", title.trim());
    setEditing(false);
  }

  async function saveDescription() {
    if (description === (task?.description || "")) return;
    await updateField("description", description.trim() || null);
  }

  async function postComment() {
    if (!commentBody.trim()) return;
    setPostingComment(true);
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentBody.trim() }),
    });
    if (res.ok) {
      const comment = await res.json();
      setTask((prev) => prev ? { ...prev, comments: [...prev.comments, comment] } : null);
      setCommentBody("");
    }
    setPostingComment(false);
  }

  async function deleteTask() {
    if (!confirm("Удалить задачу?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onDeleted(taskId);
  }

  async function generateAiRecommendation() {
    setAiLoading(true);
    const res = await fetch(`/api/tasks/${taskId}/ai-recommend`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setTask((prev) => prev ? { ...prev, aiRecommendation: data.aiRecommendation } : null);
    }
    setAiLoading(false);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.dueDate);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-0">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ backgroundColor: task.status.color + "20", color: task.status.color }}
            >
              {task.status.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={deleteTask}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Удалить задачу"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {editing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                autoFocus
                className="w-full text-2xl font-bold text-slate-900 border-none outline-none focus:bg-slate-50 rounded px-0 py-1"
                suppressHydrationWarning
              />
            ) : (
              <h2
                className="text-2xl font-bold text-slate-900 cursor-text hover:bg-slate-50 rounded px-0 py-1"
                onClick={() => setEditing(true)}
              >
                {task.title}
              </h2>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5">Статус</p>
                <select
                  value={task.statusId}
                  onChange={(e) => updateField("statusId", e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  suppressHydrationWarning
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5">Приоритет</p>
                <select
                  value={task.priority}
                  onChange={(e) => updateField("priority", e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  suppressHydrationWarning
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5">Исполнитель</p>
                <select
                  value={task.assignee?.id || ""}
                  onChange={(e) => updateField("assigneeId", e.target.value || null)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  suppressHydrationWarning
                >
                  <option value="">Не назначен</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5">Дедлайн</p>
                <input
                  type="date"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => updateField("dueDate", e.target.value || null)}
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${overdue ? "border-red-300 text-red-600" : "border-slate-300"}`}
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Tech Lead Description */}
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-400 mb-2">Описание (от Тех Лида)</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveDescription}
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Добавьте описание задачи..."
              />
            </div>

            {/* AI Recommendation */}
            <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-indigo-700">✨ Рекомендация ИИ</span>
                  <span className="text-xs text-indigo-400">Claude Sonnet</span>
                </div>
                <button
                  onClick={generateAiRecommendation}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {aiLoading ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      Генерирую...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      {task.aiRecommendation ? "Обновить" : "Сгенерировать"}
                    </>
                  )}
                </button>
              </div>
              {task.aiRecommendation ? (
                <ul className="space-y-2">
                  {task.aiRecommendation
                    .split("\n")
                    .map((line) => line.replace(/^[-•*]\s*/, "").replace(/[*#]/g, "").trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                        <span className="text-indigo-400 font-medium mt-0.5 flex-shrink-0">—</span>
                        <span>{line}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-indigo-300 italic">
                  Нажмите «Сгенерировать» чтобы получить рекомендации по выполнению задачи от ИИ
                </p>
              )}
            </div>

            {task.subtasks.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-slate-400 mb-2">
                  Подзадачи ({task.subtasks.length})
                </p>
                <div className="space-y-1.5">
                  {task.subtasks.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sub.status.color }}
                      />
                      <span className="text-sm text-slate-700 flex-1">{sub.title}</span>
                      {sub.assignee && (
                        <span className="text-xs text-slate-400">{sub.assignee.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs: Comments / Activity */}
            <div>
              <div className="flex border-b border-slate-200 mb-4">
                <button
                  onClick={() => setRightTab("comments")}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${rightTab === "comments" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}
                >
                  Комментарии ({task.comments.length})
                </button>
                <button
                  onClick={() => setRightTab("activity")}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${rightTab === "activity" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}
                >
                  История
                </button>
              </div>

              {rightTab === "comments" && (
                <>
                  <div className="space-y-3 mb-4">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-indigo-700">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900">{comment.user.name}</span>
                            <span className="text-xs text-slate-400">
                              {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{comment.body}</p>
                        </div>
                      </div>
                    ))}
                    {task.comments.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">Комментариев пока нет</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <textarea
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment(); }}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Написать комментарий... (Cmd+Enter)"
                    />
                    <button
                      onClick={postComment}
                      disabled={postingComment || !commentBody.trim()}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                    >
                      Отправить
                    </button>
                  </div>
                </>
              )}

              {rightTab === "activity" && (
                <div className="space-y-2">
                  {(task.activityLogs ?? []).length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">История пуста</p>
                  )}
                  {(task.activityLogs ?? []).map((log) => (
                    <div key={log.id} className="flex gap-2.5 items-start">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-slate-600">
                          {log.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600">
                          <span className="font-medium text-slate-800">{log.user.name}</span>
                          {" "}{ACTION_LABELS[log.action] || log.action}
                          {log.oldValue && log.newValue && (
                            <span className="text-slate-400"> ({log.oldValue} → {log.newValue})</span>
                          )}
                          {!log.oldValue && log.newValue && (
                            <span className="text-slate-400"> «{log.newValue}»</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
