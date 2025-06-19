import { postRepository } from "./post.repository";

export const postService = {
  getAllPosts: async (queryParams) => {
    const { page = 1, limit = 10, status = "", author = "" } = queryParams;
    const offset = (page - 1) * limit;

    const posts = await postRepository.findAllWithPagination({
      limit: parseInt(limit),
      offset,
      status,
      author,
    });

    const total = await postRepository.countAll(status, author);

    return {
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  getPostById: async (id) => {
    return await postRepository.findByIdWithAuthor(id);
  },

  createPost: async (postData) => {
    const { title, content, status = "draft", authorId } = postData;
    return await postRepository.create({
      title,
      content,
      authorId,
      status,
      publishedAt: status === "published" ? new Date() : null,
    });
  },

  updatePost: async (id, updateData, user) => {
    // Check if post exists
    const post = await postRepository.findById(id);
    if (!post) {
      return null;
    }

    // Check ownership or admin permissions
    const userPermissions = user.permissions || [];
    if (
      post.author_id !== user.id &&
      !userPermissions.includes("posts.update")
    ) {
      throw new Error("Access denied. You can only update your own posts.");
    }

    const { title, content, status } = updateData;
    const publishedAt =
      status === "published" && post.status !== "published"
        ? new Date()
        : status === "published"
        ? post.published_at
        : null;

    return await postRepository.update(id, {
      title,
      content,
      status,
      publishedAt,
    });
  },

  togglePublishPost: async (id, publish) => {
    const status = publish ? "published" : "draft";
    const publishedAt = publish ? new Date() : null;

    return await postRepository.updateStatus(id, { status, publishedAt });
  },

  deletePost: async (id, user) => {
    // Check if post exists
    const post = await postRepository.findById(id);
    if (!post) {
      return false;
    }

    // Check ownership or admin permissions
    const userPermissions = user.permissions || [];
    if (
      post.author_id !== user.id &&
      !userPermissions.includes("posts.delete")
    ) {
      throw new Error("Access denied. You can only delete your own posts.");
    }

    return await postRepository.delete(id);
  },

  getCurrentUserPosts: async (userId, queryParams) => {
    const { page = 1, limit = 10, status = "" } = queryParams;
    const offset = (page - 1) * limit;

    const posts = await postRepository.findByAuthorWithPagination(userId, {
      limit: parseInt(limit),
      offset,
      status,
    });

    const total = await postRepository.countByAuthor(userId, status);

    return {
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },
};
