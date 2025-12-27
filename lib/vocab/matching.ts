"use client";

import type { CatVocabCard, CatVocabTag } from "@/config/catVocabulary";

export type MatchContext = {
  mindInfoAnswerTagPrimary?: CatVocabTag;
  mindInfoAnswerTagsSecondary?: CatVocabTag[];
  recentVocabIds: string[];
  shownTodayCount?: number;
  todayKey?: string;
  avoidDayKeys?: string[];
  lastShownById?: Record<string, string>;
};

const SECONDARY_TRIGGER_TAGS = new Set<CatVocabTag>(["reactive", "self_critical", "stuck", "energy_low"]);

function parseDayKey(dayKey?: string) {
  if (!dayKey) return null;
  const date = new Date(dayKey);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

function sortCandidates(candidates: CatVocabCard[], ctx: Pick<MatchContext, "lastShownById">) {
  const lastMap = ctx.lastShownById ?? {};
  return [...candidates].sort((a, b) => {
    const weightDelta = (b.weight ?? 1) - (a.weight ?? 1);
    if (Math.abs(weightDelta) > 0.0001) return weightDelta;
    const aSeen = parseDayKey(lastMap[a.id]);
    const bSeen = parseDayKey(lastMap[b.id]);
    if (aSeen !== bSeen) {
      if (aSeen == null) return -1;
      if (bSeen == null) return 1;
      return aSeen - bSeen;
    }
    return a.id.localeCompare(b.id);
  });
}

function applyAvailabilityFilters(
  candidates: CatVocabCard[],
  avoidIds: Set<string>,
  ctx: Pick<MatchContext, "avoidDayKeys" | "lastShownById">,
) {
  const avoidDays = new Set(ctx.avoidDayKeys ?? []);
  return candidates.filter((card) => {
    if (avoidIds.has(card.id)) return false;
    if (ctx.lastShownById) {
      const seenDay = ctx.lastShownById[card.id];
      if (seenDay && avoidDays.has(seenDay)) {
        return false;
      }
    }
    return true;
  });
}

function collectCandidates(
  vocabBank: CatVocabCard[],
  matchTags: CatVocabTag[] | undefined,
  selector: (card: CatVocabCard) => CatVocabTag[] | undefined,
) {
  if (!matchTags || !matchTags.length) return [];
  const tagSet = new Set(matchTags);
  return vocabBank.filter((card) => {
    const tags = selector(card) ?? [];
    return tags.some((tag) => tagSet.has(tag));
  });
}

function filterWithSoftAvoid(candidates: CatVocabCard[], softAvoid: Set<string>) {
  if (!softAvoid.size || candidates.length === 0) return candidates;
  const filtered = candidates.filter((card) => !softAvoid.has(card.id));
  return filtered.length >= 3 ? filtered : candidates;
}

export function pickVocabPrimary(ctx: MatchContext, vocabBank: CatVocabCard[]): CatVocabCard {
  const idToCard = new Map(vocabBank.map((card) => [card.id, card] as const));
  const softIds = new Set(ctx.recentVocabIds.slice(0, 5));
  const filterCtx = { avoidDayKeys: ctx.avoidDayKeys, lastShownById: ctx.lastShownById };

  const chooseFromPool = (pool: CatVocabCard[], allowBufferOverride: boolean): CatVocabCard | null => {
    if (!pool.length) return null;
    const nonBufferBase = applyAvailabilityFilters(
      pool.filter((card) => !card.isBuffer),
      new Set<string>(),
      filterCtx,
    );
    let nonBufferPool = filterWithSoftAvoid(nonBufferBase, softIds);
    if (!nonBufferPool.length) {
      nonBufferPool = nonBufferBase;
    }
    if (nonBufferPool.length) {
      return sortCandidates(nonBufferPool, { lastShownById: ctx.lastShownById })[0] ?? null;
    }

    const bufferBase = applyAvailabilityFilters(
      pool.filter((card) => card.isBuffer),
      new Set<string>(),
      filterCtx,
    );
    if (!bufferBase.length) return null;
    let bufferPool = filterWithSoftAvoid(bufferBase, softIds);
    if (!bufferPool.length) {
      bufferPool = bufferBase;
    }
    if (!bufferPool.length) return null;

    const recentBufferHit = ctx.recentVocabIds
      .slice(0, 3)
      .some((id) => (idToCard.get(id)?.isBuffer ?? false));
    if (recentBufferHit && !allowBufferOverride) {
      return null;
    }
    return sortCandidates(bufferPool, { lastShownById: ctx.lastShownById })[0] ?? null;
  };

  const primaryTag = ctx.mindInfoAnswerTagPrimary;
  let tagCandidates = collectCandidates(
    vocabBank,
    primaryTag ? [primaryTag] : undefined,
    (card) => card.tagsPrimary,
  );
  if (!tagCandidates.length && ctx.mindInfoAnswerTagsSecondary?.length) {
    tagCandidates = collectCandidates(vocabBank, ctx.mindInfoAnswerTagsSecondary, (card) => card.tagsSecondary);
  }

  const fromTagged = chooseFromPool(tagCandidates, false);
  if (fromTagged) return fromTagged;

  const fromGlobal = chooseFromPool(vocabBank, true);
  return fromGlobal ?? vocabBank[0];
}

export function pickVocabSecondary(
  ctx: MatchContext,
  vocabBank: CatVocabCard[],
  primaryCard: CatVocabCard,
): CatVocabCard | null {
  const shownToday = ctx.shownTodayCount ?? 0;
  if (shownToday > 0) return null;
  const triggerTags = [ctx.mindInfoAnswerTagPrimary, ...(ctx.mindInfoAnswerTagsSecondary ?? [])]
    .filter(Boolean)
    .map((tag) => tag as CatVocabTag);
  const hasTrigger = triggerTags.some((tag) => SECONDARY_TRIGGER_TAGS.has(tag));
  if (!hasTrigger) return null;
  let candidates = collectCandidates(vocabBank, triggerTags, (card) => card.tagsSecondary);
  if (!candidates.length) {
    candidates = collectCandidates(vocabBank, triggerTags, (card) => card.tagsPrimary);
  }
  if (!candidates.length) return null;
  const primaryTag = primaryCard.tagsPrimary[0];
  candidates = candidates.filter((card) => card.tagsPrimary[0] !== primaryTag && !card.isBuffer);
  const hardSet = new Set<string>([primaryCard.id]);
  const base = applyAvailabilityFilters(candidates, hardSet, {
    avoidDayKeys: ctx.avoidDayKeys,
    lastShownById: ctx.lastShownById,
  });
  const softIds = new Set(ctx.recentVocabIds.slice(0, 5));
  let available = filterWithSoftAvoid(base, softIds);
  if (!available.length) {
    available = base;
  }
  if (!available.length) return null;
  const sorted = sortCandidates(available, { lastShownById: ctx.lastShownById });
  return sorted[0] ?? null;
}
