# Codex Lint Playbook – OmniMental

Proiect: `omnimental-landing-codex` (Next.js, React 18, React Compiler, ESLint strict).

## Reguli pe care trebuie să le respecți

1. **react-hooks/set-state-in-effect**
   - Nu apela `setState` direct în efecte care doar citesc ceva static (ex: cache / localStorage).
   - Soluții:
     - Folosește lazy init în `useState` (ex: `useState(() => readCache())`).
     - Sau extrage într-un custom hook care întoarce direct state-ul inițial.
   - Pentru efecte de animație (pulse, highlight etc.), folosește un pattern clar:
     - fie un custom hook (`usePulse`),
     - fie `useEffect` doar pentru subscribe/unsubscribe la evenimente externe.

2. **react-hooks/preserve-manual-memoization**
   - Nu forța `useCallback` / `useMemo` dacă nu ai un motiv serios.
   - Soluții:
     - Scoate `useCallback` / `useMemo` unde nu aduc beneficii clare.
     - Dacă le păstrezi, include în deps TOATE variabilele pe care le folosește funcția.

3. **@typescript-eslint/no-unused-vars**
   - Elimină variabilele/parametrii nefolosiți.
   - Sau folosește prefix `_` doar dacă vrei explicit să marchezi ceva ca „nefolosit, dar intenționat”.

4. **@typescript-eslint/no-require-imports**
   - Nu folosi `require`.
   - Soluții:
     - `import X from "module";`
     - `import * as X from "module";`
     - `import { Y } from "module";`

5. **@typescript-eslint/no-explicit-any**
   - Evită `any`.
   - Soluții:
     - Tipuri concrete (ex: `OmniRecommendation`, `Progress` etc.).
     - Sau generice rezonabile: `unknown`, `Record<string, unknown>`, `React.ReactNode`, în funcție de caz.

6. **react-hooks/exhaustive-deps**
   - Fie:
     - adaugi toate deps folosite în hook,
     - fie elimini hook-ul dacă nu mai are sens.
   - Nu folosi `// eslint-disable-next-line` decât în cazuri foarte rare și justificate.

## Stil general

- Modificări **minimale**: nu rescrie componentele de la zero.
- Nu ocoli regulile ESLint prin disable global.
- Cod clar, idiomatic pentru React 18 + React Compiler.
