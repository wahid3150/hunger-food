import Joi from "joi";

const signupSchema = Joi.object({
  fullName: Joi.string().trim().min(3).max(30).required().messages({
    "string.base": "Name must be a text value",
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name cannot exceed 30 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().trim().email().lowercase().required().messages({
    "string.base": "Email must be a text value",
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),

  password: Joi.string().trim().min(6).max(30).required().messages({
    "string.base": "Password must be a text value",
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password cannot exceed 30 characters",
    "any.required": "Password is required",
  }),

  mobile: Joi.string()
    .trim()
    .pattern(/^(?:\+92|92|0)?3[0-9]{9}$/)
    .required()
    .messages({
      "string.base": "Mobile number must be a text value",
      "string.empty": "Mobile number is required",
      "string.pattern.base":
        "Enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)",
      "any.required": "Mobile number is required",
    }),

  role: Joi.string().valid("user", "owner", "deliveryBoy").required().messages({
    "string.base": "Role must be a text value",
    "any.only": "Role must be 'user', 'owner', or 'deliveryBoy'",
    "any.required": "Role is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export default signupSchema;
