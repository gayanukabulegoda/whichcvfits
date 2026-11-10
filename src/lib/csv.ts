import type { GradedCandidate } from "./contracts.ts";
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  // Quoting alone does not neutralize formulas in spreadsheet applications.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))
    text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function candidatesCsv(candidates: GradedCandidate[]): string {
  const rows: unknown[][] = [
    [
      "Rank",
      "Candidate",
      "Email",
      "Role",
      "Match score",
      "Fit tier",
      "Shortlisted",
      "Actual model",
      "Matched skills",
      "Missing skills",
      "Summary",
    ],
  ];
  for (const c of candidates)
    rows.push([
      c.rankOrder,
      c.candidateName,
      c.candidateEmail,
      c.candidateRole,
      c.overallScore,
      c.fitTier || "Legacy result",
      c.isFilteredIn ? "Yes" : "No",
      c.actualModel || "Unavailable",
      c.matchedSkills.join("; "),
      c.missingSkills.join("; "),
      c.executiveSummary,
    ]);
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
