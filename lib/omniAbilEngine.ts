import {
  OMNI_ABILITIES,
  getMovesForAbility,
  type OmniAbilId,
  type OmniAbilDefinition,
  type OmniAbilMoveDefinition,
} from "@/config/omniAbilConfig";

export type UserAbilityConfig = {
  activeAbilityIds: OmniAbilId[];
};

export type OmniAbilAbilityWithMoves = {
  ability: OmniAbilDefinition;
  moves: OmniAbilMoveDefinition[];
};

/**
 * Context simplu pentru selecția abilităților active.
 * În v1 folosim categoria misiunii active (energie, relatii, claritate, etc.).
 */
export type AbilitySelectionContext = {
  missionCategory?: string | null;
};

export function getDefaultUserAbilityConfig(): UserAbilityConfig {
  return {
    activeAbilityIds: OMNI_ABILITIES.map((a) => a.id),
  };
}

/**
 * Heuristici simple: mapează categoria misiunii (string) la abilități dominante.
 * Funcționează cu etichetele actuale (energie, somn, relatii, claritate, greutate, trading etc.).
 */
export function deriveUserAbilityConfigFromContext(ctx?: AbilitySelectionContext): UserAbilityConfig {
  const raw = (ctx?.missionCategory ?? "").toLowerCase().trim();

  if (!raw) {
    return getDefaultUserAbilityConfig();
  }

  const ids: OmniAbilId[] = [];

  const add = (id: OmniAbilId) => {
    if (!ids.includes(id)) ids.push(id);
  };

  if (raw.includes("energie") || raw.includes("energy") || raw.includes("somn") || raw.includes("sleep")) {
    add("energy");
    add("sleep_recovery");
  }

  if (raw.includes("claritate") || raw.includes("focus") || raw.includes("decizie") || raw.includes("decision")) {
    add("clarity_focus");
  }

  if (raw.includes("emotii") || raw.includes("emoții") || raw.includes("calm") || raw.includes("stress") || raw.includes("stres")) {
    add("emotional_balance");
  }

  if (raw.includes("greutate") || raw.includes("weight") || raw.includes("alimentatie") || raw.includes("nutrition")) {
    add("optimal_weight_management");
    add("energy");
  }

  if (raw.includes("relatii") || raw.includes("relații") || raw.includes("relationship") || raw.includes("communication")) {
    add("relationships");
    add("emotional_balance");
  }

  if (raw.includes("voință") || raw.includes("willpower") || raw.includes("disciplina") || raw.includes("discipline")) {
    add("willpower_perseverance");
  }

  if (raw.includes("trading") || raw.includes("market") || raw.includes("piata")) {
    add("trading_psychology");
    add("clarity_focus");
    add("emotional_balance");
  }

  if (ids.length === 0) {
    return getDefaultUserAbilityConfig();
  }

  return { activeAbilityIds: ids };
}

/**
 * Varianta generică (backwards compatible) – folosită în alte părți ale codului.
 */
export function getUserAbilitiesWithMoves(config?: UserAbilityConfig): OmniAbilAbilityWithMoves[] {
  const effectiveConfig = config ?? getDefaultUserAbilityConfig();
  return effectiveConfig.activeAbilityIds
    .map((id) => {
      const ability = OMNI_ABILITIES.find((a) => a.id === id);
      if (!ability) return null;
      const moves = getMovesForAbility(id);
      return { ability, moves };
    })
    .filter((entry): entry is OmniAbilAbilityWithMoves => Boolean(entry));
}

/**
 * Varianta personalizată: pornește de la context (ex.: misiunea activă) și derivă abilitatea.
 * Pagina OmniAbil va folosi asta.
 */
export function getUserAbilitiesWithMovesFromContext(
  ctx?: AbilitySelectionContext,
): OmniAbilAbilityWithMoves[] {
  const config = deriveUserAbilityConfigFromContext(ctx);
  return getUserAbilitiesWithMoves(config);
}
