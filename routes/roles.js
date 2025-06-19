import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { roleController } from "../modules/auth/role.controller.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("roles.read"),
  roleController.getAllRoles
);
router.get(
  "/:id",
  authenticate,
  authorize("roles.read"),
  roleController.getRoleById
);
router.post(
  "/",
  authenticate,
  authorize("roles.create"),
  validateRequest(schemas.role),
  roleController.createRole
);
router.put(
  "/:id",
  authenticate,
  authorize("roles.update"),
  validateRequest(schemas.role),
  roleController.updateRole
);
router.delete(
  "/:id",
  authenticate,
  authorize("roles.delete"),
  roleController.deleteRole
);

export default router;
