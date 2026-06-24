"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  currentMasked: string | null;
  source: "db" | "env" | null;
  updatedAt: string | null;
}

export default function IntegrationsClient({ currentMasked, source, updatedAt }: Props) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [masked, setMasked] = useState(currentMasked);
  const [currentSource, setCurrentSource] = useState(source);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState(updatedAt);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    if (!apiKey.trim()) return;
    setError("");
    setSuccess("");
    setSaving(true);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "ANTHROPIC_API_KEY", value: apiKey.trim() }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Ошибка сохранения");
      return;
    }

    setMasked(data.masked);
    setCurrentSource("db");
    setCurrentUpdatedAt(new Date().toISOString());
    setSuccess("API-ключ сохранён в базе данных");
    setApiKey("");
    router.refresh();
  }

  async function testKey() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/settings/test", { method: "POST" });
      const data = await res.json();
      setTestResult({ ok: res.ok, message: data.message || (res.ok ? "Соединение успешно!" : "Ошибка соединения") });
    } catch {
      setTestResult({ ok: false, message: "Сетевая ошибка при проверке" });
    }
    setTesting(false);
  }

  async function deleteKey() {
    setDeleting(true);
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "ANTHROPIC_API_KEY" }),
    });
    setDeleting(false);
    if (res.ok) {
      setMasked(null);
      setCurrentSource(null);
      setCurrentUpdatedAt(null);
      setConfirmDelete(false);
      setSuccess("Ключ удалён из базы данных");
      router.refresh();
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Интеграции</h1>
        <p className="text-slate-500 mt-1">Управление внешними API и сервисами</p>
      </div>

      {/* Anthropic AI Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        {/* Card header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-lg">✦</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Anthropic Claude</h2>
              {currentSource ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium border border-green-200">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Подключено
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  Не настроено
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Используется для генерации AI-рекомендаций к задачам (модель claude-sonnet-4-6)
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {success}
            </div>
          )}

          {/* Current key status */}
          {masked && (
            <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">Текущий ключ</p>
                <p className="font-mono text-sm text-slate-500 mt-0.5">{masked}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${currentSource === "db" ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"}`}>
                    {currentSource === "db" ? "Из базы данных" : "Из .env файла"}
                  </span>
                  {currentUpdatedAt && (
                    <span className="text-xs text-slate-400">
                      Обновлён {new Date(currentUpdatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Test connection */}
          {masked && (
            <div>
              {testResult && (
                <div className={`mb-3 flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {testResult.ok ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                  )}
                  {testResult.message}
                </div>
              )}
              <button
                onClick={testKey}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {testing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Проверяю...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                    Проверить соединение
                  </>
                )}
              </button>
            </div>
          )}

          {/* New key input */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {masked ? "Заменить API-ключ" : "Введите API-ключ Anthropic"}
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Ключ хранится в базе данных и имеет приоритет над переменной окружения{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">ANTHROPIC_API_KEY</code>
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={show ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full pr-10 px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {show ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={save}
                disabled={saving || !apiKey.trim()}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Сохраняю...</>
                ) : "Сохранить"}
              </button>
            </div>
          </div>

          {/* Delete from DB */}
          {currentSource === "db" && (
            <div className="border-t border-slate-100 pt-4">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Удалить ключ из базы данных
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 flex-1">Удалить ключ из БД? (fallback на .env)</p>
                  <button
                    onClick={deleteKey}
                    disabled={deleting}
                    className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                  >
                    {deleting ? "Удаляю..." : "Да, удалить"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-white"
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info block */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Приоритет источника ключа</p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>База данных (задаётся здесь — наивысший приоритет)</li>
              <li>Переменная окружения <code className="bg-blue-100 px-1 rounded">ANTHROPIC_API_KEY</code> в <code className="bg-blue-100 px-1 rounded">.env</code></li>
            </ol>
            <p className="text-xs text-blue-500 mt-2">
              Ключ из БД позволяет менять его без перезапуска сервера и без доступа к файловой системе.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
