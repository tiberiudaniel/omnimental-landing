export type OmniKunoLessonType = "lesson" | "quiz";

export type OmniKunoLesson = {
  id: string;
  order: number;
  type: OmniKunoLessonType;
  title: string;
  summary: string;
  durationMin?: number;
  quizTopicKey?: string;
  difficulty?: "easy" | "medium" | "hard";
};

export type OmniKunoModuleConfig = {
  moduleId: string;
  topicKey: string;
  lessons: OmniKunoLesson[];
};

const calmLevel1Lessons: OmniKunoLesson[] = [
  { id: "calm_l1_01_foundations", order: 1, type: "lesson", title: "Ce este calmul activ", summary: "Definim clar diferența dintre calm și pasivitate și ce înseamnă să păstrezi claritatea în momente tensionate.", durationMin: 6, difficulty: "easy" },
  { id: "calm_l1_02_checkin", order: 2, type: "lesson", title: "Mini check-in de 90 secunde", summary: "Tehnică rapidă din onboarding pentru a scana corpul, respirația și gândurile înainte de o decizie.", durationMin: 4 },
  { id: "calm_l1_03_trigger_map", order: 3, type: "lesson", title: "Harta declanșatorilor", summary: "Identifici 3 situații tipice care îți ridică pulsul și schițezi reacția firească vs reacția dorită.", durationMin: 7 },
  { id: "calm_l1_04_resp_sync", order: 4, type: "lesson", title: "Respirație sincronizată 4-2-6", summary: "Protocol scurt pentru reglarea pulsului și a tonusului nervos în maximum două minute.", durationMin: 5 },
  { id: "calm_l1_05_micro_breaks", order: 5, type: "lesson", title: "Micro-pauze în agenda reală", summary: "Cum programezi pauze de 60 secunde în calendarul aglomerat pentru a preveni avalanșa emoțională.", durationMin: 6 },
  { id: "calm_l1_06_story_line", order: 6, type: "lesson", title: "Povestea din cap vs faptele", summary: "Instrument din OmniKuno pentru separarea emoției de interpretarea automată.", durationMin: 6 },
  { id: "calm_l1_07_evening_reset", order: 7, type: "lesson", title: "Reset seara în 3 pași", summary: "Mic ritual de închidere a zilei: evacuare tensiune, recunoaștere progres, plan minimal pentru mâine.", durationMin: 8 },
  { id: "calm_l1_q1", order: 8, type: "quiz", title: "Quiz: Indicatori de calm interior", summary: "5 întrebări care verifică dacă recunoști semnalele somatice și cognitive asociate calmului activ.", quizTopicKey: "kuno_calm_intro", difficulty: "hard" },
  { id: "calm_l1_08_micro_commit", order: 9, type: "lesson", title: "Micro-angajament zilnic", summary: "Îți alegi „ancora” calmă pentru următoarele 7 zile (de ex. respirație + notițe).", durationMin: 5 },
  { id: "calm_l1_q2", order: 10, type: "quiz", title: "Quiz: Scenarii reale", summary: "Simulări cu 4 scenarii pentru a valida cum aplici tehnicile când apare un conflict.", quizTopicKey: "kuno_calm_scenarios", difficulty: "hard" },
];

const energyLevel1Lessons: OmniKunoLesson[] = [
  { id: "energy_l1_01_rhythm", order: 1, type: "lesson", title: "Ritmul tău natural", summary: "Identifici ferestrele de energie din zi și corelezi activitățile importante cu acestea.", durationMin: 6, difficulty: "easy" },
  { id: "energy_l1_02_sleep_basics", order: 2, type: "lesson", title: "Bazele somnului mental", summary: "Checklist scurt legat de lumină, alimentație și temperatură pentru somn consistent.", durationMin: 5 },
  { id: "energy_l1_03_fuel", order: 3, type: "lesson", title: "Combustibilul cognitiv", summary: "Ce înseamnă glucide lente, hidratare și snack inteligent pentru energie stabilă.", durationMin: 6 },
  { id: "energy_l1_04_motion", order: 4, type: "lesson", title: "Mișcare activatoare", summary: "3 exerciții rapide (2 min) pentru a-ți ridica pulsul când intri în ceață.", durationMin: 6 },
  { id: "energy_l1_05_focus_block", order: 5, type: "lesson", title: "Blocuri de energie", summary: "Cum combini micro-pauze + sprinturi de lucru astfel încât să nu intri în burnout.", durationMin: 7 },
  { id: "energy_l1_q1", order: 6, type: "quiz", title: "Quiz: Mituri despre energie", summary: "Întrebări cu adevărat/fals pentru mituri uzuale (zahar, cafea, multitasking).", quizTopicKey: "kuno_energy_myths", difficulty: "hard" },
  { id: "energy_l1_06_evening_scan", order: 7, type: "lesson", title: "Scan de final de zi", summary: "Folosim mini-jurnalul pentru a urmări ce ți-a dat energie și ce ți-a tăiat-o.", durationMin: 5 },
  { id: "energy_l1_07_weekly_plan", order: 8, type: "lesson", title: "Planificare energetică", summary: "Distribui task-urile grele în ferestrele bune și îți protejezi recuperarea.", durationMin: 7 },
  { id: "energy_l1_q2", order: 9, type: "quiz", title: "Quiz: Scenarii reale de epuizare", summary: "4 scenarii de epuizare și decizii rapide pentru a-ți proteja energia.", quizTopicKey: "kuno_energy_scenarios", difficulty: "hard" },
  { id: "energy_l1_08_xp_boost", order: 10, type: "lesson", title: "XP booster: rutina de 5 zile", summary: "Versiune aplicată a tehnicilor pentru următoarele 5 zile.", durationMin: 6 },
];

