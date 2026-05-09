export function errorHandler(err, _req, res, _next) {
  console.error("[Error]", err?.message || err);

  if (err?.code === "ER_NO_SUCH_TABLE") {
    return res.status(500).json({ success: false, message: "Lỗi cấu trúc database — vui lòng chạy lại schema" });
  }
  if (err?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ success: false, message: "Dữ liệu đã tồn tại (trùng lặp)" });
  }

  return res.status(500).json({ success: false, message: "Lỗi server nội bộ" });
}
