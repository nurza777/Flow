"use client";

import { useState } from "react";
import { formatDate, isOverdue, PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; avatar: string | null } | null;
  labels: { label: { id: string; name: string; color: string } }[];
  _count: { subtasks: number; comments: number };
}

export default function TaskCard({
  task,
  onClick,
  onDelete,
}: {
  task: Task;
  onClick: () => void;
  onDelete?: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    onDelete?.(task.id);
  }

  function cancelDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirm(false);
  }

  const overdue = isOverdue(task.dueDate);
  const dueToday = (() => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    return (
      due.getFullYear() === today.getFullYear() &&
      due.getMonth() === today.getMonth() &&
      due.getDate() === today.getDate()
    );
  })();

  return (
    <div
      draggable={!confirm}
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={confirm ? undefined : onClick}
      className="relative bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all select-none group"
    >
      {/* Delete button */}
      {onDelete && !confirm && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Удалить задачу"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Inline delete confirmation */}
      {confirm && (
        <div
          className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center gap-2 z-10 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-slate-600 font-medium text-center">Удалить задачу?</p>
          <div className="flex gap-2">
            <button
              onClick={cancelDelete}
              className="px-3 py-1 text-xs border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "..." : "Удалить"}
            </button>
          </div>
        </div>
      )}

      {/* Priority stripe */}
      {task.priority === "urgent" && (
        <div className="w-full h-0.5 bg-red-500 rounded-full mb-2 opacity-80" />
      )}

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: label.color + "20", color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-medium text-slate-900 leading-snug mb-2">{task.title}</p>

      {task.description && (
        <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Deadline badge — prominent */}
      {task.dueDate && (
        <div className={`flex items-center gap-1.5 mb-2 text-xs font-medium rounded-md px-2 py-1 w-fit ${
          overdue
            ? "bg-red-50 text-red-600 border border-red-200"
            : dueToday
            ? "bg-amber-50 text-amber-600 border border-amber-200"
            : "bg-slate-50 text-slate-500 border border-slate-200"
        }`}>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {overdue ? "Просрочено: " : dueToday ? "Сегодня: " : ""}
          {formatDate(task.dueDate)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority] || ""}`}>
            {PRIORITY_LABELS[task.priority] || task.priority}
          </span>

          {task._count.subtasks > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {task._count.subtasks}
            </span>
          )}

          {task._count.comments > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {task._count.comments}
            </span>
          )}
        </div>

        {task.assignee && (
          <div
            className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center"
            title={task.assignee.name}
          >
            <span className="text-xs font-medium text-indigo-700">
              {task.assignee.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
