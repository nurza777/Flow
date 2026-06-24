export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-500 bg-red-50",
  high: "text-orange-500 bg-orange-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-green-600 bg-green-50",
};

export const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Срочно",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const MONTHS_RU = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const due = new Date(date);
  const today = new Date();
  // Compare date-only so tasks due today are not counted as overdue
  return due.getFullYear() * 10000 + due.getMonth() * 100 + due.getDate() <
    today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
}

export const ACTION_LABELS: Record<string, string> = {
  created: "создал задачу",
  status_changed: "изменил статус",
  priority_changed: "изменил приоритет",
  assignee_changed: "изменил исполнителя",
  title_changed: "изменил название",
  description_changed: "изменил описание",
  comment_added: "добавил комментарий",
  due_date_changed: "изменил дедлайн",
};
