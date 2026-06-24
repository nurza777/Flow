"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TaskCard from "./TaskCard";
import NewTaskModal from "./NewTaskModal";
import TaskDetailModal from "./TaskDetailModal";
import ProjectAccessModal from "../projects/ProjectAccessModal";
import { PRIORITY_LABELS, isOverdue } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueDate: string | null;
  order: number;
  statusId: string;
  assignee: User | null;
  labels: { label: Label }[];
  _count: { subtasks: number; comments: number };
}

interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Project {
  id: string;
  name: string;
  color: string;
  description: string | null;
  statuses: Status[];
  members: { role: string; user: User }[];
  tasks: Task[];
}

const PRIORITIES = ["urgent", "high", "medium", "low"];

export default function KanbanBoard({
  project,
  currentUserId,
  currentUserRole,
  readOnly = false,
}: {
  project: Project;
  currentUserId: string;
  currentUserRole?: string;
  readOnly?: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<"my" | "all">(readOnly ? "my" : "all");
  const [deletingProject, setDeletingProject] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(project.tasks);
  const [newTaskStatusId, setNewTaskStatusId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Filters
  const [filterText, setFilterText] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);

  const activeFilters = filterText || filterAssignee || filterPriority || filterOverdue;

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (taskId) setSelectedTaskId(taskId);
  }, [searchParams]);

  const filteredTasks = useMemo(() => {
    let base = readOnly && tab === "my"
      ? tasks.filter((t) => t.assignee?.id === currentUserId)
      : tasks;

    if (filterText) {
      const q = filterText.toLowerCase();
      base = base.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (filterAssignee) {
      base = base.filter((t) => t.assignee?.id === filterAssignee);
    }
    if (filterPriority) {
      base = base.filter((t) => t.priority === filterPriority);
    }
    if (filterOverdue) {
      base = base.filter((t) => t.dueDate && isOverdue(t.dueDate));
    }
    return base;
  }, [tasks, tab, readOnly, currentUserId, filterText, filterAssignee, filterPriority, filterOverdue]);

  function getTasksByStatus(statusId: string) {
    return filteredTasks
      .filter((t) => t.statusId === statusId)
      .sort((a, b) => a.order - b.order);
  }

  async function handleTaskMove(taskId: string, newStatusId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.statusId === newStatusId) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, statusId: newStatusId } : t))
    );

    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId: newStatusId }),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleNewTask(task: any) {
    setTasks((prev) => [...prev, task as Task]);
    setNewTaskStatusId(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleTaskUpdated(updated: any) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? (updated as Task) : t)));
  }

  function handleTaskDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTaskId(null);
    router.replace(`/projects/${project.id}`);
  }

  function handleCloseDetail() {
    setSelectedTaskId(null);
    router.replace(`/projects/${project.id}`);
  }

  async function handleDeleteProject() {
    if (!confirm(`Переместить проект «${project.name}» в корзину? Через 7 дней он будет удалён автоматически.`)) return;
    setDeletingProject(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  const members = project.members.map((m) => m.user);

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: project.color + "20" }}
          >
            <span className="font-bold text-sm" style={{ color: project.color }}>
              {project.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{project.name}</h1>
            {project.description && (
              <p className="text-xs text-slate-400">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center"
                title={m.name}
              >
                <span className="text-xs font-medium text-indigo-700">
                  {m.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-slate-600">+{members.length - 4}</span>
              </div>
            )}
          </div>
          {(currentUserRole === "super_admin" || currentUserRole === "tech_lead") && (
            <button
              onClick={() => setShowAccess(true)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Доступ
            </button>
          )}
          <span className="text-xs text-slate-400">{tasks.length} задач</span>
          {(currentUserRole === "super_admin" || currentUserRole === "tech_lead") && !readOnly && (
            <button
              onClick={handleDeleteProject}
              disabled={deletingProject}
              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Переместить в корзину"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Developer tabs */}
      {readOnly && (
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setTab("my")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "my"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Мои задачи
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "all"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Все задачи проекта
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 py-2.5 bg-white border-b border-slate-200 flex-wrap">
        <div className="relative flex-1 min-w-36">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Фильтр по названию..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
            suppressHydrationWarning
          />
        </div>

        {!readOnly && (
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            suppressHydrationWarning
          >
            <option value="">Все исполнители</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          suppressHydrationWarning
        >
          <option value="">Все приоритеты</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p] || p}</option>
          ))}
        </select>

        <button
          onClick={() => setFilterOverdue((v) => !v)}
          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
            filterOverdue
              ? "bg-red-50 border-red-300 text-red-600 font-medium"
              : "border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100"
          }`}
        >
          Просроченные
        </button>

        {activeFilters && (
          <button
            onClick={() => { setFilterText(""); setFilterAssignee(""); setFilterPriority(""); setFilterOverdue(false); }}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5"
          >
            Сбросить
          </button>
        )}

        {activeFilters && (
          <span className="text-xs text-slate-400">
            {filteredTasks.length} из {tasks.length}
          </span>
        )}
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full" style={{ minWidth: `${project.statuses.length * 300}px` }}>
          {project.statuses.map((status) => {
            const columnTasks = getTasksByStatus(status.id);

            return (
              <div
                key={status.id}
                className="flex flex-col w-72 flex-shrink-0"
                onDragOver={readOnly ? undefined : (e) => e.preventDefault()}
                onDrop={readOnly ? undefined : (e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData("taskId");
                  if (taskId) handleTaskMove(taskId, status.id);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm font-semibold text-slate-700">{status.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-1.5">
                      {columnTasks.length}
                    </span>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => setNewTaskStatusId(status.id)}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTaskId(task.id)}
                      onDelete={readOnly ? undefined : handleTaskDeleted}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center transition-colors"
                      onClick={readOnly ? undefined : () => setNewTaskStatusId(status.id)}
                    >
                      <p className="text-xs text-slate-400">
                        {readOnly ? "Нет задач" : "Перетащите задачу или нажмите +"}
                      </p>
                    </div>
                  )}
                </div>

                {!readOnly && (
                  <button
                    onClick={() => setNewTaskStatusId(status.id)}
                    className="mt-2 w-full py-2 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Добавить задачу
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {newTaskStatusId && (
        <NewTaskModal
          projectId={project.id}
          statusId={newTaskStatusId}
          members={members}
          onClose={() => setNewTaskStatusId(null)}
          onCreated={handleNewTask}
        />
      )}

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={project.id}
          members={members}
          statuses={project.statuses}
          onClose={handleCloseDetail}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}

      {showAccess && (
        <ProjectAccessModal
          projectId={project.id}
          projectName={project.name}
          onClose={() => setShowAccess(false)}
        />
      )}
    </div>
  );
}
