export const AI_SUMMARY_DISCLAIMER = "bản tóm tắt này chỉ mang tính chất tham khảo";

/** Chuẩn hóa hiển thị: gộp nội dung, disclaimer chỉ một dòng ở cuối (kể cả bản lưu cũ lặp disclaimer). */
export function displayAiSummary(text) {
  if (!text || !String(text).trim()) return "";

  const cleaned = String(text)
    .replace(new RegExp(AI_SUMMARY_DISCLAIMER, "gi"), "")
    .trim();

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return AI_SUMMARY_DISCLAIMER;
  return `${lines.join("\n")}\n${AI_SUMMARY_DISCLAIMER}`;
}

/** Khởi map id → tóm tắt đã lưu từ API feedbacks. */
export function summariesFromFeedbacks(feedbacks) {
  const map = {};
  if (!Array.isArray(feedbacks)) return map;
  for (const f of feedbacks) {
    if (f.ai_summary) map[f.id] = displayAiSummary(f.ai_summary);
  }
  return map;
}
