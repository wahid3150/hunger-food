import Joi from "joi";

export const verifyOtpSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.base": "Email must be a text value",
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  otp: Joi.string()
    .trim()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.base": "OTP must be a text value",
      "string.empty": "OTP is required",
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
      "any.required": "OTP is required",
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});
