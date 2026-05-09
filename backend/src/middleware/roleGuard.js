export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }
    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập trang này" });
    }
    next();
  };
}
