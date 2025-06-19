import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { userController } from "../modules/users/user.controller.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("users.read"),
  userController.getAllUsers
);

router.get(
  "/:id",
  authenticate,
  authorize("users.read"),
  userController.getUserById
);

router.put(
  "/:id",
  authenticate,
  authorize("users.update"),
  validateRequest(schemas.user),
  userController.updateUser
);

router.delete(
  "/:id",
  authenticate,
  authorize("users.delete"),
  userController.deleteUser
);

export default router;
