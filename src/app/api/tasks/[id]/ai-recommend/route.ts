import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = await getSetting("ANTHROPIC_API_KEY");
  if (!apiKey || apiKey === "your-api-key-here") {
    return Response.json(
      { error: "API-ключ Anthropic не настроен. Перейдите в Настройки → Интеграции." },
      { status: 503 }
    );
  }

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, project: { members: { some: { userId: session.id } } } },
    include: {
      project: { select: { name: true, description: true, longDesc: true } },
      status: true,
      assignee: { select: { name: true } },
    },
  });

  if (!task) return Response.json({ error: "Not found" }, { status: 404 });

  const client = new Anthropic({ apiKey });

  const prompt = `Ты опытный тех лид. Дай краткую рекомендацию по выполнению задачи — 3-5 конкретных пунктов.

Задача: ${task.title}
Описание: ${task.description || "не указано"}
Проект: ${task.project.name}
Приоритет: ${task.priority}
Статус: ${task.status.name}
Исполнитель: ${task.assignee?.name || "не назначен"}
${task.project.longDesc ? `Описание проекта: ${task.project.longDesc.slice(0, 500)}` : ""}

Требования к формату:
- Пиши на русском языке
- Каждый пункт начинай с тире (- )
- Не используй символы * и #
- Не используй жирный текст и заголовки
- Не более 150 слов`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const recommendation = (message.content[0] as { type: string; text: string }).text;

  const updated = await prisma.task.update({
    where: { id },
    data: { aiRecommendation: recommendation },
  });

  return Response.json({ aiRecommendation: updated.aiRecommendation });
}
