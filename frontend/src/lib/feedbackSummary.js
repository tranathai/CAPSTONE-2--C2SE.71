export const AI_SUMMARY_DISCLAIMER = "bản tóm tắt này chỉ mang tính chất tham khảo";

/** Chuẩn hóa hiển thị: disclaimer xuống dòng riêng (kể cả bản lưu cũ nối cùng dòng). */
export function displayAiSummary(text) {
  if (!text || !String(text).trim()) return "";

  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks = [];
  for (const line of lines) {
    if (line.toLowerCase() === AI_SUMMARY_DISCLAIMER.toLowerCase()) {
      blocks.push(AI_SUMMARY_DISCLAIMER);
      continue;
    }
    if (line.includes(AI_SUMMARY_DISCLAIMER)) {
      const body = line.replace(new RegExp(AI_SUMMARY_DISCLAIMER, "gi"), "").trim();
      if (body) blocks.push(body);
      blocks.push(AI_SUMMARY_DISCLAIMER);
    } else {
      blocks.push(line);
    }
  }

  return blocks.join("\n");
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
