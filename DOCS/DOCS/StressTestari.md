Fișier nou: tests/e2e/wizard-fuzz.spec.ts

Lipește asta în repo și apoi îl poți rafina:

// tests/e2e/wizard-fuzz.spec.ts
import { test, expect, Page } from "@playwright/test";

type BudgetLevel = "low" | "medium" | "high";

type UserProfile = {
  label: string;
  urgency: number;        // 1–5 sau ce scală folosești
  timePerWeek: number;    // ore / săptămână
  budget: BudgetLevel;
  energy: number;         // 1–5
};

const PROFILES: UserProfile[] = [
  {
    label: "Hard-pressed, no time, low budget",
    urgency: 5,
    timePerWeek: 1,
    budget: "low",
    energy: 2,
  },
  {
    label: "Motivated, medium time, medium budget",
    urgency: 4,
    timePerWeek: 3,
    budget: "medium",
    energy: 4,
  },
  {
    label: "Relaxed, high time, low budget",
    urgency: 2,
    timePerWeek: 5,
    budget: "low",
    energy: 3,
  },
  {
    label: "Very committed, high time, high budget",
    urgency: 5,
    timePerWeek: 6,
    budget: "high",
    energy: 5,
  },
  {
    label: "Unsure, medium everything",
    urgency: 3,
    timePerWeek: 3,
    budget: "medium",
    energy: 3,
  },
  // poți adăuga ușor încă 5–10 profile aici
];

function randomProfile(): UserProfile {
  return PROFILES[Math.floor(Math.random() * PROFILES.length)];
}

async function runWizardForProfile(page: Page, profile: UserProfile) {
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await page.goto(`${baseUrl}/experience-onboarding?start=1`);

  // Așteaptă să fie gata wizard-ul
  const ready = page.getByTestId("wizard-ready");
  await ready.waitFor({ state: "visible", timeout: 30000 }).catch(() => {});

  // Intro → Next
  await page.getByTestId("wizard-next").click();

  // TODO: adaptează la structura ta reală de pași + testId-uri.
  // Mai jos sunt DOAR exemple generice.
  //
  // Exemplu slider urgență:
  //   - dacă sliderul are data-testid="slider-urgency":
  //     await page.getByTestId("slider-urgency").fill(profile.urgency.toString());
  //
  // Exemplu butoane buget:
  //   - dacă ai data-testid="budget-low" / "budget-medium" / "budget-high":
  //     await page.getByTestId(`budget-${profile.budget}`).click();
  //
  // Exemplu timp pe săptămână:
  //   - slider sau input numeric, după cum e în UI-ul tău.

  // Exemplu (înlocuiește cu ce ai TU):
  // await page.getByTestId("slider-urgency").fill(String(profile.urgency));
  // await page.getByTestId("slider-time").fill(String(profile.timePerWeek));
  // await page.getByTestId(`budget-${profile.budget}`).click();
  // await page.getByTestId("slider-energy").fill(String(profile.energy));

  // Mergi prin pași până la recomandare
  // (dacă ai mai multe ecrane, repetă click pe wizard-next + aserții intermediare)
  await page.getByTestId("wizard-next").click();
  // ... alte ecrane ...
  // la final:
  const recommendationRoot = page.getByTestId("wizard-recommendation-root");
  await expect(recommendationRoot).toBeVisible({ timeout: 30000 });

  // Optional: verifică să nu apară mesaje evidente de eroare
  // await expect(page.getByText("Error", { exact: false })).toHaveCount(0);
}

async function resetSession(page: Page) {
  await page.goto("about:blank");
  await page.context().clearCookies();
  await page.context().clearPermissions();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

test.describe("wizard-fuzz", () => {
  test("rulează wizard-ul pentru toate profilele predefinite", async ({ page }) => {
    for (const profile of PROFILES) {
      await test.step(`Profile: ${profile.label}`, async () => {
        await runWizardForProfile(page, profile);
        await resetSession(page);
      });
    }
  });

  test("wizard-fuzz – 20 de rulări randomizate", async ({ page }) => {
    for (let i = 0; i < 20; i++) {
      const profile = randomProfile();
      await test.step(`Random run #${i + 1} – ${profile.label}`, async () => {
        await runWizardForProfile(page, profile);
        await resetSession(page);
      });
    }
  });
});


Ce obții cu asta:

npx playwright test -g "wizard-fuzz":

va prinde describe("wizard-fuzz", ...) și îți rulează:

toate profilele predefinite

20 de rulări random.

Tu trebuie doar să ajustezi:

URL-ul, dacă flow-ul tău începe în altă parte.

getByTestId(...) pentru slider-e, butoane, etc., ca să corespundă exact cu componenta ta.

2. Prompt scurt pentru Codex (ca să-ți umple el TODO-urile)

Ca să nu consumi multe tokenuri, îi dai ceva de genul:

Am adăugat fișierul `tests/e2e/wizard-fuzz.spec.ts` cu un schelet de test pentru Playwright.

Te rog:

1. Deschide `tests/e2e/wizard-fuzz.spec.ts` și:
   - adaptează funcția `runWizardForProfile` la structura reală a wizard-ului OmniMental:
     – folosește exact data-testid-urile prezente deja în componente (wizard-next, slider-*, butoane pentru buget etc.).
     – parcurge toți pașii până la ecranul de recomandare.

2. Asigură-te că:
   - testele trec când rulez: `npx playwright test -g "wizard-fuzz"`;
   - `npm run test:e2e` include automat și acest fișier.

3. Dacă vezi duplicare de logică cu alte teste (de ex. `wizard-multiple-users.spec.ts`), extrage funcțiile comune într-un helper reutilizabil, de ex:
   - `tests/e2e/helpers/wizardFlow.ts`
   și refolosește-le.

Nu schimba comenzile existente de testare, doar fă testul `wizard-fuzz` robust și lizibil.

3. Ce ai acum, ca „motor de test” complet

Rămân valabile toate comenzile:

npm run test:e2e

npm run test:e2e:headed

npm run test:e2e:ui

npx playwright test -g "wizard-stress-test"

npx playwright test -g "wizard-fuzz"

npx playwright test tests/e2e/wizard-multiple-users.spec.ts

npx playwright test tests/e2e/onboarding.spec.ts

npm run test:logic

E2E_BASE_URL=http://localhost:3001 npx playwright test

wizard-multiple-users = scenarii determinate, clare.
wizard-stress-test = ceea ce ai deja (probabil repetition + load).
wizard-fuzz = stratul în plus: randomizare + mai multe profile predefinite.

Dacă vrei, la pasul următor îți pot propune și structură de helpers/wizardFlow.ts ca să nu mai repeți nimic între wizard-multiple-users, wizard-stress-test și wizard-fuzz.