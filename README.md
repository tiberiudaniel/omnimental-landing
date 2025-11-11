This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Wizard Funnel Notes

- The onboarding wizard persists its state (journal entry, cloud selections, evaluation answers, and current step) in `localStorage` via `components/wizardStorage.ts`.
- `useWizardData` + `useWizardSteps` hydrate from storage on mount and write back after each change; storage clears automatically after a journey choice is saved.
- `components/WizardProgress.tsx` renders the responsive milestone header + linear progress bar on every step beyond the intro animation.
- `components/RecommendationStep.tsx` now ends with a follow-up CTA (“Email me the recap”) that reuses `components/CTAButton` and writes to the `signups` collection.

### QA Checklist

1. Fill the wizard, refresh, and confirm inputs persist.
2. Complete the flow and check `localStorage.getItem("omnimental_wizard_state_v1")` is `null`.
3. Submit the recap CTA and verify the new entry in Firestore.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
