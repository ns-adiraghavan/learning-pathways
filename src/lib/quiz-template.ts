/**
 * Quiz question template — the exact column layout a trainer uploads when
 * bulk-loading questions via "Upload Excel". Kept in one place so the download
 * a trainer gets always matches what the importer expects.
 *
 * Delivered as a CSV (opens directly in Excel / Google Sheets). A couple of
 * filled example rows show the expected shape; the trainer replaces them.
 */

import { downloadCsv, toCsv } from "@/lib/csv";
import type { BuilderQuestion, Difficulty } from "@/data/types";

/** Columns the importer reads, in order. */
export const QUIZ_TEMPLATE_COLUMNS = [
  "Question",
  "Difficulty (easy/medium/hard)",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct Option (A/B/C/D)",
  "Explanation",
] as const;

const EXAMPLE_ROWS: (string | number)[][] = [
  [
    "Which document defines how a nonconformity is recorded and closed?",
    "easy",
    "Corrective action procedure",
    "Client SOW",
    "Team charter",
    "Release note",
    "A",
    "Nonconformities follow the corrective action procedure end to end.",
  ],
  [
    "A vendor requests client data over personal email. The correct response is:",
    "hard",
    "Refuse and raise a security incident",
    "Send it password-protected",
    "Ask a manager to send it",
    "Share a read-only link",
    "A",
    "Any off-channel data request is an incident, regardless of intent.",
  ],
];

/** Build the template CSV text (headers + two example rows). */
export function quizTemplateCsv(): string {
  return toCsv([...QUIZ_TEMPLATE_COLUMNS], EXAMPLE_ROWS);
}

/** Trigger a download of the question template. */
export function downloadQuizTemplate(): void {
  downloadCsv("quiz-question-template.csv", quizTemplateCsv());
}

/** Parse one CSV line into cells, honouring quoted fields and escaped quotes. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function toDifficulty(value: string): Difficulty {
  const v = value.toLowerCase();
  if (v.startsWith("e")) return "easy";
  if (v.startsWith("h")) return "hard";
  return "medium";
}

/** Letter (A/B/C/D…) or 1-based number → 0-based option index. */
function toCorrectIndex(value: string, optionCount: number): number {
  const v = value.trim().toUpperCase();
  if (/^[A-Z]$/.test(v)) return Math.min(v.charCodeAt(0) - 65, optionCount - 1);
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1) return Math.min(n - 1, optionCount - 1);
  return 0;
}

/**
 * Parse the uploaded template CSV into editable questions. Matches the column
 * layout of QUIZ_TEMPLATE_COLUMNS. Blank/malformed lines are skipped. This is
 * how an Excel/CSV import lands the trainer in the full editor, populated.
 */
export function parseQuizTemplateCsv(csv: string): BuilderQuestion[] {
  const lines = csv
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const out: BuilderQuestion[] = [];
  // Skip the header row.
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvLine(lines[i]!);
    const prompt = c[0] ?? "";
    if (!prompt) continue;
    const options = [c[2] ?? "", c[3] ?? "", c[4] ?? "", c[5] ?? ""].filter(
      (o) => o.length > 0,
    );
    if (options.length < 2) continue;
    out.push({
      id: `imp-${Date.now()}-${i}`,
      prompt,
      difficulty: toDifficulty(c[1] ?? "medium"),
      options,
      correctIndex: toCorrectIndex(c[6] ?? "A", options.length),
      explanation: c[7] ?? "",
    });
  }
  return out;
}
