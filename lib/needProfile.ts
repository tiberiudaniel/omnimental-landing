import type { NeedOptionId, NeedChannelTag } from '@/config/needSurveyConfig';

export interface NeedProfile {
  primaryOptionId: NeedOptionId | null;
  secondaryOptionId: NeedOptionId | null;
  primaryTag: NeedChannelTag | null;
  allTags: NeedChannelTag[];
  selfEfficacyScore: number | null;
}

interface AnswerPayload {
  selectedOptionsQ1: NeedOptionId[]; // max 2
  selfEfficacyScoreQ2?: number; // 1-5
  optionToTags: Record<NeedOptionId, NeedChannelTag[]>;
}

export function buildNeedProfile(payload: AnswerPayload): NeedProfile {
  const { selectedOptionsQ1, selfEfficacyScoreQ2, optionToTags } = payload;

  const primaryOptionId = selectedOptionsQ1[0] ?? null;
  const secondaryOptionId = selectedOptionsQ1[1] ?? null;

  const tagsSet = new Set<NeedChannelTag>();
  selectedOptionsQ1.forEach((opt) => {
    (optionToTags[opt] ?? []).forEach((tag) => tagsSet.add(tag));
  });
  const allTags = Array.from(tagsSet);

  const primaryTag =
    primaryOptionId && optionToTags[primaryOptionId]?.length
      ? optionToTags[primaryOptionId][0]
      : allTags[0] ?? null;

  return {
    primaryOptionId,
    secondaryOptionId,
    primaryTag,
    allTags,
    selfEfficacyScore: selfEfficacyScoreQ2 ?? null,
  };
}

