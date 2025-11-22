import { type OmniKunoModuleId } from "./omniKunoModules";

export type OmniKunoLessonType = "lesson" | "quiz";

export type OmniKunoLesson = {
  id: string;
  order: number;
  type: OmniKunoLessonType;
  title: string;
  summary: string;
  content?: string;
  screensCount?: number;
  durationMin?: number;
  quizTopicKey?: string;
  difficulty?: "easy" | "medium" | "hard";
};

export type OmniKunoModuleConfig = {
  moduleId: string;
  topicKey: string;
  lessons: OmniKunoLesson[];
};

const emotionalBalanceLessons: OmniKunoLesson[] = [
  {
    id: "emotional_balance_l1_01_foundations",
    order: 1,
    type: "lesson",
    title: "Fundamentele calmului activ",
    summary: "Ce înseamnă echilibrul emoțional modern și cum se deosebește de pasivitate sau evitare.",
    durationMin: 6,
    difficulty: "easy",
    screensCount: 5,
  },
  {
    id: "emotional_balance_l1_02_triggers",
    order: 2,
    type: "lesson",
    title: "Maparea declanșatorilor",
    summary: "Identifici situațiile concrete care îți cresc pulsul și pregătești un răspuns conștient.",
    durationMin: 6,
    screensCount: 5,
  },
  {
    id: "emotional_balance_l1_03_body_scan",
    order: 3,
    type: "lesson",
    title: "Body scan de 2 minute",
    summary: "Un protocol rapid pentru a observa semnalele corpului înainte de reacții impulsive.",
    durationMin: 5,
    screensCount: 5,
  },
  {
    id: "emotional_balance_l1_04_micro_choices",
    order: 4,
    type: "lesson",
    title: "Micro alegeri calm-activ",
    summary: "Cum montezi micro-pauze și ancore în zi pentru a rămâne centrat chiar și sub presiune.",
    durationMin: 6,
    screensCount: 5,
  },
  { id: "emotional_balance_l1_05_micro_breaks", order: 5, type: "lesson", title: "Micro-pauze în agenda reală", summary: "Cum programezi pauze de 60 secunde în calendarul aglomerat pentru a preveni avalanșa emoțională.", durationMin: 6, screensCount: 5 },
  { id: "emotional_balance_l1_06_story_line", order: 6, type: "lesson", title: "Povestea din cap vs faptele", summary: "Instrument din OmniKuno pentru separarea emoției de interpretarea automată.", durationMin: 6, screensCount: 5 },
  { id: "emotional_balance_l1_07_evening_reset", order: 7, type: "lesson", title: "Reset seara în 3 pași", summary: "Mic ritual de închidere a zilei: evacuare tensiune, recunoaștere progres, plan minimal pentru mâine.", durationMin: 8, screensCount: 5 },
  { id: "emotional_balance_l1_q1", order: 8, type: "quiz", title: "Quiz: Indicatori de calm interior", summary: "5 întrebări care verifică dacă recunoști semnalele somatice și cognitive asociate calmului activ.", quizTopicKey: "kuno_calm_intro", difficulty: "hard" },
  { id: "emotional_balance_l1_08_micro_commit", order: 9, type: "lesson", title: "Micro-angajament zilnic", summary: "Îți alegi „ancora” calmă pentru următoarele 7 zile (de ex. respirație + notițe).", durationMin: 5, screensCount: 5 },
  { id: "emotional_balance_l1_q2", order: 10, type: "quiz", title: "Quiz: Scenarii reale", summary: "Simulări cu 4 scenarii pentru a valida cum aplici tehnicile când apare un conflict.", quizTopicKey: "kuno_calm_scenarios", difficulty: "hard" },
];

