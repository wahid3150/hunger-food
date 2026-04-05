import Joi from "joi";

const googleAuthSchema = Joi.object({
  fullName: Joi.string().trim().min(3).max(30).optional().messages({
    "string.base": "Name must be a text value",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name cannot exceed 30 characters",
  }),

  email: Joi.string().trim().email().lowercase().required().messages({
    "string.base": "Email must be a text value",
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  mobile: Joi.string()
    .trim()
    .pattern(/^(?:\+92|92|0)?3[0-9]{9}$/)
    .optional()
    .allow(null)
    .messages({
      "string.base": "Mobile number must be a text value",
      "string.pattern.base":
        "Enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)",
    }),

  role: Joi.string().valid("user", "owner", "deliveryBoy").optional().messages({
    "string.base": "Role must be a text value",
    "any.only": "Role must be 'user', 'owner', or 'deliveryBoy'",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export default googleAuthSchema;
