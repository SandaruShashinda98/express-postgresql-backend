import { postService } from "./post.service";

export const postController = {
  getAllPosts: async (req, res) => {
    try {
      const result = await postService.getAllPosts(req.query);
      res.json(result);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  },

  getPostById: async (req, res) => {
    try {
      const post = await postService.getPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({ post });
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  },

  createPost: async (req, res) => {
    try {
      const post = await postService.createPost({
        ...req.body,
        authorId: req.user.id,
      });
      res.status(201).json({
        message: "Post created successfully",
        post,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  },

  updatePost: async (req, res) => {
    try {
      const post = await postService.updatePost(
        req.params.id,
        req.body,
        req.user
      );
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({
        message: "Post updated successfully",
        post,
      });
    } catch (error) {
      console.error("Update post error:", error);
      if (
        error.message === "Access denied. You can only update your own posts."
      ) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to update post" });
      }
    }
  },

  togglePublishPost: async (req, res) => {
    try {
      const post = await postService.togglePublishPost(
        req.params.id,
        req.body.publish
      );
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({
        message: `Post ${
          req.body.publish ? "published" : "unpublished"
        } successfully`,
        post,
      });
    } catch (error) {
      console.error("Publish post error:", error);
      res.status(500).json({ error: "Failed to update post status" });
    }
  },

  deletePost: async (req, res) => {
    try {
      const deleted = await postService.deletePost(req.params.id, req.user);
      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      if (
        error.message === "Access denied. You can only delete your own posts."
      ) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to delete post" });
      }
    }
  },

  getCurrentUserPosts: async (req, res) => {
    try {
      const result = await postService.getCurrentUserPosts(
        req.user.id,
        req.query
      );
      res.json(result);
    } catch (error) {
      console.error("Get my posts error:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  },
};
