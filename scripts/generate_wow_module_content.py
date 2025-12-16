#!/usr/bin/env python3
import json
from pathlib import Path

MODULE_SPECS = [
    ("clarity_01_illusion_of_clarity", "clarity_cluster", {"ro": "Iluzia clarității", "en": "Illusion of Clarity"}),
    ("clarity_02_one_real_thing", "clarity_cluster", {"ro": "Un singur lucru real", "en": "One Real Thing"}),
    ("clarity_03_fog_vs_fatigue", "clarity_cluster", {"ro": "Ceață vs. oboseală", "en": "Fog vs. Fatigue"}),
    ("clarity_04_brutal_writing", "clarity_cluster", {"ro": "Scriere brutală", "en": "Brutal Writing"}),
    ("clarity_05_decisions_without_data", "clarity_cluster", {"ro": "Decizii fără date perfecte", "en": "Decisions Without Data"}),
    ("focus_energy_01_energy_not_motivation", "focus_energy_cluster", {"ro": "Energia ≠ motivație", "en": "Energy ≠ Motivation"}),
    ("focus_energy_02_cognitive_fragmentation_cost", "focus_energy_cluster", {"ro": "Costul fragmentării cognitive", "en": "Cognitive Fragmentation Cost"}),
    ("focus_energy_03_entering_state_vs_forcing", "focus_energy_cluster", {"ro": "Intră în stare, nu forța", "en": "Entering State vs. Forcing"}),
    ("focus_energy_04_real_signals_of_exhaustion", "focus_energy_cluster", {"ro": "Semnale reale de epuizare", "en": "Real Signals of Exhaustion"}),
    ("focus_energy_05_minimum_energy_rule", "focus_energy_cluster", {"ro": "Regula energiei minime", "en": "Minimum Energy Rule"}),
    ("emotional_flex_01_automatic_reaction_amygdala", "emotional_flex_cluster", {"ro": "Reacția automată", "en": "Automatic Reaction"}),
    ("emotional_flex_02_facts_vs_interpretations", "emotional_flex_cluster", {"ro": "Fapte vs. interpretări", "en": "Facts vs. Interpretations"}),
    ("emotional_flex_03_discomfort_tolerance", "emotional_flex_cluster", {"ro": "Toleranța disconfortului", "en": "Discomfort Tolerance"}),
    ("emotional_flex_04_fast_emotional_reset", "emotional_flex_cluster", {"ro": "Reset emoțional rapid", "en": "Fast Emotional Reset"}),
    ("emotional_flex_05_choice_of_response", "emotional_flex_cluster", {"ro": "Alegerea răspunsului", "en": "Choice of Response"}),
]

SECTION_HEADERS = {
    "HOOK",
    "MIRROR",
    "CORE INSIGHT",
    "ACTIVE CHECK",
    "MICRO-SIMULATOR",
    "REAL-WORLD TRANSFER",
    "ANCHOR PHRASE",
    "CLOSE",
}

ROOT_DIR = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT_DIR / "DOCS" / "TEME V3"
OUTPUT_PATH = ROOT_DIR / "config" / "dailyPaths" / "wow" / "data.ts"


def detect_lang(line: str):
    upper = line.upper()
    if "ROM" in upper:
        return "ro"
    if "ENG" in upper:
        return "en"
    return None


def to_paragraph(lines):
    trimmed = list(lines)
    while trimmed and trimmed[0].strip() == "":
        trimmed.pop(0)
    while trimmed and trimmed[-1].strip() == "":
        trimmed.pop()
    return "\n".join(trimmed).strip()


def parse_active_check(lines):
    question_lines = []
    options = []
    feedback_lines = []
    correct = ""
    collecting_feedback = False
    question_started = False

    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        upper = line.upper()
        if upper.startswith("ÎNTREBARE") or upper.startswith("QUESTION"):
            question_started = True
            continue
        if len(line) > 2 and line[1] == ")" and line[0].isalpha():
            options.append({"id": line[0], "label": line[2:].strip()})
            collecting_feedback = False
            question_started = False
            continue
        if upper.startswith("CORECT") or upper.startswith("CORRECT"):
            parts = line.split(":")
            if len(parts) > 1:
                correct = parts[1].strip().upper()[:1]
            collecting_feedback = True
            continue
        if upper.startswith("FEEDBACK"):
            collecting_feedback = True
            continue
        if collecting_feedback:
            feedback_lines.append(line)
            continue
        if not question_started:
            question_started = True
        question_lines.append(line)

    if not options:
        raise ValueError("Active Check missing options")
    if not correct:
        correct = options[0]["id"]
    return {
        "question": " ".join(question_lines).replace("  ", " ").strip(),
        "options": options,
        "correctOptionId": correct,
        "feedback": "\n".join(feedback_lines).strip(),
    }


