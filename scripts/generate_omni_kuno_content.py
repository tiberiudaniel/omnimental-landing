#!/usr/bin/env python3

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "DOCS" / "DOCS" / "omniKuno_emotional_balance.md"
TS_PATH = ROOT / "config" / "omniKunoLessonContent.ts"


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


def build_ts(lessons):
    lesson_map = {lesson["lessonId"]: lesson for lesson in lessons}
    header = """export type OmniKunoScreenKind = "content" | "checkpoint" | "quiz" | "reflection";

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
      explanation: string;
    }
  | {
      id?: string;
      kind: "reflection";
      title: string;
      prompt: string;
    };

export type OmniKunoLessonContent = {
  lessonId: string;
  screens: OmniKunoLessonScreen[];
};
"""
    data_str = json.dumps(lesson_map, ensure_ascii=False, indent=2)
    return f"{header}\nexport const OMNI_KUNO_LESSON_CONTENT: Record<string, OmniKunoLessonContent> = {data_str};\n"


def main():
    md_text = MD_PATH.read_text(encoding="utf-8")
    lessons = [lesson for lesson in parse_md(md_text) if lesson["lessonId"] != "calm_final_test"]
    ts_content = build_ts(lessons)
    TS_PATH.write_text(ts_content, encoding="utf-8")
    print(f"Wrote {len(lessons)} lessons to {TS_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
