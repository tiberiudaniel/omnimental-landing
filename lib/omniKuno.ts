import type { OmniKunoMiniTestConfig, OmniKunoQuestion, OmniKunoTopicKey } from './omniKunoTypes';
import { omniKunoRelatiiMiniTestConfig, omniKunoRelatiiQuestions } from './omniKunoRelatii';
import { omniKunoCalmMiniTestConfig, omniKunoCalmQuestions } from './omniKunoCalm';
import { omniKunoClaritateMiniTestConfig, omniKunoClaritateQuestions } from './omniKunoClaritate';
import { omniKunoPerformantaMiniTestConfig, omniKunoPerformantaQuestions } from './omniKunoPerformanta';
import { omniKunoEnergieMiniTestConfig, omniKunoEnergieQuestions } from './omniKunoEnergie';
import { omniKunoObiceiuriMiniTestConfig, omniKunoObiceiuriQuestions } from './omniKunoObiceiuri';
import { omniKunoSensMiniTestConfig, omniKunoSensQuestions } from './omniKunoSens';

export type PrimaryDimensionKey = OmniKunoTopicKey;

export interface OnboardingContext {
  primaryDimension: PrimaryDimensionKey;
  cloudTags: string[];
}

export function getOmniKunoMiniTest(ctx: OnboardingContext): { topicKey: OmniKunoTopicKey; questions: OmniKunoQuestion[] } | null {
  switch (ctx.primaryDimension) {
    case 'relatii': {
      const config: OmniKunoMiniTestConfig = omniKunoRelatiiMiniTestConfig;
      const all = omniKunoRelatiiQuestions;
      const questions = config.questionIds
        .map((id) => all.find((q) => q.id === id))
        .filter((q): q is typeof all[number] => Boolean(q));
      return { topicKey: config.topicKey, questions };
    }
    case 'calm': {
      const config: OmniKunoMiniTestConfig = omniKunoCalmMiniTestConfig;
      const all = omniKunoCalmQuestions;
      const questions = config.questionIds
        .map((id) => all.find((q) => q.id === id))
        .filter((q): q is typeof all[number] => Boolean(q));
      return { topicKey: config.topicKey, questions };
    }
    case 'identitate': {
      const config: OmniKunoMiniTestConfig = omniKunoClaritateMiniTestConfig;
      const all = omniKunoClaritateQuestions;
      const questions = config.questionIds
        .map((id) => all.find((q) => q.id === id))
        .filter((q): q is typeof all[number] => Boolean(q));
      return { topicKey: config.topicKey, questions };
    }
    case 'performanta': {
      const config: OmniKunoMiniTestConfig = omniKunoPerformantaMiniTestConfig;
      const all = omniKunoPerformantaQuestions;
      const questions = config.questionIds
        .map((id) => all.find((q) => q.id === id))
        .filter((q): q is typeof all[number] => Boolean(q));
      return { topicKey: config.topicKey, questions };
    }
    case 'energie': {
      const config: OmniKunoMiniTestConfig = omniKunoEnergieMiniTestConfig;
      const all = omniKunoEnergieQuestions;
      const questions = config.questionIds
        .map((id) => all.find((q) => q.id === id))
        .filter((q): q is typeof all[number] => Boolean(q));
      return { topicKey: config.topicKey, questions };
    }
    case 'obiceiuri': {
      const config: OmniKunoMiniTestConfig = omniKunoObiceiuriMiniTestConfig;
      const all = omniKunoObiceiuriQuestions;
      const questions = config.questionIds
        .map((id) => all.find((q) => q.id === id))
        .filter((q): q is typeof all[number] => Boolean(q));
      return { topicKey: config.topicKey, questions };
    }
    case 'sens': {
      const config: OmniKunoMiniTestConfig = omniKunoSensMiniTestConfig;
      const all = omniKunoSensQuestions;
      const questions = config.questionIds
        .map((id) => all.find((q) => q.id === id))
        .filter((q): q is typeof all[number] => Boolean(q));
      return { topicKey: config.topicKey, questions };
    }
    default:
      return null;
  }
}
