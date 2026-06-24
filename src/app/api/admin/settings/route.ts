import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Keys that are safe to expose (masked) to the client
const ALLOWED_KEYS = ["ANTHROPIC_API_KEY"];

// GET — return all settings (values masked for sensitive keys)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.setting.findMany({
    where: { key: { in: ALLOWED_KEYS } },
  });

  const settings: Record<string, { value: string; masked: string; updatedAt: string }> = {};
  for (const row of rows) {
    const masked = maskKey(row.value);
    settings[row.key] = {
      value: row.value,
      masked,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  // Include env-only keys that haven't been saved to DB yet
  for (const key of ALLOWED_KEYS) {
    if (!settings[key] && process.env[key]) {
      settings[key] = {
        value: "",
        masked: maskKey(process.env[key]!),
        updatedAt: "",
      };
    }
  }

  return Response.json(settings);
}

// PATCH — upsert a setting
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key, value } = await request.json();

  if (!ALLOWED_KEYS.includes(key)) {
    return Response.json({ error: "Недопустимый ключ" }, { status: 400 });
  }
  if (!value?.trim()) {
    return Response.json({ error: "Значение не может быть пустым" }, { status: 400 });
  }

  await prisma.setting.upsert({
    where: { key },
    create: { key, value: value.trim() },
    update: { value: value.trim() },
  });

  return Response.json({ ok: true, masked: maskKey(value.trim()) });
}

// DELETE — remove a setting (falls back to .env)
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key } = await request.json();
  if (!ALLOWED_KEYS.includes(key)) {
    return Response.json({ error: "Недопустимый ключ" }, { status: 400 });
  }

  await prisma.setting.deleteMany({ where: { key } });
  return Response.json({ ok: true });
}

function maskKey(value: string): string {
  if (!value || value.length < 8) return "••••••••";
  return value.slice(0, 6) + "•".repeat(Math.min(value.length - 9, 20)) + value.slice(-3);
}
