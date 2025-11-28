import type { OmniKunoQuestion, OmniKunoTopicKey } from './omniKunoTypes';
import { omniKunoRelatiiQuestions } from './omniKunoRelatii';
import { omniKunoCalmQuestions } from './omniKunoCalm';
import { omniKunoClaritateQuestions } from './omniKunoClaritate';
import { omniKunoPerformantaQuestions } from './omniKunoPerformanta';
import { omniKunoEnergieQuestions } from './omniKunoEnergie';
import { omniKunoObiceiuriQuestions } from './omniKunoObiceiuri';
import { omniKunoSensQuestions } from './omniKunoSens';

function poolFor(key: OmniKunoTopicKey): OmniKunoQuestion[] {
  switch (key) {
    case 'relatii': return omniKunoRelatiiQuestions;
    case 'calm': return omniKunoCalmQuestions;
    case 'identitate': return omniKunoClaritateQuestions;
    case 'performanta': return omniKunoPerformantaQuestions;
    case 'energie': return omniKunoEnergieQuestions;
    case 'obiceiuri': return omniKunoObiceiuriQuestions;
    case 'sens': return omniKunoSensQuestions;
    default: return [];
  }
}

function scoreByTags(q: OmniKunoQuestion, tags: string[] | undefined): number {
  if (!tags || !tags.length) return 0;
  const hay = `${q.facet || ''} ${q.text}`.toLowerCase();
  let s = 0;
  for (const t of tags) {
    const needle = String(t || '').toLowerCase();
    if (!needle) continue;
    if (hay.includes(needle)) s += 2;
    // heuristic mappings
    if (/conflict|tensiune|cearta|limite|boundary|limit/.test(needle) && /conflict|limit/.test(hay)) s += 3;
    if (/oboseal|energie|sleep|somn/.test(needle) && /energie|sleep|somn/.test(hay)) s += 2;
  }
  return s;
}

function pickPrimary(list: OmniKunoQuestion[], max = 5, tags?: string[]): OmniKunoQuestion[] {
  const items = list.filter((q) => q.isOnboarding);
  const knowledge = items.filter((q) => q.style === 'knowledge');
  const scenario = items.filter((q) => q.style === 'scenario');
  const reflection = items.filter((q) => q.style === 'reflection');
  const micro = items.filter((q) => q.style === 'microSkill');
  const out: OmniKunoQuestion[] = [];
  // At least 2 knowledge if available
  knowledge
    .slice()
    .sort((a, b) => scoreByTags(b, tags) - scoreByTags(a, tags) || (a.order || 0) - (b.order || 0))
    .slice(0, 2)
    .forEach((q) => out.push(q));
  // 1 scenario if available
  if (scenario.length) {
    const srt = scenario.slice().sort((a, b) => scoreByTags(b, tags) - scoreByTags(a, tags) || (a.order || 0) - (b.order || 0));
    out.push(srt[0]!);
  }
  // 1 reflection if available
  if (reflection.length) {
    const srt = reflection.slice().sort((a, b) => scoreByTags(b, tags) - scoreByTags(a, tags) || (a.order || 0) - (b.order || 0));
    out.push(srt[0]!);
  }
  // 1 micro if available
  if (micro.length) {
    const srt = micro.slice().sort((a, b) => scoreByTags(b, tags) - scoreByTags(a, tags) || (a.order || 0) - (b.order || 0));
    out.push(srt[0]!);
  }
  // Fill remaining by order from knowledge then others
  const byOrder = (a: OmniKunoQuestion, b: OmniKunoQuestion) => (a.order || 0) - (b.order || 0);
  const used = new Set(out.map((q) => q.id));
  const filler = [...knowledge, ...reflection, ...scenario, ...micro]
    .filter((q) => !used.has(q.id))
    .sort((a, b) => scoreByTags(b, tags) - scoreByTags(a, tags) || byOrder(a, b));
  for (const q of filler) {
    if (out.length >= max) break;
    out.push(q);
  }
  return out.slice(0, max);
}

function pickSecondary(list: OmniKunoQuestion[], max = 3, tags?: string[]): OmniKunoQuestion[] {
  const items = list.filter((q) => q.isOnboarding);
  const knowledge = items.filter((q) => q.style === 'knowledge');
  const reflection = items.filter((q) => q.style === 'reflection');
  const byOrder = (a: OmniKunoQuestion, b: OmniKunoQuestion) => (a.order || 0) - (b.order || 0);
  const out: OmniKunoQuestion[] = [];
  knowledge
    .slice()
    .sort((a, b) => scoreByTags(b, tags) - scoreByTags(a, tags) || byOrder(a, b))
    .slice(0, 2)
    .forEach((q) => out.push(q));
  reflection
    .slice()
    .sort((a, b) => scoreByTags(b, tags) - scoreByTags(a, tags) || byOrder(a, b))
    .slice(0, 1)
    .forEach((q) => out.push(q));
  return out.slice(0, max);
}

export function getOnboardingQuestions(primary: OmniKunoTopicKey, secondary?: OmniKunoTopicKey | null, cloudTags?: string[] | null): OmniKunoQuestion[] {
  const p = pickPrimary(poolFor(primary), 5, cloudTags || undefined);
  const s = secondary && secondary !== primary ? pickSecondary(poolFor(secondary), 3, cloudTags || undefined) : [];
  // Deduplicate by id and limit total to 7–8
  const map = new Map<string, OmniKunoQuestion>();
  [...p, ...s].forEach((q) => map.set(q.id, q));
  const all = Array.from(map.values());
  return all.slice(0, Math.min(8, Math.max(7, all.length)));
}
