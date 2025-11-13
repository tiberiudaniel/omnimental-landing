Dashboard metrics — calculations and sources

Scope: documents how the dashboard numbers are computed, their sources, and the fields mirrored into progressFacts.omni for UI use.

Indices
- Omni‑Cuno (Knowledge)
  - Source: userKnowledgeAssessments.score.percent across runs.
  - Stored fields (progressFacts.omni.kuno):
    - knowledgeIndex: latest percent (0–100)
    - averagePercent: EWMA of percents (alpha 0.4) falling back to mean
    - runsCount: total runs considered
  - Helper: computeKunoAggregate(percs[], alpha=0.4) in lib/dashboardMetrics.ts

- Omni‑Abil (Abilities/Practice)
  - Sources:
    - userAbilityAssessments.result.probes[*].scaled or raw/maxRaw → percent per probe
    - progressFacts.omni.abil.exercisesCompletedCount (practice signal)
  - Calculation: assessMean = average probe percent across runs; practiceBoost = min(100, exercisesCompletedCount*3)
    practiceIndex = 0.7*assessMean + 0.3*practiceBoost
  - Stored fields (progressFacts.omni.abil):
    - skillsIndex: latest assessment mean (fallback)
    - practiceIndex: blended score (0–100)
    - runsCount: assessments counted
  - Helper: computeAbilityIndex(assessments[], exercisesCompletedCount)

- Motivation Index
  - Source: progressFacts.motivation (urgency 1–10, determination 1–5, hoursPerWeek 0–8, learnFromOthers, scheduleFit, budgetLevel)
  - Calculation: 0.5*urg + 0.3*det + 0.2*hrs, modest +/- 5% adjustments from learnFromOthers & scheduleFit; budget penalty when low budget & <=1h/week.
  - Stored field: progressFacts.omni.scope.motivationIndex (0–100). Base directionMotivationIndex preserved.
  - Helper: computeMotivationIndexEnhanced(input)

- OmniFlow (Adaptation)
  - Sources: progressFacts.practiceSessions
  - Components:
    - consistency14: distinct active days in last 14 days → 0–100 (lib/omniIntel.computeConsistencyIndexFromDates)
    - streakCurrent, streakBest: from 30‑day window (>=3 min/day criterion)
    - recency: 100 if activity in last 24h, 80 if <=3d, 60 if <=7d, else 30
    - balance: entropy of distribution across reflection/breathing/drill (0..log2(3)) → 0–100
  - Flow index: 0.4*consistency14 + 0.3*streakCurrent*(100/14) + 0.2*recency + 0.1*balance
  - Stored fields (progressFacts.omni.flow): flowIndex, streakCurrent, streakBest
  - Helper: computeFlowIndex(sessions, referenceMs)

Backfill integration
- Implemented in lib/progressFacts.ts inside backfillProgressFacts():
  - Queries userKnowledgeAssessments and userAbilityAssessments for the profile and merges computed fields into progressFacts.omni.
  - Computes motivationIndex and flowIndex from existing fields and sessions.

Demo data
- lib/demoData.ts populates these fields so /progress?demo=1|2|3 render complete indices.

UI consumption
- components/dashboard/ProgressDashboard.tsx reads the omni block and shows:
  - Omni‑Cuno Avg, Omni‑Abil, Motivare, OmniFlow.

