# OmniMental Design Tokens v1.0

This document defines the core design tokens for the OmniMental platform.  
They are **module-aware**, but originate from a single warm, premium base palette so the whole product feels coherent.

Use this document as the **single source of truth** for colors, typography, spacing, and component primitives.


---

## 1. Brand Core Tokens

These are the root colors. All other tokens are derived from them.

```json
{
  "brand.beigeLight": "#F7F2EB",
  "brand.beige": "#EFE7DF",
  "brand.beigeDeep": "#E4D4C8",
  "brand.brownDark": "#4A2E1F",
  "brand.cream": "#F8F4ED",
  "brand.goldSoft": "#C7A87A",
  "brand.terracotta": "#D88C72",
  "brand.oliveSoft": "#B8BB9A",
  "brand.sand": "#E7D2B8"
}
2. Global Semantic Tokens
Use these across the app regardless of module.

json
Copy code
{
  "ui.background": "brand.cream",
  "ui.surface": "brand.beigeLight",
  "ui.surfaceAlt": "brand.beigeDeep",

  "ui.text.primary": "brand.brownDark",
  "ui.text.secondary": "#8C7E76",
  "ui.text.muted": "rgba(74, 46, 31, 0.55)",

  "ui.border": "rgba(0, 0, 0, 0.07)",
  "ui.borderStrong": "rgba(0, 0, 0, 0.12)",

  "ui.focus": "rgba(199, 168, 122, 0.65)",

  "ui.shadow": "rgba(0, 0, 0, 0.05)"
}
3. Module Color Tokens
Each module has a slightly different warm tone, but stays in the same family.

3.1 Omni-Scop — Goal & Intention (Golden Sand)
json
Copy code
{
  "scop.bg": "#F3E8D9",
  "scop.bgSoft": "#E6D4C0",
  "scop.accent": "#C5A170",
  "scop.text": "#5D4631"
}
3.2 Omni-Kuno — Knowledge & Concepts (Ivory Neutral)
json
Copy code
{
  "kuno.bg": "#EFE7DF",
  "kuno.bgSoft": "#E3D7CC",
  "kuno.accent": "#BCA690",
  "kuno.text": "#4A2E1F"
}
3.3 Omni-Abil — Practical Abilities (Soft Terracotta)
json
Copy code
{
  "abil.bg": "#F3E1D8",
  "abil.bgSoft": "#E6C0AC",
  "abil.accent": "#C4775A",
  "abil.text": "#4A2E1F"
}
3.4 Omni-Flex — Psychological Flexibility (Sage Calm)
json
Copy code
{
  "flex.bg": "#EBE8DD",
  "flex.bgSoft": "#DAD7C6",
  "flex.accent": "#A4A07A",
  "flex.text": "#4A2E1F"
}
3.5 Omni-Intel — Integrative State (Pearl Gold)
json
Copy code
{
  "intel.bg": "#F4EDE3",
  "intel.bgSoft": "#E8D9CA",
  "intel.accent": "#C9A679",
  "intel.text": "#4A2E1F"
}
4. Gradients
Used for premium surfaces and CTAs.
Keep gradients soft and low-contrast.

json
Copy code
{
  "gradient.primarySoft": "linear-gradient(145deg, #F8F4ED 0%, #E4D4C8 100%)",
  "gradient.kuno": "linear-gradient(135deg, #EFE7DF 0%, #D9C9BC 100%)",
  "gradient.abil": "linear-gradient(135deg, #F3E1D8 0%, #DFAF95 100%)",
  "gradient.flex": "linear-gradient(135deg, #EBE8DD 0%, #D0D2BE 100%)",
  "gradient.intel": "linear-gradient(135deg, #F4EDE3 0%, #E2D0B9 100%)"
}
5. Shadows
All shadows are subtle. No hard, high-contrast shadows.

json
Copy code
{
  "shadow.card": "0 4px 16px rgba(0, 0, 0, 0.05)",
  "shadow.soft": "0 2px 8px rgba(0, 0, 0, 0.04)",
  "shadow.hover": "0 6px 22px rgba(0, 0, 0, 0.07)"
}
6. Typography Tokens
Base system for headings and body text.

json
Copy code
{
  "font.display": "Cormorant Garamond, serif",
  "font.body": "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

  "font.size.xl": "26px",
  "font.size.lg": "20px",
  "font.size.md": "16px",
  "font.size.sm": "14px",
  "font.size.xs": "12px",

  "font.weight.semibold": 600,
  "font.weight.medium": 500,
  "font.weight.regular": 400
}
Recommended usage
Page / card titles (display)
font.display, font.size.xl, font.weight.semibold

Section titles / labels (secondary)
font.body, font.size.sm, font.weight.medium, letter-spacing 0.14em, uppercase

Body text
font.body, font.size.md, font.weight.regular, line-height ~1.6

7. Component Tokens
Primitives for cards, CTAs, and borders.

7.1 Card
json
Copy code
{
  "card.radius": "22px",
  "card.padding": "24px",
  "card.border": "1.5px solid rgba(0, 0, 0, 0.08)",
  "card.shadow": "shadow.card"
}
7.2 CTA Buttons
json
Copy code
{
  "cta.radius": "26px",
  "cta.height": "48px",
  "cta.textColor": "ui.text.primary",
  "cta.shadow": "shadow.soft",
  "cta.hoverShadow": "shadow.hover"
}
CTA Style Variants
cta.kunoPrimary – calm premium, for knowledge missions

background: gradient.kuno

color: ui.text.primary

cta.abilPrimary – slightly more energetic, for practice / reset

background: gradient.abil

color: ui.text.primary

cta.neutralSoft – secondary actions

background: gradient.primarySoft

color: ui.text.primary

8. Tailwind / Theme Integration (Example)
This is an example of how to map the tokens into a Tailwind config or design system theme.

js
Copy code
// tailwind.config.js (excerpt)
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "#F8F4ED",
        surface: "#F7F2EB",
        surfaceAlt: "#E4D4C8",

        textMain: "#4A2E1F",
        textSecondary: "#8C7E76",

        scop: "#F3E8D9",
        scopAccent: "#C5A170",

        kuno: "#EFE7DF",
        kunoAccent: "#BCA690",

        abil: "#F3E1D8",
        abilAccent: "#C4775A",

        flex: "#EBE8DD",
        flexAccent: "#A4A07A",

        intel: "#F4EDE3",
        intelAccent: "#C9A679"
      },
      borderRadius: {
        card: "22px",
        cta: "26px"
      },
      boxShadow: {
        card: "0 4px 16px rgba(0,0,0,0.05)",
        soft: "0 2px 8px rgba(0,0,0,0.04)",
        ctaHover: "0 6px 22px rgba(0,0,0,0.07)"
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      }
    }
  }
};
9. Usage Guidelines (Summary)
Structure stays the same across modules.
Only the module accent tokens (scop.*, kuno.*, abil.*, flex.*, intel.*) change.

Cards always use card.radius, card.shadow, and the module-specific *.bg / *.bgSoft.

Primary CTAs:

Knowledge / learning flows → cta.kunoPrimary

Practice / reset flows → cta.abilPrimary

Text:

Main content → ui.text.primary

Meta / helper text → ui.text.secondary or ui.text.muted.

Never introduce new strong colors outside this system without updating the tokens first.
All new components should be expressed in terms of these tokens.