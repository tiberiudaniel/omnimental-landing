import { NextResponse } from "next/server";
import { z } from "zod";
import { QuestSchema } from "@/lib/questSchema";
import { OpenAIProvider } from "@/lib/llm/openaiProvider";
import { getTodayInputs, getUserStyle, saveQuest } from "@/lib/data";

const BodySchema = z.object({ userId: z.string().min(1), locale: z.enum(["ro", "en"]).optional() });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
    }
    const { userId, locale = "ro" } = parsed.data;
    const [style, inputs] = await Promise.all([getUserStyle(userId), getTodayInputs(userId)]);
    const provider = new OpenAIProvider();
    const jsonString = await provider.generateQuest({ userStyle: style ?? undefined, todayInputs: inputs, locale });
    const questParsed = QuestSchema.safeParse(JSON.parse(jsonString));
    if (!questParsed.success) {
      return NextResponse.json({ error: "invalid_llm_output", details: questParsed.error.flatten() }, { status: 400 });
    }
    const quest = questParsed.data;
    await saveQuest(userId, { ...quest, createdAt: quest.createdAt ?? Date.now() });
    return NextResponse.json(quest, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "server_error", message: (e as Error).message }, { status: 500 });
  }
}