def build_content(storage):
    content = {}
    if "HOOK" in storage:
        content["hook"] = to_paragraph(storage["HOOK"])
    if "MIRROR" in storage:
        content["mirror"] = to_paragraph(storage["MIRROR"])
    if "CORE INSIGHT" in storage:
        content["coreInsight"] = to_paragraph(storage["CORE INSIGHT"])
    if "ACTIVE CHECK" in storage:
        content["activeCheck"] = parse_active_check(storage["ACTIVE CHECK"])
    if "MICRO-SIMULATOR" in storage:
        content["microSimulator"] = to_paragraph(storage["MICRO-SIMULATOR"])
    if "REAL-WORLD TRANSFER" in storage:
        content["realWorld"] = to_paragraph(storage["REAL-WORLD TRANSFER"])
    if "ANCHOR PHRASE" in storage:
        content["anchorPhrase"] = to_paragraph(storage["ANCHOR PHRASE"])
    if "CLOSE" in storage:
        content["close"] = to_paragraph(storage["CLOSE"])
    return content


def parse_module_file(file_path: Path):
    buckets = {
        "deep": {"ro": {}, "en": {}},
        "short": {"ro": {}, "en": {}},
    }
    current_depth = None
    current_lang = None
    current_section = None

    def append_line(text: str):
        if not current_depth or not current_lang or not current_section:
            raise ValueError(f"Missing context before content line in {file_path}")
        bucket = buckets[current_depth][current_lang]
        bucket.setdefault(current_section, []).append(text.rstrip())

    for original in file_path.read_text(encoding="utf-8").splitlines():
        line = original.strip()
        if not line:
            if current_depth and current_lang and current_section:
                append_line("")
            continue
        upper = line.upper()
        if upper.startswith("NOTE"):
            break
        if line.startswith("CLUSTER"):
            continue
        if "LIMBA" in upper:
            lang = detect_lang(line)
            if lang:
                current_lang = lang
                current_section = None
            continue
        if upper.startswith("MODUL") and "DEEP" in upper:
            current_depth = "deep"
            lang_from_line = detect_lang(line)
            if lang_from_line:
                current_lang = lang_from_line
            current_section = None
            continue
        if upper.startswith("MODUL") and "SHORT" in upper:
            current_depth = "short"
            lang_from_line = detect_lang(line)
            if lang_from_line:
                current_lang = lang_from_line
            current_section = None
            continue
        if upper.startswith("DEEP"):
            current_depth = "deep"
            lang_from_line = detect_lang(line)
            if lang_from_line:
                current_lang = lang_from_line
            current_section = None
            continue
        if upper.startswith("SHORT"):
            current_depth = "short"
            lang_from_line = detect_lang(line)
            if lang_from_line:
                current_lang = lang_from_line
            current_section = None
            continue
        if line.upper() in SECTION_HEADERS:
            current_section = line.upper()
            continue
        if not current_depth or not current_lang or not current_section:
            continue
        append_line(original)

    return {
        "deep": {
            "ro": build_content(buckets["deep"]["ro"]),
            "en": build_content(buckets["deep"]["en"]),
        },
        "short": {
            "ro": build_content(buckets["short"]["ro"]),
            "en": build_content(buckets["short"]["en"]),
        },
    }


def run():
    modules = []
    for key, cluster, titles in MODULE_SPECS:
        file_path = DOCS_DIR / f"{key}.md"
        if not file_path.exists():
            raise FileNotFoundError(f"Missing source file for {key}")
        sections = parse_module_file(file_path)
        modules.append(
            {
                "moduleKey": key,
                "cluster": cluster,
                "titles": titles,
                "sections": sections,
            }
        )

    header = '// AUTO-GENERATED FILE. Run "python3 scripts/generate_wow_module_content.py" to update.\n'
    import_line = 'import type { WowModuleContent } from "./types";\n\n'
    body = f"export const WOW_MODULE_CONTENT: WowModuleContent[] = {json.dumps(modules, ensure_ascii=False, indent=2)};\n"
    OUTPUT_PATH.write_text(header + import_line + body, encoding="utf-8")
    print(f"Generated WOW module content at {OUTPUT_PATH}")


if __name__ == "__main__":
    run()
