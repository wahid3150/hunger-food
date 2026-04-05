import Joi from "joi";

export const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.base": "Email must be a text value",
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  newPassword: Joi.string().trim().min(6).max(30).required().messages({
    "string.base": "Password must be a text value",
    "string.empty": "New password is required",
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password cannot exceed 30 characters",
    "any.required": "New password is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});
