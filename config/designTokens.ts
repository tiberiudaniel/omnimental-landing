import rawTokens from "./designTokens.json";

export type ModuleTokenId = "scop" | "kuno" | "abil" | "flex" | "intel";

export type ModuleTone = {
  bg: string;
  bgSoft: string;
  accent: string;
  textMain: string;
  textSecondary: string;
  gradient: string;
};

export type BrandTokens = {
  beigeLight: string;
  beige: string;
  beigeDeep: string;
  brownDark: string;
  cream: string;
  goldSoft: string;
  terracotta: string;
  oliveSoft: string;
  sand: string;
};

export type UITextTokens = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: string;
  borderStrong: string;
  focus: string;
  shadow: string;
};

export type GradientTokens = {
  primarySoft: string;
  kuno: string;
  abil: string;
  flex: string;
  intel: string;
};

export type ShadowTokens = {
  card: string;
  soft: string;
  hover: string;
};

export type TypographyTokens = {
  font: {
    display: string[];
    body: string[];
  };
  size: {
    xl: string;
    lg: string;
    md: string;
    sm: string;
    xs: string;
  };
  weight: {
    semibold: number;
    medium: number;
    regular: number;
  };
};

export type ComponentTokens = {
  card: {
    radius: string;
    padding: string;
    border: string;
    shadow: string;
  };
  cta: {
    radius: string;
    height: string;
    textColor: string;
    shadow: string;
    hoverShadow: string;
    variants: {
      kunoPrimary: {
        background: string;
        textColor: string;
      };
      abilPrimary: {
        background: string;
        textColor: string;
      };
      neutralSoft: {
        background: string;
        textColor: string;
      };
    };
  };
};

export interface DesignTokens {
  brand: BrandTokens;
  ui: UITextTokens;
  module: Record<ModuleTokenId, ModuleTone>;
  gradients: GradientTokens;
  shadows: ShadowTokens;
  typography: TypographyTokens;
  components: ComponentTokens;
}

const tokens = rawTokens as DesignTokens;

export const designTokens: DesignTokens = tokens;

export const moduleToneKeys = Object.keys(tokens.module) as ModuleTokenId[];
