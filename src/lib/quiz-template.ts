/**
 * Quiz question template — the exact column layout a trainer uploads when
 * bulk-loading questions via "Upload Excel". Kept in one place so the download
 * a trainer gets always matches what the importer expects.
 *
 * Delivered as a CSV (opens directly in Excel / Google Sheets). A couple of
 * filled example rows show the expected shape; the trainer replaces them.
 */

import { downloadCsv, toCsv } from "@/lib/csv";

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
