const requireQueryParams = (params = []) => {
  return (req, res, next) => {
    try {
      for (const param of params) {
        if (
          !req.query ||
          req.query[param] === undefined ||
          req.query[param] === null ||
          req.query[param] === ""
        ) {
          return res.status(400).json({
            message: `${param} is required`
          });
        }
      }
      next();
    } catch (err) {
      console.error("requireQueryParams Error:", err);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  };
};

module.exports = requireQueryParams;
