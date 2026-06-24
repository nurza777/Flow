"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const COLORS = [
  "#6366f1", "#3b82f6", "#14b8a6", "#22c55e",
  "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899",
];

interface DocFile {
  name: string;
  size: number;
  type: string;
}

export default function NewProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [tab, setTab] = useState<"basic" | "description">("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newDocs: DocFile[] = files
      .filter((f) => f.size <= 10 * 1024 * 1024)
      .map((f) => ({ name: f.name, size: f.size, type: f.type }));
    setDocs((prev) => [...prev, ...newDocs]);
    e.target.value = "";
  }

  function removeDoc(idx: number) {
    setDocs((prev) => prev.filter((_, i) => i !== idx));
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        longDesc: longDesc.trim() || null,
        documents: docs.length > 0 ? docs : null,
        color,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Ошибка создания проекта");
      return;
    }

    router.push(`/projects/${data.id}`);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">Новый проект</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setTab("basic")}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "basic" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}
          >
            Основное
          </button>
          <button
            type="button"
            onClick={() => setTab("description")}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === "description" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}
          >
            Описание проекта
            {(longDesc || docs.length > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            {tab === "basic" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Название <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Название проекта"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Краткое описание</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Одна строка для карточки проекта"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Цвет</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: c }}
                      >
                        {color === c && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === "description" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Подробное описание проекта</label>
                  <p className="text-xs text-slate-400 mb-2">Markdown: архитектура, стек, соглашения, правила</p>
                  <textarea
                    value={longDesc}
                    onChange={(e) => setLongDesc(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-y"
                    placeholder={"# Проект\n\n## Цель\n\n## Стек технологий\n\n## Соглашения по коду"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Прикреплённые документы</label>
                  <p className="text-xs text-slate-400 mb-2">PDF, изображения, текстовые файлы (до 10 МБ)</p>

                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.doc,.docx"
                    onChange={handleFileAdd}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm text-slate-400">Нажмите чтобы добавить файлы</span>
                  </button>

                  {docs.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {docs.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          <span className="text-xs text-slate-700 flex-1 truncate">{doc.name}</span>
                          <span className="text-xs text-slate-400">{formatSize(doc.size)}</span>
                          <button type="button" onClick={() => removeDoc(i)} className="text-slate-300 hover:text-red-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 px-5 pb-5 flex-shrink-0 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Создаём..." : "Создать проект"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
