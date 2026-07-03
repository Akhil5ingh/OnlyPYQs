import re
import sys
from pathlib import Path

import pdfplumber


QUESTION_RE = re.compile(r"(?m)^\s*(\d{1,4})[\).]\s+(.+?)(?=^\s*\d{1,4}[\).]\s+|\Z)", re.S)
OPTION_RE = re.compile(r"(?is)(?:^|\s)(?:\(([A-D])\)|([A-D])[\).])\s+(.+?)(?=(?:\s(?:\([A-D]\)|[A-D][\).])\s)|\Z)")
ANSWER_RE = re.compile(r"(?i)\b(?:ans(?:wer)?|उत्तर)\s*[:\-]?\s*\(?([A-D])\)?")

TOPIC_KEYWORDS = {
    "Mechanics": ["motion", "force", "work", "energy", "power", "gravitation", "pressure", "friction", "projectile"],
    "Heat and Thermodynamics": ["heat", "temperature", "thermodynamics", "calorimetry", "specific heat"],
    "Waves and Sound": ["wave", "sound", "frequency", "wavelength", "echo", "ultrasonic"],
    "Optics": ["light", "lens", "mirror", "reflection", "refraction", "optics", "prism"],
    "Electricity and Magnetism": ["electric", "current", "voltage", "resistance", "magnet", "ohm", "circuit"],
    "Modern Physics": ["atom", "nuclear", "radioactive", "electron", "photoelectric", "x-ray"],
    "Units and Measurements": ["unit", "dimension", "measurement", "si unit", "physical quantity"],
}


def clean(value):
    return re.sub(r"\s+", " ", value or "").strip()


def infer_topic(text):
    lower = text.lower()
    scores = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in lower)
        if score:
            scores.append((score, topic))
    return sorted(scores, reverse=True)[0][1] if scores else "General Physics"


def extract_text(pdf_path):
    chunks = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            chunks.append(page.extract_text(x_tolerance=1, y_tolerance=3) or "")
    return "\n".join(chunks)


def extract_questions(text):
    questions = []
    for match in QUESTION_RE.finditer(text):
        number, body = match.groups()
        body = clean(body)
        answer_match = ANSWER_RE.search(body)
        answer = answer_match.group(1).upper() if answer_match else ""

        options = []
        option_matches = list(OPTION_RE.finditer(body))
        if option_matches:
            question_text = clean(body[: option_matches[0].start()])
            for option_match in option_matches:
                options.append(clean(option_match.group(3)))
        else:
            continue

        if len(options) < 2:
            continue

        questions.append(
            {
                "id": f"bpsc-physics-{number}",
                "topic": infer_topic(question_text),
                "question": question_text,
                "options": options[:4],
                "answer": answer,
                "explanation": "",
            }
        )
    return questions


def write_questions_js(questions, output_path):
    import json

    output_path.write_text(
        "window.BPSC_PHYSICS_QUESTIONS = "
        + json.dumps(questions, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python extract_pdf_questions.py path-to-pdf")
    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        raise SystemExit(f"Could not find PDF: {pdf_path}")
    questions = extract_questions(extract_text(pdf_path))
    write_questions_js(questions, Path(__file__).with_name("questions.js"))
    print(f"Extracted {len(questions)} questions into questions.js")


if __name__ == "__main__":
    main()