const relationsLevel1Lessons: OmniKunoLesson[] = [
  { id: "relations_l1_01_state", order: 1, type: "lesson", title: "Starea ta emoțională", summary: "Cum îți calibrezi tonul înainte de o conversație dificilă.", durationMin: 6, difficulty: "easy" },
  { id: "relations_l1_02_light_checkin", order: 2, type: "lesson", title: "Check-in de 2 minute", summary: "Modelul OmniMental pentru a întreba „cum ești?” fără să fie superficial.", durationMin: 4 },
  { id: "relations_l1_03_boundaries", order: 3, type: "lesson", title: "Granițe sănătoase", summary: "Ce spui atunci când vrei să nu te consumi complet într-o relație apropiată.", durationMin: 7 },
  { id: "relations_l1_q1", order: 4, type: "quiz", title: "Quiz: Nivel de conectare", summary: "Întrebări despre cum citești semnalele de apropiere/distanță.", quizTopicKey: "kuno_relations_connect", difficulty: "hard" },
  { id: "relations_l1_04_feedback", order: 5, type: "lesson", title: "Feedback cu grijă", summary: "Structură în 3 pași pentru feedback dificil fără a pierde relația.", durationMin: 6 },
  { id: "relations_l1_05_active_listening", order: 6, type: "lesson", title: "Ascultare activă", summary: "Tehnica „reflect & label” pentru a arăta că ești cu adevărat prezent.", durationMin: 5 },
  { id: "relations_l1_06_shared_goals", order: 7, type: "lesson", title: "Obiective comune", summary: "Cum identifici obiectivul comun într-o discuție tensionată.", durationMin: 6 },
  { id: "relations_l1_q2", order: 8, type: "quiz", title: "Quiz: Scenarii de conflict", summary: "Scenarii OmniKuno cu alegeri multiple pentru rezolvarea momentelor tensionate.", quizTopicKey: "kuno_relations_conflict", difficulty: "hard" },
  { id: "relations_l1_07_micro_gesture", order: 9, type: "lesson", title: "Gesturi mici, impact mare", summary: "Cercetare despre micro-gesturi zilnice care cresc încrederea.", durationMin: 4 },
  { id: "relations_l1_08_plan", order: 10, type: "lesson", title: "Planul relațional de 7 zile", summary: "Îți alegi două relații și setezi micro-acțiuni pentru ambele.", durationMin: 7 },
];

const performanceLevel1Lessons: OmniKunoLesson[] = [
  { id: "perf_l1_01_define", order: 1, type: "lesson", title: "Ce înseamnă performanță sănătoasă", summary: "Re-definim performanța ca un sistem cu input-uri și recuperare.", durationMin: 6, difficulty: "easy" },
  { id: "perf_l1_02_focus", order: 2, type: "lesson", title: "Fereastra de focus", summary: "Cum delimitezi 45 de minute de lucru profund prin OmniKuno.", durationMin: 5 },
  { id: "perf_l1_03_measure", order: 3, type: "lesson", title: "Metrici personali", summary: "Setezi 3 metrici simpli pentru progres – claritate, execuție, impact.", durationMin: 6 },
  { id: "perf_l1_q1", order: 4, type: "quiz", title: "Quiz: Biasuri de performanță", summary: "Întrebări cu multiple răspunsuri despre perfecționism și procrastinare.", quizTopicKey: "kuno_performance_bias", difficulty: "hard" },
  { id: "perf_l1_04_plan", order: 5, type: "lesson", title: "Plan de execuție OmniKuno", summary: "Mic framework pentru a sparge un obiectiv în sprinturi și checkpoint-uri.", durationMin: 7 },
  { id: "perf_l1_05_energy_sync", order: 6, type: "lesson", title: "Sincronizare energie-performanță", summary: "Conectezi lecțiile din modulul Energy la agenda de performanță.", durationMin: 5 },
  { id: "perf_l1_06_review", order: 7, type: "lesson", title: "Review de 10 minute", summary: "Proces rapid pentru a trage concluzii după fiecare zi de lucru.", durationMin: 5 },
  { id: "perf_l1_q2", order: 8, type: "quiz", title: "Quiz: Strategii de execuție", summary: "Studii de caz scurte despre cum abordezi proiecte cu resurse limitate.", quizTopicKey: "kuno_performance_strategy", difficulty: "hard" },
  { id: "perf_l1_07_micro_recovery", order: 9, type: "lesson", title: "Micro-recuperare", summary: "Cum previi epuizarea atunci când rulezi sprinturi consecutive.", durationMin: 6 },
  { id: "perf_l1_08_showcase", order: 10, type: "lesson", title: "Showcase & feedback", summary: "Creezi un moment de prezentare a progresului pentru a închide modulul.", durationMin: 7 },
];

