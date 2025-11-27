#!/usr/bin/env python3

import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
TS_PATH = ROOT / "config" / "omniKunoLessonContent.ts"

ARC_ZONE_KEYS = ("trezire", "primele_ciocniri", "profunzime", "maestrie")

MODULE_DEFINITIONS = [
  {
    "key": "emotional_balance",
    "moduleId": "emotional_balance",
    "title": "Echilibru Emoțional",
    "md": ROOT / "DOCS" / "TEME" / "omniKuno_emotional_balance.md",
  },
  {
    "key": "focus_clarity",
    "moduleId": "focus_clarity",
    "title": "Claritate și Focus",
    "md": ROOT / "DOCS" / "TEME" / "omniKuno_focus_clarity.md",
  },
  {
    "key": "relationships_communication",
    "moduleId": "relationships_communication",
    "title": "Relații și Comunicare",
    "md": ROOT / "DOCS" / "TEME" / "omniKuno_relationships_communication.md",
  },
  {
    "key": "energy_body",
    "moduleId": "energy_body",
    "title": "Energie & Corp",
    "md": ROOT / "DOCS" / "TEME" / "omniKuno_energy_body.md",
  },
  {
    "key": "self_trust",
    "moduleId": "self_trust",
    "title": "Încredere în Sine",
    "md": ROOT / "DOCS" / "TEME" / "omniKuno_self_trust.md",
  },
  {
    "key": "decision_discernment",
    "moduleId": "decision_discernment",
    "title": "Discernământ & Decizii",
    "md": ROOT / "DOCS" / "TEME" / "omniKuno_decision_discernment.md",
  },
  {
    "key": "willpower_perseverance",
    "moduleId": "willpower_perseverance",
    "title": "Voință & Perseverență",
    "md": ROOT / "DOCS" / "TEME" / "omniKuno-willpower-perseverance.md",
  },
]


def parse_md(text: str):
    lines = text.splitlines()
    lessons = []
    current_lesson = None
    current_screen = None

    def flush_screen():
        nonlocal current_screen
        if current_lesson and current_screen:
            if "id" not in current_screen or not current_screen["id"]:
                current_screen["id"] = f"{current_lesson['lessonId']}-screen-{len(current_lesson['screens']) + 1}"
            current_lesson["screens"].append(current_screen)
        current_screen = None

    def flush_lesson():
        nonlocal current_lesson
        flush_screen()
        if current_lesson:
            lessons.append(current_lesson)
        current_lesson = None

    i = 0
    while i < len(lines):
        raw = lines[i]
        trimmed = raw.strip()
        if trimmed.startswith("# "):
            flush_lesson()
            lesson_id = trimmed[2:].strip()
            if lesson_id:
                current_lesson = {"lessonId": lesson_id, "screens": []}
            i += 1
            continue
        screen_match = re.match(r"\[SCREEN\s+([a-zA-Z]+)\]", trimmed)
        if screen_match:
            flush_screen()
            kind = screen_match.group(1).lower()
            current_screen = {"kind": kind}
            i += 1
            continue
        if not current_screen:
            i += 1
            continue

        if trimmed.lower().startswith("steps:"):
            current_screen["steps"] = []
            i += 1
            while i < len(lines) and lines[i].strip().startswith("-"):
                current_screen["steps"].append(lines[i].strip()[1:].strip())
                i += 1
            continue
        if trimmed.lower().startswith("options:"):
            current_screen["options"] = []
            i += 1
            while i < len(lines) and lines[i].strip().startswith("-"):
                current_screen["options"].append(lines[i].strip()[1:].strip())
                i += 1
            continue

        key_match = re.match(r"([A-Za-z]+):\s*(.*)", trimmed)
        if key_match:
            key = key_match.group(1).lower()
            value = key_match.group(2) or ""
            buffer = [value]
            j = i + 1
            while j < len(lines):
                lookahead = lines[j]
                look_trim = lookahead.strip()
                if (
                    not lookahead
                    or look_trim.startswith("# ")
                    or look_trim.startswith("[SCREEN")
                    or re.match(r"[A-Za-z]+:\s*", look_trim)
                    or look_trim.lower().startswith("steps:")
                    or look_trim.lower().startswith("options:")
                    or look_trim.startswith("-")
                ):
                    break
                buffer.append(lookahead.strip())
                j += 1
            combined = "\n".join(part for part in buffer if part).strip()
            if key == "correctindex":
                current_screen["correctIndex"] = int(combined or 0)
            elif key in {"title", "body", "helper", "question", "explanation", "prompt", "id"}:
                current_screen[key] = combined
            i = j
            continue

        i += 1

    flush_lesson()
    return lessons


def resolve_arc_zone(lesson_id: str) -> str | None:
    for zone in ARC_ZONE_KEYS:
        if lesson_id.endswith(zone):
            return zone
    return None


