export type NeedOptionId =
  | 'need_info'
  | 'need_plan'
  | 'need_examples'
  | 'need_social'
  | 'need_beliefs'
  | 'need_benefits'
  | 'need_motivation'
  | 'need_consistency'
  | 'need_other';

export type NeedChannelTag =
  | 'channel_education'
  | 'channel_action_plan'
  | 'channel_social_support'
  | 'channel_motivation'
  | 'channel_self_efficacy'
  | 'channel_values_benefits'
  | 'channel_consistency';

export type NeedSurveyConfig = {
  questions: Array<
    | {
        id: 'need_q1_main';
        type: 'multi_select';
        label: { ro: string; en: string };
        description?: { ro: string; en: string };
        minSelections: number;
        maxSelections: number;
        options: Array<{
          id: NeedOptionId;
          label: { ro: string; en: string };
          subtitle?: { ro: string; en: string };
          channelTags: NeedChannelTag[];
          hasFreeText?: boolean;
        }>;
      }
    | {
        id: 'need_q2_self_efficacy';
        type: 'likert_1_5';
        label: { ro: string; en: string };
        description?: { ro: string; en: string };
      }
  >;
};

export const NEED_SURVEY_CONFIG: NeedSurveyConfig = {
  questions: [
    {
      id: 'need_q1_main',
      type: 'multi_select',
      label: {
        ro: 'Pe tema pe care vrei să lucrezi acum, ce te-ar ajuta cel mai mult în următoarele 4–8 săptămâni? Poți alege maximum 2 variante.',
        en: 'For the topic you want to work on now, what would help you the most over the next 4–8 weeks? You can choose up to 2 options.',
      },
      minSelections: 1,
      maxSelections: 2,
      options: [
        {
          id: 'need_info',
          label: {
            ro: 'Am nevoie să înțeleg mai bine ce am de făcut.',
            en: 'I need to better understand what I actually have to do.',
          },
          subtitle: {
            ro: 'Informații clare despre ce înseamnă problema mea și ce opțiuni am.',
            en: 'Clear information about what my issue means and what options I have.',
          },
          channelTags: ['channel_education'],
        },
        {
          id: 'need_plan',
          label: {
            ro: 'Am nevoie de pași concreți, un plan sau o rutină.',
            en: 'I need concrete steps, a plan or a routine.',
          },
          subtitle: {
            ro: 'Instrucțiuni specifice: ce să fac azi, mâine, săptămâna asta.',
            en: 'Specific instructions: what to do today, tomorrow, this week.',
          },
          channelTags: ['channel_action_plan'],
        },
        {
          id: 'need_examples',
          label: {
            ro: 'Am nevoie de exemple și povești reale.',
            en: 'I need examples and real stories.',
          },
          subtitle: {
            ro: 'Să aud cum au procedat alții, ce le-a mers și ce nu.',
            en: "To hear how others did it, what worked and what didn’t.",
          },
          channelTags: ['channel_education', 'channel_motivation'],
        },
        {
          id: 'need_social',
          label: {
            ro: 'Am nevoie să simt că nu sunt singur(ă) în proces.',
            en: "I need to feel I’m not alone in this process.",
          },
          subtitle: {
            ro: 'Grup, comunitate, cineva cu care să împărtășesc și să mă sprijine.',
            en: 'Group, community, someone to share with and get support from.',
          },
          channelTags: ['channel_social_support'],
        },
        {
          id: 'need_beliefs',
          label: {
            ro: 'Am nevoie să gândesc altfel despre mine și capacitățile mele.',
            en: 'I need to think differently about myself and my abilities.',
          },
          subtitle: {
            ro: 'Să lucrez cu convingerile limitative de tipul «nu pot», «nu sunt în stare».',
            en: "To work on limiting beliefs like “I can’t”, “I’m not capable”.",
          },
          channelTags: ['channel_self_efficacy', 'channel_motivation'],
        },
        {
          id: 'need_benefits',
          label: {
            ro: 'Am nevoie să îmi clarific ce câștig dacă mă schimb.',
            en: 'I need to clarify what I gain if I change.',
          },
          subtitle: {
            ro: 'Beneficii, sens personal, de ce merită pentru mine efortul.',
            en: 'Benefits, personal meaning, why the effort is worth it for me.',
          },
          channelTags: ['channel_values_benefits', 'channel_motivation'],
        },
        {
          id: 'need_motivation',
          label: {
            ro: 'Am nevoie să îmi găsesc sau să îmi reactivez motivația.',
            en: 'I need to find or reactivate my motivation.',
          },
          subtitle: {
            ro: 'Îmi lipsește energia de a începe sau de a continua.',
            en: 'I lack the energy to start or to keep going.',
          },
          channelTags: ['channel_motivation'],
        },
        {
          id: 'need_consistency',
          label: {
            ro: 'Am nevoie să devin mai consecvent(ă), să nu mă las după câteva zile.',
            en: 'I need to become more consistent and not give up after a few days.',
          },
          subtitle: {
            ro: 'Perseverență, obiceiuri, să nu abandonez când apar obstacole.',
            en: 'Perseverance, habits, not quitting when obstacles appear.',
          },
          channelTags: ['channel_consistency', 'channel_action_plan'],
        },
        {
          id: 'need_other',
          label: {
            ro: 'Altceva (scrie în câteva cuvinte)',
            en: 'Something else (describe in a few words)',
          },
          channelTags: [],
          hasFreeText: true,
        },
      ],
    },
    {
      id: 'need_q2_self_efficacy',
      type: 'likert_1_5',
      label: {
        ro: 'Cât de mult crezi, realist, că poți face o schimbare pe tema asta în următoarele 2 luni?',
        en: 'How much do you realistically believe you can make a change on this topic in the next 2 months?',
      },
      description: {
        ro: 'Alege un răspuns care se potrivește cel mai bine cu felul în care simți acum.',
        en: 'Choose the answer that best matches how you feel right now.',
      },
    },
  ],
};

