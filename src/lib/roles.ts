export type Role = "super_admin" | "tech_lead" | "developer";

export function canManageUsers(role: string) {
  return role === "super_admin" || role === "tech_lead";
}

export function canCreateTechLead(role: string) {
  return role === "super_admin";
}

export function canManageProjects(role: string) {
  return role === "super_admin" || role === "tech_lead";
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Супер Админ",
  tech_lead: "Тех Лид",
  developer: "Разработчик",
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  tech_lead: "bg-blue-100 text-blue-700",
  developer: "bg-green-100 text-green-700",
};
