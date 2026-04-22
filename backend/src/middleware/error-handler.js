export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Khong tim thay endpoint: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error?.code === "ER_NO_SUCH_TABLE") {
    return res.status(500).json({
      success: false,
      message: "Sai schema database hoac thieu bang",
    });
  }
  return res.status(500).json({
    success: false,
    message: error?.message || "Internal server error",
  });
}
