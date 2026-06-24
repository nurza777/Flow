import { getSession } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import Anthropic from "@anthropic-ai/sdk";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = await getSetting("ANTHROPIC_API_KEY");
  if (!apiKey || apiKey === "your-api-key-here") {
    return Response.json({ message: "API-ключ не настроен" }, { status: 503 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "ping" }],
    });

    if (msg.id) {
      return Response.json({ message: "Соединение успешно! Модель ответила." });
    }
    return Response.json({ message: "Неожиданный ответ от API" }, { status: 502 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    return Response.json({ message: `Ошибка: ${message}` }, { status: 400 });
  }
}
