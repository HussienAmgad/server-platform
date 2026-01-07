const requireBodyFields = (fields = []) => {
  return (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({
          message: "Request body is required"
        });
      }

      for (const field of fields) {
        if (!req.body[field]) {
          return res.status(400).json({
            message: `${field} is required`
          });
        }
      }

      next();
    } catch (err) {
      console.error("requireBodyFields Error:", err);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  };
};

module.exports = requireBodyFields;
