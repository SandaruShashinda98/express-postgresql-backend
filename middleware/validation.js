import Joi from "joi";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => detail.message),
      });
    }
    next();
  };
};

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    roleId: Joi.number().integer().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  user: Joi.object({
    email: Joi.string().email().optional(),
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    roleId: Joi.number().integer().optional(),
    isActive: Joi.boolean().optional(),
  }),

  role: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(255).optional(),
    permissions: Joi.array().items(Joi.string()).required(),
  }),

  post: Joi.object({
    title: Joi.string().min(5).max(255).required(),
    content: Joi.string().min(10).required(),
    status: Joi.string().valid("draft", "published").optional(),
  }),
};
