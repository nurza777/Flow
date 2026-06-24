import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import IntegrationsClient from "./IntegrationsClient";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") redirect("/dashboard");

  const rows = await prisma.setting.findMany({ where: { key: { in: ["ANTHROPIC_API_KEY"] } } });
  const dbKey = rows.find((r) => r.key === "ANTHROPIC_API_KEY");

  // Determine current source and masked value
  const hasDbKey = !!dbKey?.value;
  const hasEnvKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your-api-key-here";

  function mask(v: string) {
    if (!v || v.length < 8) return "••••••••";
    return v.slice(0, 6) + "•".repeat(Math.min(v.length - 9, 20)) + v.slice(-3);
  }

  const currentMasked = hasDbKey
    ? mask(dbKey!.value)
    : hasEnvKey
    ? mask(process.env.ANTHROPIC_API_KEY!)
    : null;

  const source: "db" | "env" | null = hasDbKey ? "db" : hasEnvKey ? "env" : null;

  return (
    <IntegrationsClient
      currentMasked={currentMasked}
      source={source}
      updatedAt={dbKey?.updatedAt?.toISOString() ?? null}
    />
  );
}