def split_lessons_and_arcs(lessons, module_id: str) -> Tuple[List[dict], Dict[str, dict]]:
    arcs: Dict[str, dict] = {}
    payload: List[dict] = []
    arc_prefix = f"{module_id}_arc_"
    final_test_id = f"{module_id}_final_test"
    for lesson in lessons:
        lesson_id = lesson["lessonId"]
        if lesson_id == final_test_id:
            continue
        if lesson_id.startswith(arc_prefix):
            zone = resolve_arc_zone(lesson_id)
            if not zone:
                continue
            arc_screen = next((screen for screen in lesson["screens"] if screen.get("kind") == "arcintro"), None)
            if arc_screen:
                arcs[zone] = {
                    "id": lesson_id,
                    "title": arc_screen.get("title", ""),
                    "body": arc_screen.get("body", ""),
                }
            continue
        payload.append(lesson)
    return payload, arcs


def build_ts(module_payload: Dict[str, dict]):
    lesson_map: Dict[str, dict] = {}
    arc_groups: Dict[str, dict] = {}
    modules_serializable: Dict[str, dict] = {}
    for key, module in module_payload.items():
        arc_groups[key] = module["arcIntros"]
        modules_serializable[key] = {
            "id": module["id"],
            "title": module["title"],
            "arcIntros": module["arcIntros"],
            "lessons": module["lessons"],
        }
        for lesson in module["lessons"]:
            lesson_map[lesson["lessonId"]] = lesson

    header = """export type OmniKunoArcZoneKey = "trezire" | "primele_ciocniri" | "profunzime" | "maestrie";

export type OmniKunoScreenKind = "content" | "checkpoint" | "quiz" | "reflection" | "protocol" | "arcIntro";

export type OmniKunoLessonScreen =
  | {
      id?: string;
      kind: "content";
      title: string;
      body: string;
      bullets?: string[];
    }
  | {
      id?: string;
      kind: "checkpoint";
      title: string;
      steps: string[];
      helper?: string;
    }
  | {
      id?: string;
      kind: "quiz";
      title: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    }
  | {
      id?: string;
      kind: "reflection";
      title: string;
      prompt: string;
    }
  | {
      id?: string;
      kind: "protocol";
      title: string;
      body?: string;
      steps?: string[];
    }
  | {
      id?: string;
      kind: "arcIntro";
      title: string;
      body: string;
    };

export type OmniKunoLessonContent = {
  lessonId: string;
  screens: OmniKunoLessonScreen[];
};

export type OmniKunoArcIntro = {
  id: string;
  title: string;
  body: string;
};

export type OmniKunoArcIntroGroup = Record<OmniKunoArcZoneKey, OmniKunoArcIntro>;

export type OmniKunoModuleContent = {
  id: string;
  title: string;
  arcIntros: OmniKunoArcIntroGroup;
  lessons: OmniKunoLessonContent[];
};

export type OmniKunoArcIntroGroups = Record<string, OmniKunoArcIntroGroup>;
"""
    module_str = json.dumps(modules_serializable, ensure_ascii=False, indent=2)
    arc_str = json.dumps(arc_groups, ensure_ascii=False, indent=2)
    lessons_str = json.dumps(lesson_map, ensure_ascii=False, indent=2)
    return (
        f"{header}\n"
        f"export const OMNI_KUNO_MODULE_CONTENT: Record<string, OmniKunoModuleContent> = {module_str};\n\n"
        f"export const OMNI_KUNO_ARC_INTROS: OmniKunoArcIntroGroups = {arc_str};\n\n"
        f"export const OMNI_KUNO_LESSON_CONTENT: Record<string, OmniKunoLessonContent> = {lessons_str};\n"
    )


def main():
    modules_payload: Dict[str, dict] = {}
    for module in MODULE_DEFINITIONS:
        md_text = module["md"].read_text(encoding="utf-8")
        lessons = parse_md(md_text)
        filtered, arcs = split_lessons_and_arcs(lessons, module["moduleId"])
        missing_arc_keys = [zone for zone in ARC_ZONE_KEYS if zone not in arcs]
        if missing_arc_keys:
            raise RuntimeError(f"Module {module['key']} is missing arc intros for: {', '.join(missing_arc_keys)}")
        modules_payload[module["key"]] = {
            "id": module["moduleId"],
            "title": module["title"],
            "arcIntros": {zone: arcs[zone] for zone in ARC_ZONE_KEYS},
            "lessons": filtered,
        }

    ts_content = build_ts(modules_payload)
    TS_PATH.write_text(ts_content, encoding="utf-8")
    total_lessons = sum(len(module["lessons"]) for module in modules_payload.values())
    print(f"Wrote {total_lessons} lessons across {len(modules_payload)} modules to {TS_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
