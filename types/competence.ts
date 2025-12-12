export type CompetenceLevel = "foundation" | "operational" | "mastery";

export interface UserCompetence {
  energy: CompetenceLevel;
  clarity: CompetenceLevel;
  flex: CompetenceLevel;
  executive: CompetenceLevel;
  adaptive: CompetenceLevel;
  shielding: CompetenceLevel;
  identity: CompetenceLevel;
}

export type UserOverallCompetence = CompetenceLevel;
