export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Database errors
  if (err.code === "23505") {
    return res
      .status(400)
      .json({ error: "Duplicate entry. Resource already exists." });
  }

  if (err.code === "23503") {
    return res
      .status(400)
      .json({ error: "Referenced resource does not exist." });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token." });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired." });
  }

  // Default error
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
};
