import { validationResult } from "express-validator";
import { fail } from "../utils/api-response.js";

export function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }
  return fail(res, "Du lieu dau vao khong hop le", 400, result.array());
}
