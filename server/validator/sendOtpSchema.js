import Joi from "joi";

export const sendOtpSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.base": "Email must be a text value",
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});
