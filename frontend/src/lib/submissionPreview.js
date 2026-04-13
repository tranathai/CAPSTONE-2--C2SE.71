export function submissionFileKind(filePath) {
  if (!filePath) return "none";
  const base = filePath.split("?")[0].toLowerCase();
  if (base.endsWith(".pdf")) return "pdf";
  if (base.endsWith(".docx")) return "docx";
  if (base.endsWith(".doc")) return "doc";
  return "other";
}