"use client";

interface DevStat {
  id: string;
  name: string;
  email: string;
  total: number;
  completed: number;
  overdue: number;
  inProgress: number;
  completionRate: number;
  onTimeRate: number;
  avgDays: number;
}

function RateBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-600 w-8 text-right">{value}%</span>
    </div>
  );
}

function getPerformanceLabel(rate: number): { label: string; color: string } {
  if (rate >= 80) return { label: "Отлично", color: "text-green-600 bg-green-50" };
  if (rate >= 60) return { label: "Хорошо", color: "text-blue-600 bg-blue-50" };
  if (rate >= 40) return { label: "Средне", color: "text-yellow-600 bg-yellow-50" };
  return { label: "Требует внимания", color: "text-red-600 bg-red-50" };
}

export default function TeamAnalyticsClient({ stats }: { stats: DevStat[] }) {
  if (stats.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Аналитика команды</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">В вашей команде нет разработчиков</p>
          <p className="text-sm text-slate-400 mt-1">Добавьте разработчиков в разделе «Команда»</p>
        </div>
      </div>
    );
  }

  const avgCompletion = Math.round(stats.reduce((a, s) => a + s.completionRate, 0) / stats.length);
  const avgOnTime = Math.round(stats.reduce((a, s) => a + s.onTimeRate, 0) / stats.length);
  const totalOverdue = stats.reduce((a, s) => a + s.overdue, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Аналитика команды</h1>
        <p className="text-slate-500 mt-1">{stats.length} разработчиков в команде</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Средний % выполнения</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{avgCompletion}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Вовремя (в среднем)</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{avgOnTime}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Просрочено задач</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{totalOverdue}</p>
        </div>
      </div>

      <div className="space-y-4">
        {stats
          .sort((a, b) => b.completionRate - a.completionRate)
          .map((dev) => {
            const perf = getPerformanceLabel(dev.completionRate);
            return (
              <div key={dev.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-indigo-700">
                        {dev.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{dev.name}</p>
                      <p className="text-xs text-slate-400">{dev.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${perf.color}`}>
                    {perf.label}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900">{dev.total}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Всего задач</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-600">{dev.completed}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Выполнено</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-orange-500">{dev.inProgress}</p>
                    <p className="text-xs text-slate-400 mt-0.5">В работе</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xl font-bold ${dev.overdue > 0 ? "text-red-500" : "text-slate-300"}`}>
                      {dev.overdue}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Просрочено</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500">Выполнение задач</span>
                    </div>
                    <RateBar value={dev.completionRate} color="bg-indigo-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500">Сдача в срок</span>
                    </div>
                    <RateBar value={dev.onTimeRate} color={dev.onTimeRate >= 70 ? "bg-green-500" : "bg-orange-400"} />
                  </div>
                </div>

                {dev.avgDays > 0 && (
                  <p className="text-xs text-slate-400 mt-3">
                    Среднее время выполнения задачи: <span className="font-medium text-slate-600">{dev.avgDays} дн.</span>
                  </p>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
