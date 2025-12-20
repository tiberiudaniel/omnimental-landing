"use client";

import { useMemo } from "react";
import { CAT_VOCABULARY, type CatVocabCard } from "@/config/catVocabulary";

const DEFAULT_VOCAB_ID = "clarity_fog";

export function resolveVocab(vocabId?: string | null): CatVocabCard {
  if (vocabId && CAT_VOCABULARY[vocabId]) {
    return CAT_VOCABULARY[vocabId];
  }
  return CAT_VOCABULARY[DEFAULT_VOCAB_ID];
}

export function useVocab(vocabId?: string | null) {
  return useMemo(() => resolveVocab(vocabId), [vocabId]);
}