const energyBodyLessons: OmniKunoLesson[] = [
  {
    id: "energy_body_protocol",
    order: 1,
    type: "lesson",
    title: "Protocol scurt de resetare a energiei",
    summary: "Setul de 4 pași prin care observi, respiri, relaxezi corpul și alegi un gest mic de resetare.",
    durationMin: 4,
    difficulty: "easy",
  },
  {
    id: "energy_body_l1_01_signals",
    order: 2,
    type: "lesson",
    title: "Semnalele corpului",
    summary: "Identifici mesajele simple prin care corpul îți arată că ritmul actual îl obosește.",
    durationMin: 5,
    difficulty: "easy",
  },
  {
    id: "energy_body_l1_02_breath",
    order: 3,
    type: "lesson",
    title: "Respirația și energia",
    summary: "Folosești 2 respirații lente pentru a trimite corpului un semnal de siguranță.",
    durationMin: 5,
  },
  {
    id: "energy_body_l1_03_posture",
    order: 4,
    type: "lesson",
    title: "Postură și tensiune",
    summary: "Ajustezi poziția corpului pentru a reduce tensiunea și a recăpăta aer.",
    durationMin: 5,
  },
  {
    id: "energy_body_l1_04_microbreaks",
    order: 5,
    type: "lesson",
    title: "Pauze mici, efect mare",
    summary: "Planifici pauze de un minut care îți protejează atenția și energia.",
    durationMin: 5,
  },
  {
    id: "energy_body_l2_05_sleep_ritual",
    order: 6,
    type: "lesson",
    title: "Ritual de somn simplu",
    summary: "Construiești un ritual scurt care îți liniștește sistemul înainte de somn.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "energy_body_l2_06_rhythm",
    order: 7,
    type: "lesson",
    title: "Ritm și recuperare",
    summary: "Mapezi ferestrele bune și momentele în care corpul cere încetinire.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "energy_body_l2_07_movement",
    order: 8,
    type: "lesson",
    title: "Mișcare scurtă",
    summary: "Introduci micro-mişcare pentru a scoate corpul din rigiditate și ceață.",
    durationMin: 5,
    difficulty: "medium",
  },
  {
    id: "energy_body_l2_08_fuel",
    order: 9,
    type: "lesson",
    title: "Combustibil real",
    summary: "Clarifici ce fel de alimentație și hidratare îți stabilizează energia.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "energy_body_l3_09_stress_energy",
    order: 10,
    type: "lesson",
    title: "Stres și energie",
    summary: "Înveți să vezi legătura dintre stres prelungit și căderile de energie.",
    durationMin: 6,
    difficulty: "hard",
  },
  {
    id: "energy_body_l3_10_crash_repair",
    order: 11,
    type: "lesson",
    title: "Reparare după cădere",
    summary: "Planifici gesturi mici de reparație după perioade foarte solicitante.",
    durationMin: 6,
    difficulty: "hard",
  },
  {
    id: "energy_body_l3_11_listening_limits",
    order: 12,
    type: "lesson",
    title: "Ascultă limitele",
    summary: "Reînveți să accepți limitele corpului fără rușine și să acționezi în consecință.",
    durationMin: 5,
    difficulty: "hard",
  },
  {
    id: "energy_body_l3_12_personal_ritual",
    order: 13,
    type: "lesson",
    title: "Ritual personal",
    summary: "Îți creezi un ritual propriu care combină respirație, mișcare și pauze pentru zilele grele.",
    durationMin: 6,
    difficulty: "hard",
  },
];

