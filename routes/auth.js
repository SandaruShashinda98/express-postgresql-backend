import express from "express";
import { validateRequest, schemas } from "../middleware/validation.js";
import { authenticate } from "../middleware/auth.js";
import { authController } from "../modules/auth/auth.controller.js";

const router = express.Router();

router.post(
  "/register",
  validateRequest(schemas.register),
  authController.register
);
router.post("/login", validateRequest(schemas.login), authController.login);
router.get("/me", authenticate, authController.getCurrentUser);

export default router;
