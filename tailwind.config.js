/* eslint-disable @typescript-eslint/no-require-imports */
const plugin = require("tailwindcss/plugin");
const designTokens = require("./config/designTokens.json");

const moduleColors = designTokens.module;

const colors = {
  background: designTokens.ui.background,
  surface: designTokens.ui.surface,
  surfaceAlt: designTokens.ui.surfaceAlt,
  textMain: designTokens.ui.text.primary,
  textSecondary: designTokens.ui.text.secondary,
  textMuted: designTokens.ui.text.muted,
  border: designTokens.ui.border,
  borderStrong: designTokens.ui.borderStrong,
  focus: designTokens.ui.focus,
};

for (const [key, tone] of Object.entries(moduleColors)) {
  colors[key] = tone.bg;
  colors[`${key}Bg`] = tone.bg;
  colors[`${key}BgSoft`] = tone.bgSoft;
  colors[`${key}Accent`] = tone.accent;
  colors[`${key}TextMain`] = tone.textMain;
  colors[`${key}TextSecondary`] = tone.textSecondary;
}

module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors,
      borderRadius: {
        card: designTokens.components.card.radius,
        cta: designTokens.components.cta.radius,
      },
      boxShadow: {
        card: designTokens.shadows.card,
        soft: designTokens.shadows.soft,
        ctaHover: designTokens.shadows.hover,
      },
      fontFamily: {
        display: designTokens.typography.font.display,
        body: designTokens.typography.font.body,
        sans: designTokens.typography.font.body,
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      const gradients = {
        "bg-gradient-primary-soft": designTokens.gradients.primarySoft,
      };
      Object.entries(designTokens.module).forEach(([key, tone]) => {
        gradients[`bg-gradient-${key}`] = tone.gradient;
      });
      const utilities = Object.fromEntries(
        Object.entries(gradients).map(([className, gradient]) => [`.${className}`, { backgroundImage: gradient }]),
      );
      addUtilities(utilities);
    }),
  ],
};