const relationshipsCommunicationLessons: OmniKunoLesson[] = [
  {
    id: "relationships_communication_protocol",
    order: 1,
    type: "lesson",
    title: "Protocol de comunicare calmă",
    summary: "Un set scurt de pași pentru a recunoaște impulsul, a respira și a formula un răspuns clar fără atac.",
    durationMin: 4,
    difficulty: "easy",
  },
  {
    id: "relationships_communication_l1_01_listening",
    order: 2,
    type: "lesson",
    title: "Ascultare reală",
    summary: "Înveți să primești mesajul celuilalt fără defensivă și să reduci tensiunea prin prezență.",
    durationMin: 5,
    difficulty: "easy",
  },
  {
    id: "relationships_communication_l1_02_tone",
    order: 3,
    type: "lesson",
    title: "Tonul deschide sau închide",
    summary: "Explorezi cum tonul transmite intenția și cum îl ajustezi când conversația devine rigidă.",
    durationMin: 5,
  },
  {
    id: "relationships_communication_l1_03_pause",
    order: 4,
    type: "lesson",
    title: "Pauza calmă",
    summary: "Construiești micro-pauze care îți oferă timp să alegi răspunsul potrivit în locul impulsului.",
    durationMin: 6,
  },
  {
    id: "relationships_communication_l1_04_honesty",
    order: 5,
    type: "lesson",
    title: "Sinceritate calmă",
    summary: "Descoperi cum să exprimi ce simți fără acuză astfel încât dialogul să rămână deschis.",
    durationMin: 6,
  },
  {
    id: "relationships_communication_l2_05_boundaries",
    order: 6,
    type: "lesson",
    title: "Limite liniștite",
    summary: "Exersezi formularea limitelor ca protecție, nu ca pedeapsă, pentru a reduce consumul emoțional.",
    durationMin: 6,
  },
  {
    id: "relationships_communication_l2_06_conflict",
    order: 7,
    type: "lesson",
    title: "Conflictul matur",
    summary: "Aplici protocolul în conflicte astfel încât să rămâi prezent și să reduci escaladarea.",
    durationMin: 6,
  },
  {
    id: "relationships_communication_l2_07_clarity",
    order: 8,
    type: "lesson",
    title: "Clarificările scurte",
    summary: "Înveți să formulezi rapid ce vrei să transmiți pentru a scurta tensiunile.",
    durationMin: 5,
  },
  {
    id: "relationships_communication_l2_08_hurt",
    order: 9,
    type: "lesson",
    title: "Calm când doare",
    summary: "Lucrezi cu momentele în care te simți rănit astfel încât să comunici fără a proiecta.",
    durationMin: 6,
  },
  {
    id: "relationships_communication_l3_09_vulnerability",
    order: 10,
    type: "lesson",
    title: "Vulnerabilitatea matură",
    summary: "Explorezi cum să exprimi adevărul interior fără dramă și fără a cere salvare.",
    durationMin: 5,
    difficulty: "medium",
  },
  {
    id: "relationships_communication_l3_10_repair",
    order: 11,
    type: "lesson",
    title: "Reparare liniștită",
    summary: "Setezi pași concreți pentru a repara rupturile și a restabili legătura.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "relationships_communication_l3_11_stay_open",
    order: 12,
    type: "lesson",
    title: "Deschidere matură",
    summary: "Exersezi cum rămâi receptiv fără să renunți la limitele tale în situații grele.",
    durationMin: 5,
    difficulty: "medium",
  },
  {
    id: "relationships_communication_l3_12_connection",
    order: 13,
    type: "lesson",
    title: "Conexiune autentică",
    summary: "Închizi modulul cu intenții de prezență calmă și gesturi mici care cresc încrederea.",
    durationMin: 6,
    difficulty: "medium",
  },
];

const decisionDiscernmentLessons: OmniKunoLesson[] = [
  {
    id: "decision_discernment_protocol",
    order: 1,
    type: "lesson",
    title: "Protocol de decizie calmă",
    summary: "Mini-protocol în patru pași pentru clarificare rapidă, evaluarea riscurilor și alegerea unui pas suficient de bun.",
    durationMin: 4,
    difficulty: "easy",
  },
  {
    id: "decision_discernment_l1_01_what_is_discernment",
    order: 2,
    type: "lesson",
    title: "Ce este discernământul",
    summary: "Diferențiezi între impuls și decizie și începi să observi unde acționezi automat.",
    durationMin: 6,
    difficulty: "easy",
  },
  {
    id: "decision_discernment_l1_02_slowing_down",
    order: 3,
    type: "lesson",
    title: "Încetinirea scurtă",
    summary: "Introduci o pauză de câteva secunde înainte de „da” sau „nu” pentru a schimba direcția răspunsului.",
    durationMin: 6,
    difficulty: "easy",
  },
  {
    id: "decision_discernment_l1_03_simple_questions",
    order: 4,
    type: "lesson",
    title: "Întrebări simple, efect mare",
    summary: "Folosești două întrebări de bază – „Ce vreau?” și „Ce risc?” – pentru claritate la orice decizie.",
    durationMin: 6,
    difficulty: "easy",
  },
  {
    id: "decision_discernment_l1_04_small_decisions",
    order: 5,
    type: "lesson",
    title: "Deciziile mici contează",
    summary: "Exersezi discernământul în deciziile zilnice ca să fii pregătit pentru momentele mari.",
    durationMin: 6,
    difficulty: "easy",
  },
  {
    id: "decision_discernment_l2_05_criteria",
    order: 6,
    type: "lesson",
    title: "Criteriile tale",
    summary: "Stabilești ce criteriu contează acum (timp, bani, energie, sens) pentru a simplifica alegerea.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "decision_discernment_l2_06_risk",
    order: 7,
    type: "lesson",
    title: "Riscul văzut, nu vag",
    summary: "Numești clar riscurile principale pentru a le gestiona, nu pentru a fugi de ele.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "decision_discernment_l2_07_values_alignment",
    order: 8,
    type: "lesson",
    title: "Decizii în acord cu valorile",
    summary: "Verifici dacă deciziile tale au sens pentru tine, nu doar pentru exterior.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "decision_discernment_l2_08_small_experiments",
    order: 9,
    type: "lesson",
    title: "Experimente, nu verdicte",
    summary: "Transformi deciziile grele în experimente limitate în timp pentru a reduce blocajele.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "decision_discernment_l3_09_uncertainty",
    order: 10,
    type: "lesson",
    title: "Trăitul cu incertitudine",
    summary: "Accepți că nicio decizie nu aduce siguranță totală și alegi cu claritate suficientă pentru pasul următor.",
    durationMin: 6,
    difficulty: "hard",
  },
  {
    id: "decision_discernment_l3_10_regret",
    order: 11,
    type: "lesson",
    title: "Frica de regret",
    summary: "Înveți să tolerezi regretul mic al unei decizii asumate, în locul regretului mare al blocajului.",
    durationMin: 6,
    difficulty: "hard",
  },
  {
    id: "decision_discernment_l3_11_meta_decision",
    order: 12,
    type: "lesson",
    title: "Decizia de a decide",
    summary: "Stabilești o dată-limită și alegi să iei o decizie chiar dacă nu ai toate detaliile perfecte.",
    durationMin: 6,
    difficulty: "hard",
  },
  {
    id: "decision_discernment_l3_12_ritual",
    order: 13,
    type: "lesson",
    title: "Ritualul tău de decizie",
    summary: "Îți construiești un ritual simplu: clarifici, aplici protocolul și notezi următorul pas.",
    durationMin: 6,
    difficulty: "hard",
  },
];

