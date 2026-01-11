module.exports = function validateDiscountPermission(req, res, next) {
  const { permission, type } = req.body;

  if (!permission || !permission.scope) {
    return res.status(400).json({
      message: "permission.scope is required"
    });
  }

  // validate type
  if (!["percentage", "mony"].includes(type)) {
    return res.status(400).json({
      message: "type must be percentage or mony"
    });
  }

  switch (permission.scope) {
    case "global":
      if (permission.courses || permission.years) {
        return res.status(400).json({
          message: "global scope must not have courses or years"
        });
      }
      break;

    case "courses":
      if (
        !Array.isArray(permission.courses) ||
        permission.courses.length === 0
      ) {
        return res.status(400).json({
          message: "courses must be a non-empty array"
        });
      }
      if (permission.years) {
        return res.status(400).json({
          message: "courses scope must not have years"
        });
      }
      break;

    case "years":
      if (
        !Array.isArray(permission.years) ||
        permission.years.length === 0
      ) {
        return res.status(400).json({
          message: "years must be a non-empty array"
        });
      }
      if (permission.courses) {
        return res.status(400).json({
          message: "years scope must not have courses"
        });
      }
      break;

    default:
      return res.status(400).json({
        message: "permission.scope must be global, courses, or years"
      });
  }

  next();
};
