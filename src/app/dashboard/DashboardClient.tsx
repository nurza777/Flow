"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NewProjectModal from "@/components/projects/NewProjectModal";
import { PRIORITY_COLORS, PRIORITY_LABELS, formatDate, isOverdue } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  color: string;
  description: string | null;
  createdAt: string;
  _count: { tasks: number };
  members: { userId: string }[];
}

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string; color: string };
  status: { name: string; color: string };
}

export default function DashboardClient({
  projects,
  myTasks,
  userName,
  userRole,
}: {
  projects: Project[];
  myTasks: Task[];
  userName: string;
  userRole?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowNewProject(true);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Привет, {userName.split(" ")[0]}
          </h1>
          <p className="text-slate-500 mt-1">Обзор ваших проектов и задач</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Новый проект
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Всего проектов</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{projects.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Моих задач</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{myTasks.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Просрочено</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {myTasks.filter((t) => isOverdue(t.dueDate)).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Проекты</h2>
          {projects.length === 0 ? (
            <div
              onClick={() => setShowNewProject(true)}
              className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">Создать первый проект</p>
              <p className="text-xs text-slate-400 mt-1">Нажмите чтобы начать</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: project.color + "20" }}
                  >
                    <div
                      className="w-full h-full rounded-lg flex items-center justify-center"
                    >
                      <span className="text-sm font-bold" style={{ color: project.color }}>
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{project.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-slate-400">{project._count.tasks} задач</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Мои задачи</h2>
          {myTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-400">Нет активных задач</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.project.id}?task=${task.id}`}
                  className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div
                    className="w-1.5 h-full min-h-[2rem] rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: task.project.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{task.project.name}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority] ?? ""}`}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                  </div>
                  {task.dueDate && (
                    <span
                      className={`text-xs flex-shrink-0 ${isOverdue(task.dueDate) ? "text-red-500 font-medium" : "text-slate-400"}`}
                    >
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
    </div>
  );
}
