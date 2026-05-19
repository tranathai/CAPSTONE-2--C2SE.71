import jwt from "jsonwebtoken";

export function protect(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Khong co token, quyen truy cap bi tu choi" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "temporary_secret_key");
    req.user = { id: decoded.id };
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Khong co quyen truy cap" });
  }
}