const selfTrustLessons: OmniKunoLesson[] = [
  {
    id: "self_trust_protocol",
    order: 1,
    type: "lesson",
    title: "Protocol de promisiune realistă",
    summary: "Protocolul de 4 pași prin care alegi promisiuni mici, realiste și clare.",
    durationMin: 4,
    difficulty: "easy",
  },
  {
    id: "self_trust_l1_01_definition",
    order: 2,
    type: "lesson",
    title: "Ce înseamnă încrederea în tine",
    summary: "Definești încrederea în sine ca abilitatea de a-ți respecta promisiunile realiste.",
    durationMin: 6,
    difficulty: "easy",
  },
  {
    id: "self_trust_l1_02_inner_voice",
    order: 3,
    type: "lesson",
    title: "Vocea din interior",
    summary: "Observi dialogul interior și construiești o voce de aliat, nu doar critic.",
    durationMin: 6,
    difficulty: "easy",
  },
  {
    id: "self_trust_l1_03_small_promises",
    order: 4,
    type: "lesson",
    title: "Promisiuni mici respectate",
    summary: "Îți construiești încrederea din pași mici pe care îi poți duce la capăt zilnic.",
    durationMin: 6,
    difficulty: "easy",
  },
  {
    id: "self_trust_l1_04_tracking_wins",
    order: 5,
    type: "lesson",
    title: "Jurnalul de mici victorii",
    summary: "Notezi ceea ce respecți pentru a vedea clar progresul și a întări încrederea.",
    durationMin: 5,
    difficulty: "easy",
  },
  {
    id: "self_trust_l2_05_mistakes",
    order: 6,
    type: "lesson",
    title: "Relația cu greșelile",
    summary: "Înveți să privești greșelile ca feedback și să le folosești pentru ajustări realiste.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "self_trust_l2_06_saying_no",
    order: 7,
    type: "lesson",
    title: "Spui „nu” cu acord",
    summary: "Exersezi să pui limite și să spui nu promisiunilor care te scot complet din ritm.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "self_trust_l2_07_overcommit",
    order: 8,
    type: "lesson",
    title: "Când promiți prea mult",
    summary: "Mapezi tiparele de supra-angajare și reconstruiești promisiuni mai mici și clare.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "self_trust_l2_08_values",
    order: 9,
    type: "lesson",
    title: "În acord cu valorile",
    summary: "Verifici dacă promisiunile tale chiar servesc valorile importante acum.",
    durationMin: 6,
    difficulty: "medium",
  },
  {
    id: "self_trust_l3_09_listen_self",
    order: 10,
    type: "lesson",
    title: "A te asculta pe tine",
    summary: "Îți iei în serios semnalele interioare și încetezi să te ignori complet.",
    durationMin: 6,
    difficulty: "hard",
  },
  {
    id: "self_trust_l3_10_repair_self",
    order: 11,
    type: "lesson",
    title: "Reparații rapide",
    summary: "Înveți să repari încrederea după ce ți-ai încălcat promisiunile, fără dramă.",
    durationMin: 6,
    difficulty: "hard",
  },
  {
    id: "self_trust_l3_11_decisions",
    order: 12,
    type: "lesson",
    title: "Decizii în acord cu tine",
    summary: "Aduci o secundă de pauză înainte de „da” sau „nu” pentru a nu te trăda.",
    durationMin: 6,
    difficulty: "hard",
  },
  {
    id: "self_trust_l3_12_ritual",
    order: 13,
    type: "lesson",
    title: "Ritualul de încredere",
    summary: "Îți construiești un ritual repetabil care unește promisiune, verificare și notare.",
    durationMin: 6,
    difficulty: "hard",
  },
];

