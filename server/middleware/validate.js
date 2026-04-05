const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      errors: error.details.map((e) => e.message),
    });
  }

  req.body = value;
  next();
};

export default validateBody;
