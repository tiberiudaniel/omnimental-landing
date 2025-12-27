import { CAT_VOCABULARY } from "@/config/catVocabulary";
import type { CatVocabTag } from "@/config/catVocabulary";
import { pickVocabPrimary, pickVocabSecondary, type MatchContext } from "@/lib/vocab/matching";

const TAGS: CatVocabTag[] = ["clarity_low", "reactive", "energy_low"];
const DAYS = 7;

function formatDayKey(base: Date, offset: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const vocabBank = Object.values(CAT_VOCABULARY);

function simulateTag(tag: CatVocabTag) {
  const start = new Date("2025-01-01T00:00:00Z");
  const recent: string[] = [];
  const lastShownById: Record<string, string> = {};
  console.log(`\nTag: ${tag}`);
  for (let day = 0; day < DAYS; day += 1) {
    const dayKey = formatDayKey(start, day);
    const previousDayKey = day > 0 ? formatDayKey(start, day - 1) : null;
    const ctx: MatchContext = {
      mindInfoAnswerTagPrimary: tag,
      recentVocabIds: [...recent],
      avoidDayKeys: previousDayKey ? [dayKey, previousDayKey] : [dayKey],
      lastShownById: { ...lastShownById },
      shownTodayCount: 0,
    };
    const primary = pickVocabPrimary(ctx, vocabBank);
    const secondary = pickVocabSecondary(
      {
        ...ctx,
        recentVocabIds: primary ? [primary.id, ...recent] : [...recent],
      },
      vocabBank,
      primary,
    );
    const lineParts = [
      dayKey,
      `primary=${primary?.id ?? "none"}`,
      `secondary=${secondary?.id ?? "-"}`,
    ];
    console.log(lineParts.join(" | "));
    if (primary) {
      recent.unshift(primary.id);
      lastShownById[primary.id] = dayKey;
    }
    if (secondary) {
      recent.unshift(secondary.id);
      lastShownById[secondary.id] = dayKey;
    }
    if (recent.length > 7) {
      recent.length = 7;
    }
  }
}

TAGS.forEach(simulateTag);
