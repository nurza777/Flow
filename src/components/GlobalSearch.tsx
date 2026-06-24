"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string; color: string };
  status: { name: string; color: string };
  assignee: { id: string; name: string } | null;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleQueryChange(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
      setLoading(false);
    }, 300);
  }

  function handleSelect(r: SearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/projects/${r.project.id}?task=${r.id}`);
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <span className="flex-1 text-left">Поиск...</span>
        <kbd className="text-xs bg-white border border-slate-300 rounded px-1 font-mono">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div ref={ref} className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Найти задачи..."
                className="flex-1 text-sm outline-none text-slate-800 placeholder:text-slate-400"
                autoFocus
              />
              {loading && (
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              )}
              <button onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Esc</button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 && query.length >= 2 && !loading && (
                <div className="p-6 text-center text-sm text-slate-400">Ничего не найдено</div>
              )}
              {results.length === 0 && query.length < 2 && (
                <div className="p-6 text-center text-sm text-slate-400">Введите минимум 2 символа</div>
              )}
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: r.project.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400">{r.project.name}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: r.status.color }}
                        >
                          {r.status.name}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[r.priority] || ""}`}>
                          {PRIORITY_LABELS[r.priority] || r.priority}
                        </span>
                      </div>
                    </div>
                    {r.assignee && (
                      <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">{r.assignee.name}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {results.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">
                {results.length} результатов — Enter для выбора, Esc для закрытия
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
