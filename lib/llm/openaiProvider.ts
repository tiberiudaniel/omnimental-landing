import type { LLMProvider, QuestPromptInput } from "./LLMProvider";

export class OpenAIProvider implements LLMProvider {
  private apiKey: string | undefined;
  private model: string;
  constructor(opts?: { apiKey?: string; model?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY;
    this.model = opts?.model ?? "gpt-4o-mini";
  }

  async generateQuest(input: QuestPromptInput): Promise<string> {
    if (!this.apiKey) {
      // Fallback mock in development
      return JSON.stringify({
        id: `q-${Date.now()}`,
        title: input.locale === "ro" ? "Exercițiu scurt de respirație" : "Short breathing drill",
        description: input.userStyle ?? "",
        type: "action",
        difficulty: 1,
        steps: [input.locale === "ro" ? "Inspiră 4s, expiră 6s, 2 minute" : "Inhale 4s, exhale 6s for 2 minutes"],
        createdAt: Date.now(),
      });
    }
    const system = `You are Omni Sensei, a helpful mentoring assistant. Output strictly JSON for one quest: {id,title,description,type,difficulty,steps[],createdAt}. type in [reflection, action, tracking].`;
    const user = `Locale: ${input.locale ?? "ro"}\nUser style: ${input.userStyle ?? ""}\nInputs: ${(input.todayInputs ?? []).join("; ")}.`;
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    const json = await resp.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    return content as string;
  }
}

