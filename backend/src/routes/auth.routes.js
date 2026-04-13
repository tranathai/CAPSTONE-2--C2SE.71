import { Router } from "express";
import { body } from "express-validator";
import { getMe, login, register } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Gmail khong dung dinh dang vui long nhap lai")
    .matches(/^[^\s@]+@(gmail\.com|gmail\.edu\.vn)$/)
    .withMessage("Gmail khong dung dinh dang vui long nhap lai"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mat khau toi thieu 6 ky tu")
    .matches(/[A-Z]/)
    .withMessage("Mat khau phai co chu in hoa")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/)
    .withMessage("Mat khau phai co ky tu dac biet"),
  body("fullName").notEmpty().withMessage("Ho ten khong duoc de trong"),
  body("role").isIn(["student", "teacher"]).withMessage("Vai tro khong hop le"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Gmail khong dung dinh dang vui long nhap lai")
    .matches(/^[^\s@]+@(gmail\.com|gmail\.edu\.vn)$/)
    .withMessage("Gmail khong dung dinh dang vui long nhap lai"),
  body("password").notEmpty().withMessage("Mat khau khong duoc de trong"),
  body("role").isIn(["student", "teacher"]).withMessage("Vai tro khong hop le"),
];

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", protect, getMe);

export default router;
