import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { postController } from "../modules/posts/post.controller.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("posts.read"),
  postController.getAllPosts
);
router.get(
  "/my/posts",
  authenticate,
  authorize("posts.read"),
  postController.getCurrentUserPosts
);
router.get(
  "/:id",
  authenticate,
  authorize("posts.read"),
  postController.getPostById
);
router.post(
  "/",
  authenticate,
  authorize("posts.create"),
  validateRequest(schemas.post),
  postController.createPost
);
router.put(
  "/:id",
  authenticate,
  authorize("posts.update"),
  validateRequest(schemas.post),
  postController.updatePost
);
router.patch(
  "/:id/publish",
  authenticate,
  authorize("posts.publish"),
  postController.togglePublishPost
);
router.delete(
  "/:id",
  authenticate,
  authorize("posts.delete"),
  postController.deletePost
);

export default router;