const focusClarityLessons: OmniKunoLesson[] = [
  {
    id: "focus_clarity_l1_01_noise",
    order: 1,
    type: "lesson",
    title: "Zgomot exterior, zgomot interior",
    summary: "Recunoști diferența dintre zgomotul mental și ce este cu adevărat important în următoarele ore.",
    durationMin: 5,
    screensCount: 5,
    difficulty: "easy",
  },
  {
    id: "focus_clarity_l1_02_single_point",
    order: 2,
    type: "lesson",
    title: "Un singur punct de atenție",
    summary: "Construiești un protocol simplu de focus: alegi un singur lucru, respiri și setezi un pas clar.",
    durationMin: 6,
    screensCount: 6,
  },
  {
    id: "focus_clarity_l1_03_values",
    order: 3,
    type: "lesson",
    title: "Ce contează pentru tine",
    summary: "Clarifici trei valori/lucruri importante acum astfel încât deciziile zilnice să fie mai simple.",
    durationMin: 5,
    screensCount: 5,
  },
  {
    id: "focus_clarity_l1_04_scatter",
    order: 4,
    type: "lesson",
    title: "Mintea împrăștiată",
    summary: "Înveți să încetinești ritmul și să revii la o singură direcție când apar multe întreruperi.",
    durationMin: 6,
    screensCount: 6,
  },
  {
    id: "focus_clarity_l1_05_priorities",
    order: 5,
    type: "lesson",
    title: "Prioritatea reală",
    summary: "Stabilești clar care este primul lucru care merită atenția ta într-o zi aglomerată.",
    durationMin: 5,
    screensCount: 5,
  },
  {
    id: "focus_clarity_l1_06_inner_clutter",
    order: 6,
    type: "lesson",
    title: "Zgomotul interior",
    summary: "Transformi dialogul interior dur într-unul mai blând pentru a elibera spațiu mental.",
    durationMin: 5,
    screensCount: 5,
  },
  {
    id: "focus_clarity_l1_07_planning_light",
    order: 7,
    type: "lesson",
    title: "Planificare ușoară",
    summary: "Folosești structura acum–după–mai târziu ca să planifici simplu, fără haos.",
    durationMin: 6,
    screensCount: 6,
  },
  {
    id: "focus_clarity_l1_08_daily_reset",
    order: 8,
    type: "lesson",
    title: "Reset zilnic",
    summary: "Închizi ziua cu un reset în trei întrebări astfel încât mintea să rămână clară pentru mâine.",
    durationMin: 5,
    screensCount: 5,
  },
];

export const OMNIKUNO_MODULES: Record<OmniKunoModuleId, OmniKunoModuleConfig> = {
  emotional_balance: {
    moduleId: "emotional_balance",
    topicKey: "emotional_balance",
    lessons: emotionalBalanceLessons,
  },
  focus_clarity: {
    moduleId: "focus_clarity",
    topicKey: "focus_clarity",
    lessons: focusClarityLessons,
  },
  energy_body: {
    moduleId: "energy_body",
    topicKey: "energy_body",
    lessons: energyBodyLessons,
  },
  relationships_communication: {
    moduleId: "relationships_communication",
    topicKey: "relationships_communication",
    lessons: relationshipsCommunicationLessons,
  },
  decision_discernment: {
    moduleId: "decision_discernment",
    topicKey: "decision_discernment",
    lessons: decisionDiscernmentLessons,
  },
  self_trust: {
    moduleId: "self_trust",
    topicKey: "self_trust",
    lessons: selfTrustLessons,
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
