export type QuestPromptInput = {
  userStyle?: string;
  todayInputs?: string[];
  locale?: "ro" | "en";
};

export interface LLMProvider {
  generateQuest(input: QuestPromptInput): Promise<string>; // returns JSON string for Quest or array of Quests
}

