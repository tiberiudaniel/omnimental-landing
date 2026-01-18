export const NAV_REASON = {
  INTRO_HANDOFF: "intro_handoff",
  GUIDED_DAY1_REFLECTION_COMPLETE: "guided_day1_reflection_complete",
  TODAY_RESET_SOURCE: "today_reset_source",
  GUIDED_DAY1_START: "guided_day1_start",
  TODAY_PRIMARY_START: "today_primary_start",
  EARN_GATE_ENTRY: "earn_gate_entry",
  TODAY_DEEP_LOOP_LOCKED: "today_deep_loop_locked",
  TODAY_DEEP_LOOP: "today_deep_loop",
  TODAY_EXPLORE_CAT: "today_explore_cat",
  TODAY_EXPLORE_AXES: "today_explore_axes",
  SESSION_COMPLETE_NAV: "session_complete_nav",
  TODAY_RUN_COMPLETE: "today_run_complete",
  TODAY_NEXT_AUTO: "today_next_auto",
  TODAY_NEXT_MANUAL_START: "today_next_manual_start",
  TODAY_NEXT_BACK: "today_next_back",
  EARN_EXIT_TO_TODAY: "earn_exit_to_today",
  EARN_UPGRADE: "earn_upgrade",
  EARN_GRANTED_CREDIT: "earn_granted_credit",
} as const;

export type NavReasonCode = (typeof NAV_REASON)[keyof typeof NAV_REASON];
