export const AI_SUMMARY_DISCLAIMER = "bản tóm tắt này chỉ mang tính chất tham khảo";

/** Gắn disclaimer một lần ở cuối phần tóm tắt AI. */
export function formatSummaryWithDisclaimer(text) {
  if (!text || !String(text).trim()) return "";

  const cleaned = String(text)
    .replace(new RegExp(AI_SUMMARY_DISCLAIMER, "gi"), "")
    .trim();

  const rawLines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const lines = [];
  for (const line of rawLines) {
    const chunks = line.split(/(?=\s*(?:[-•*]|\d+[.)])\s+)/).map((c) => c.trim()).filter(Boolean);
    if (chunks.length > 1) lines.push(...chunks);
    else lines.push(line);
  }

  const body = lines.join("\n");
  if (!body) return AI_SUMMARY_DISCLAIMER;
  return `${body}\n${AI_SUMMARY_DISCLAIMER}`;
}
