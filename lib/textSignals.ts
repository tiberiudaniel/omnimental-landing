"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb, ensureAuth, areWritesDisabled } from "./firebase";
import { recordTextSignalFact } from "./progressFacts";
import roLex from "@/data/lexicon.ro.json" assert { type: "json" };
import enLex from "@/data/lexicon.en.json" assert { type: "json" };
import { OMNIKUNO_MODULES, resolveModuleId, type OmniKunoModuleId } from "@/config/omniKunoModules";

type Lexicon = {
  indicators: Record<string, { tokens: string[]; synonyms?: string[] }>;
};

const MODULE_IDS: OmniKunoModuleId[] = OMNIKUNO_MODULES.map((meta) => meta.id as OmniKunoModuleId);

function buildIndex(lex: Lexicon): Record<string, OmniKunoModuleId> {
  const index: Record<string, OmniKunoModuleId> = {};
  for (const [key, entry] of Object.entries(lex.indicators || {})) {
    const dim = resolveModuleId(key);
    if (!dim) continue;
    const list = [...(entry.tokens || []), ...(entry.synonyms || [])];
    for (const t of list) index[t.toLowerCase()] = dim;
  }
  return index;
}

const STOP_RO = new Set([
  "și","sau","nici","dar","iar","că","căci","de","din","la","cu","pe","pentru","despre","în","într","între","un","o","niște","este","sunt","e","fi","am","ai","are","au","fost","mai","foarte","mult","puțin","cum","ce","care","când","unde","către","spre","îmi","mă","m-ai","te","ți","îți","eu","tu","el","ea","noi","voi","ei","ele","sa","să","a","al","ale","ai","ale","ul","ului","une","unei","unor"
]);
const STOP_EN = new Set([
  "and","or","but","the","a","an","to","of","in","on","for","with","about","is","are","am","be","been","being","it","this","that","i","you","he","she","we","they","me","my","your","their","our","as","at","by","from","into","than","then","so","very","more","less","can","could","should","would"
]);

function stripDiacritics(input: string) {
  return input.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
}

function tokenize(text: string, lang: "ro" | "en" = "ro") {
  const clean = stripDiacritics(text.toLowerCase());
  const raw = clean.split(/[^a-zăîâșța-z]+/i).filter(Boolean);
  const stop = lang === "en" ? STOP_EN : STOP_RO;
  const tokens = raw.filter((t) => t.length >= 3 && !stop.has(t));
  const counts: Record<string, number> = {};
  tokens.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  const top = sorted.slice(0, 12).map(([w]) => w);
  return { counts, top };
}

export type IndicatorCounts = Record<OmniKunoModuleId, number>;

function createIndicatorCounts(): IndicatorCounts {
  return MODULE_IDS.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {} as IndicatorCounts);
}

function mapTokensToIndicators(tokens: Record<string, number>, lang: "ro" | "en"): IndicatorCounts {
  const ic = createIndicatorCounts();
  const add = (k: OmniKunoModuleId, v = 1) => {
    ic[k] += v;
  };
  const lex = (lang === "en" ? (enLex as Lexicon) : (roLex as Lexicon));
  const index = buildIndex(lex);
  for (const [w, c] of Object.entries(tokens)) {
    const dim = index[w];
    if (dim) {
      add(dim, c);
      continue;
    }
    // Fallback heuristics if not found in lexicon
    if (lang === "ro") {
      if (/stres|anxiet|panic|relax|calm/i.test(w)) add("emotional_balance", c);
      else if (/clar|direct|deciz|focus|bloc|viziune|alege/i.test(w)) add("focus_clarity", c);
      else if (/relat|limi|partener|singur|comunic|neinteles|incredere/i.test(w)) add("relationships_communication", c);
      else if (/energ|obos|somn|dorm|echilibru|obicei|stil|sanat/i.test(w)) add("energy_body", c);
      else if (/product|obiectiv|tinta|perform|motiva|curaj|eficac|progres/i.test(w)) add("decision_discernment", c);
      else if (/sens|valo|identit|incredere|rost/i.test(w)) add("self_trust", c);
      else if (/voin|disciplin|persever|rezilien|ritual|consist|minim/i.test(w)) add("willpower_perseverance", c);
    } else {
      if (/stress|anxiet|panic|relax|calm|overwhelm|pressure/i.test(w)) add("emotional_balance", c);
      else if (/clarit|direct|decid|decision|focus|stuck|vision|choose/i.test(w)) add("focus_clarity", c);
      else if (/relat|boundar|partner|alone|communicat|misunderstood|trust/i.test(w)) add("relationships_communication", c);
      else if (/energy|tired|sleep|insom|balance|habit|lifestyle|health/i.test(w)) add("energy_body", c);
      else if (/product|goal|target|perform|motivat|courage|efficac|progress/i.test(w)) add("decision_discernment", c);
      else if (/meaning|purpose|identity|values|sense|trust/i.test(w)) add("self_trust", c);
      else if (/willpower|disciplin|persever|resilien|ritual|consisten/i.test(w)) add("willpower_perseverance", c);
    }
  }
  return ic;
}

export async function recordTextSignals(opts: { text: string; lang?: "ro" | "en"; source?: string; context?: Record<string, unknown> }) {
  const text = (opts.text || "").trim();
  if (!text) return;
  const user = await ensureAuth();
  const lang = opts.lang ?? "ro";
  const { counts, top } = tokenize(text, lang);
  const indicators = mapTokensToIndicators(counts, lang);
  try {
    await recordTextSignalFact({ indicators, tokens: top, textIndicators: computeTextIndicatorsFromLexicon(text, lang) });
  } catch {
    // noop
  }
  if (!areWritesDisabled()) {
    try {
      await addDoc(collection(getDb(), "userTextEvents"), {
        ownerUid: user?.uid ?? null,
        source: opts.source ?? null,
        context: opts.context ?? null,
        lang,
        text,
        tokens: top,
        indicators,
        timestamp: serverTimestamp(),
      });
    } catch {}
  }
}

function computeTextIndicatorsFromLexicon(text: string, lang: "ro" | "en") {
  const lex = (lang === "en" ? (enLex as Lexicon) : (roLex as Lexicon));
  const normalized = stripDiacritics(text.toLowerCase());
  const result: Record<string, { count: number; hits: string[] }> = {};
  for (const [key, entry] of Object.entries(lex.indicators || {})) {
    const tokens = [...(entry.tokens || []), ...(entry.synonyms || [])];
    let count = 0;
    const hits: string[] = [];
    for (const token of tokens) {
      const t = token.toLowerCase();
      if (!t) continue;
      if (normalized.includes(stripDiacritics(t))) {
        count += 1;
        hits.push(token);
      }
    }
    if (count > 0) {
      result[key] = { count, hits };
    }
  }
  return result;
}
