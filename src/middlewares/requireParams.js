const requireParams = (params = []) => {
  return (req, res, next) => {
    for (const param of params) {
      if (!req.params[param]) {
        return res.status(400).json({
          message: `${param} is required`
        });
      }
    }
    next();
  };
};

export default requireParams;