const senseLevel1Lessons: OmniKunoLesson[] = [
  { id: "sense_l1_01_story", order: 1, type: "lesson", title: "Povestea personală", summary: "Exercițiu narativ pentru a-ți mapa firul roșu al vieții.", durationMin: 7, difficulty: "easy" },
  { id: "sense_l1_02_values", order: 2, type: "lesson", title: "Valorile din spatele deciziilor", summary: "Identifici 3 valori active și 3 valori care lipsesc din viața curentă.", durationMin: 6 },
  { id: "sense_l1_03_strengths", order: 3, type: "lesson", title: "Forțele tale OmniMental", summary: "Îți mapezi punctele forte și zonele în care ai nevoie de parteneri.", durationMin: 5 },
  { id: "sense_l1_q1", order: 4, type: "quiz", title: "Quiz: Direcție și sens", summary: "Întrebări despre claritatea obiectivelor și coerența acțiunilor.", quizTopicKey: "kuno_sense_direction", difficulty: "hard" },
  { id: "sense_l1_04_intent", order: 5, type: "lesson", title: "Intenția pentru următoarele 90 de zile", summary: "Setezi intenția mare și micro-obiectivele care susțin această direcție.", durationMin: 6 },
  { id: "sense_l1_05_rituals", order: 6, type: "lesson", title: "Ritualurile care mențin sensul", summary: "Conectezi ritmurile zilnice la sensul pe termen lung.", durationMin: 6 },
  { id: "sense_l1_06_allies", order: 7, type: "lesson", title: "Aliați și comunități", summary: "Identifici oamenii și grupurile care îți amplifică energia și sensul.", durationMin: 5 },
  { id: "sense_l1_q2", order: 8, type: "quiz", title: "Quiz: Obstacole la nivel de sens", summary: "Scenarii cu blocaje existențiale și alegeri posibile.", quizTopicKey: "kuno_sense_obstacles", difficulty: "hard" },
  { id: "sense_l1_07_commit", order: 9, type: "lesson", title: "Commit de 14 zile", summary: "Construiești un experiment de 14 zile care validează intenția.", durationMin: 6 },
  { id: "sense_l1_08_story_update", order: 10, type: "lesson", title: "Actualizează-ți povestea", summary: "Scrii în 5 minute povestea ta, cu sensul nou integrat.", durationMin: 5 },
];

export const OMNIKUNO_MODULES: Record<
  "calm" | "energy" | "relations" | "performance" | "sense",
  OmniKunoModuleConfig
> = {
  calm: {
    moduleId: "calm_level1",
    topicKey: "calm_emotional_balance",
    lessons: calmLevel1Lessons,
  },
  energy: {
    moduleId: "energy_level1",
    topicKey: "energy_mastery",
    lessons: energyLevel1Lessons,
  },
  relations: {
    moduleId: "relations_level1",
    topicKey: "relationship_intelligence",
    lessons: relationsLevel1Lessons,
  },
  performance: {
    moduleId: "performance_level1",
    topicKey: "performance_flow",
    lessons: performanceLevel1Lessons,
  },
  sense: {
    moduleId: "sense_level1",
    topicKey: "sense_direction",
    lessons: senseLevel1Lessons,
  },
};

export type OmniKunoLessonStatus = "done" | "active" | "locked";

export function computeLessonsStatus(
  lessons: OmniKunoLesson[],
  completedIds: string[] | undefined,
): Array<OmniKunoLesson & { status: OmniKunoLessonStatus }> {
  const completedSet = new Set((completedIds ?? []).filter(Boolean));
  let hasActive = false;
  return lessons
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((lesson) => {
      if (completedSet.has(lesson.id)) {
        return { ...lesson, status: "done" as OmniKunoLessonStatus };
      }
      if (!hasActive) {
        hasActive = true;
        return { ...lesson, status: "active" as OmniKunoLessonStatus };
      }
      return { ...lesson, status: "locked" as OmniKunoLessonStatus };
    });
}
