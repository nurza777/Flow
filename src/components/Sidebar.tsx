"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import NotificationBell from "./notifications/NotificationBell";
import GlobalSearch from "./GlobalSearch";
import ThemeToggle from "./ThemeToggle";
import EditProjectModal from "./projects/EditProjectModal";
import ProjectAccessModal from "./projects/ProjectAccessModal";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface SidebarProps {
  user: { name: string; email: string; role: string };
  projects: Project[];
}

function NavLink({ href, icon, children, exact = false }: { href: string; icon: React.ReactNode; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function ProjectItem({
  project,
  active,
  canEdit,
  onEdit,
  onAccess,
  onDelete,
}: {
  project: Project;
  active: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onAccess: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div className="group flex items-center rounded-lg hover:bg-slate-50 transition-colors">
      <Link
        href={`/projects/${project.id}`}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm flex-1 min-w-0 ${
          active ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600"
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
        <span className="truncate">{project.name}</span>
      </Link>

      {canEdit && (
        <div ref={menuRef} className="relative flex-shrink-0 pr-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={() => { setMenuOpen(false); onEdit(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Редактировать
              </button>
              <button
                onClick={() => { setMenuOpen(false); onAccess(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Доступ к проекту
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                В корзину
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ user, projects }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accessProject, setAccessProject] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    await fetch(`/api/projects/${deleteConfirm.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteConfirm(null);
    if (pathname === `/projects/${deleteConfirm.id}`) {
      router.push("/dashboard");
    }
    router.refresh();
  }

  const isSuperAdmin = user.role === "super_admin";
  const isTechLead = user.role === "tech_lead";
  const isDeveloper = user.role === "developer";
  const canEdit = isSuperAdmin || isTechLead;

  return (
    <>
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="font-semibold text-slate-900 flex-1">Flow</span>
            <ThemeToggle />
            <NotificationBell />
          </div>
          <div className="mt-3">
            <GlobalSearch />
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
          {/* Super Admin menu */}
          {isSuperAdmin && (
            <>
              <NavLink href="/dashboard" exact icon={<HomeIcon />}>Дашборд</NavLink>
              <NavLink href="/admin" icon={<ShieldIcon />}>Управление</NavLink>
              <NavLink href="/admin/users" icon={<UsersIcon />}>Пользователи</NavLink>
              <NavLink href="/admin/integrations" icon={<PlugIcon />}>Интеграции</NavLink>
              <NavLink href="/chat" icon={<ChatIcon />}>Сообщения</NavLink>
              <NavLink href="/trash" icon={<TrashIcon />}>Корзина</NavLink>
            </>
          )}

          {/* Tech Lead menu */}
          {isTechLead && (
            <>
              <NavLink href="/dashboard" exact icon={<HomeIcon />}>Дашборд</NavLink>
              <NavLink href="/team" icon={<UsersIcon />}>Команда</NavLink>
              <NavLink href="/team/analytics" icon={<ChartIcon />}>Аналитика</NavLink>
              <NavLink href="/chat" icon={<ChatIcon />}>Сообщения</NavLink>
              <NavLink href="/trash" icon={<TrashIcon />}>Корзина</NavLink>
            </>
          )}

          {/* Developer menu */}
          {isDeveloper && (
            <>
              <NavLink href="/dashboard" exact icon={<HomeIcon />}>Мои задачи</NavLink>
              <NavLink href="/my-analytics" icon={<ChartIcon />}>Моя аналитика</NavLink>
              <NavLink href="/chat" icon={<ChatIcon />}>Сообщения</NavLink>
            </>
          )}

          {/* Projects section (admin and tech lead) */}
          {(isSuperAdmin || isTechLead) && (
            <>
              <div className="pt-3 pb-1">
                <div className="flex items-center justify-between px-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Проекты
                  </span>
                  <Link
                    href="/dashboard?new=1"
                    className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-indigo-600 rounded"
                    title="Новый проект"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                </div>
              </div>
              <div className="space-y-0.5">
                {projects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    active={pathname === `/projects/${project.id}`}
                    canEdit={canEdit}
                    onEdit={() => setEditingId(project.id)}
                    onAccess={() => setAccessProject({ id: project.id, name: project.name })}
                    onDelete={() => setDeleteConfirm({ id: project.id, name: project.name })}
                  />
                ))}
                {projects.length === 0 && (
                  <p className="text-xs text-slate-400 px-3 py-2">Нет проектов</p>
                )}
              </div>
            </>
          )}

          {/* Developer project list (read-only) */}
          {isDeveloper && projects.length > 0 && (
            <>
              <div className="pt-3 pb-1 px-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Проекты</span>
              </div>
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === `/projects/${project.id}`
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <Link
            href="/profile"
            className={`flex items-center gap-2.5 px-2 py-1.5 mb-1 rounded-lg hover:bg-slate-50 transition-colors ${pathname === "/profile" ? "bg-slate-100" : ""}`}
          >
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 font-semibold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600"}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Выйти
          </button>
        </div>
      </aside>

      {/* Edit project modal */}
      {editingId && (
        <EditProjectModal projectId={editingId} onClose={() => setEditingId(null)} />
      )}

      {/* Project access modal */}
      {accessProject && (
        <ProjectAccessModal
          projectId={accessProject.id}
          projectName={accessProject.name}
          onClose={() => setAccessProject(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">Переместить в корзину?</h3>
            <p className="text-sm text-slate-500 mb-5">
              Проект <span className="font-medium text-slate-700">{deleteConfirm.name}</span> будет перемещён в корзину. Через 7 дней он удалится автоматически.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Удаляем..." : "В корзину"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HomeIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function UsersIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function ShieldIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
function ChartIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function ChatIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function TrashIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function PlugIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>;
}
