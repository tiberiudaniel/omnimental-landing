import type { NeedChannelTag } from '@/config/needSurveyConfig';

export const FEEDBACK_BY_TAG: Record<NeedChannelTag, { title: { ro: string; en: string }; text: { ro: string; en: string } }> = {
  channel_education: {
    title: { ro: 'Focusul tău acum: claritate și înțelegere.', en: 'Your main focus now: clarity and understanding.' },
    text: {
      ro: 'Se pare că, înainte de orice, ai nevoie să înțelegi mai bine ce ai de făcut și cum se leagă toate între ele. E o alegere inteligentă: fără hartă, orice drum pare greșit. În următoarele săptămâni o să punem în fața ta materiale scurte și clare, ca să ai o imagine solidă înainte să intri în «execuție».',
      en: 'It looks like, before anything else, you need to better understand what to do and how everything fits together. That’s a smart choice: without a map, every road feels wrong. Over the next weeks, we’ll put short, clear materials in front of you so you get a solid picture before jumping into execution.',
    },
  },
  channel_action_plan: {
    title: { ro: 'Focusul tău acum: structură și pași concreți.', en: 'Your main focus now: structure and concrete steps.' },
    text: {
      ro: 'Ai semnalat clar că nu-ți mai trebuie teorii, ci un plan: ce fac azi, ce fac săptămâna asta. Asta înseamnă că ești pregătit(ă) să treci la acțiune, cu condiția să ai o rută clară. În perioada următoare îți vom propune pași simpli, rutine și mini-protocoale, astfel încât să nu mai fie nevoie să «inventezi» din mers.',
      en: "You’ve made it clear that you don’t need more theory, you need a plan: what to do today and this week. That means you’re ready to move into action, as long as the route is clear. In the next period, we’ll propose simple steps, routines, and mini-protocols so you don’t have to ‘invent’ everything on the fly.",
    },
  },
  channel_social_support: {
    title: { ro: 'Focusul tău acum: să nu mergi singur(ă).', en: 'Your main focus now: not doing this alone.' },
    text: {
      ro: 'Ai indicat că nu îți ajunge să știi ce ai de făcut – ai nevoie de oameni lângă tine. Asta spune ceva important: ești dispus(ă) să lucrezi, dar ai nevoie de sprijin, ritm comun și poate de cineva care să te tragă ușor de mânecă atunci când vrei să renunți. În următoarele săptămâni vom pune accent pe grup, comunitate și forme de responsabilizare, nu doar pe conținut individual.',
      en: 'You’ve indicated that knowing what to do is not enough – you need people beside you. That tells us something important: you’re willing to work, but you need support, shared rhythm, and maybe someone to nudge you when you feel like quitting. In the next weeks, we’ll emphasize group, community and accountability, not just solo content.',
    },
  },
  channel_motivation: {
    title: { ro: 'Focusul tău acum: energie și motivație reală.', en: 'Your main focus now: real energy and motivation.' },
    text: {
      ro: 'Mesajul tău e clar: nu e vorba doar de ce «ar trebui» să faci, ci de faptul că nu simți încă suficient combustibil interior. Fără energie și sens, orice plan moare repede. În perioada următoare ne vom concentra pe a-ți activa motivele personale, pe a face vizibil ce câștigi și pe a transforma «trebuie» în «vreau, pentru că…».',
      en: 'Your message is clear: it’s not just about what you ‘should’ do, it’s about not yet feeling enough inner fuel. Without energy and meaning, any plan dies quickly. In the next period we’ll focus on activating your personal reasons, making your gains visible, and turning ‘I have to’ into ‘I want to, because…’.',
    },
  },
  channel_self_efficacy: {
    title: { ro: 'Focusul tău acum: încrederea că poți, nu doar ce ai de făcut.', en: 'Your main focus now: believing you can, not just knowing what to do.' },
    text: {
      ro: 'Ai transmis că problema nu e doar lipsa unui plan, ci felul în care te vezi pe tine: cât de capabil(ă), cât de pregătit(ă), cât de «om care reușește». Asta e o zonă-cheie. Dacă imaginea despre tine nu se schimbă, orice tehnică devine provizorie. În următoarele săptămâni vom lucra mai mult pe convingeri, identitate și pe felul în care îți vorbești ție însuți/însăți, nu doar pe liste de sarcini.',
      en: 'You’ve shown that the issue is not just the lack of a plan, but how you see yourself: how capable, how prepared, how much of a ‘person who succeeds’ you feel. This is a key zone. If your self-image doesn’t shift, any technique will stay temporary. In the next weeks, we’ll work more on beliefs, identity and your inner dialogue, not just on task lists.',
    },
  },
  channel_values_benefits: {
    title: { ro: 'Focusul tău acum: să înțelegi de ce merită schimbarea.', en: 'Your main focus now: understanding why the change is worth it.' },
    text: {
      ro: 'Ai indicat că înainte să accelerezi ai nevoie să vezi clar ce câștigi dacă te schimbi. Asta nu e o ezitare, e o formă de inteligență: vrei să dai sens efortului, nu să bifezi sarcini în gol. În perioada următoare vom pune accent pe clarificarea beneficiilor, pe valori și pe cum arată, concret, viața ta dacă schimbarea chiar se întâmplă.',
      en: 'You’ve indicated that before accelerating, you need to clearly see what you gain if you change. That’s not hesitation, it’s a form of intelligence: you want your effort to have meaning, not just tick boxes. In the next weeks we’ll focus on clarifying benefits, values, and what your life concretely looks like if the change actually happens.',
    },
  },
  channel_consistency: {
    title: { ro: 'Focusul tău acum: consecvență, nu starturi noi.', en: 'Your main focus now: consistency, not fresh starts.' },
    text: {
      ro: 'Ai pus reflectorul pe o zonă critică: nu pornirea e problema, ci faptul că după câteva zile ritmul cade. Asta înseamnă că ai deja impulsul de a începe, dar ai nevoie de sisteme care să te țină în mișcare. În următoarele săptămâni vom lucra pe obiceiuri mici, repetabile, urmărite în timp, astfel încât progresul să nu mai depindă de «chef-ul» de azi.',
      en: "You’ve highlighted a critical area: starting is not the real problem, it’s how quickly the rhythm drops after a few days. That means you already have the impulse to begin, but you need systems to keep you moving. In the next weeks, we’ll work on small, repeatable habits, tracked over time so that your progress doesn’t depend on today’s mood.",
    },
  },
};

