import jwt from "jsonwebtoken";

export function verifyTokenStudent(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const secretKey = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secretKey);

    if (decoded.rol === "student") {
      req.user = decoded;
    } else {
      req.user = null;
    }

    return next();

  } catch (error) {
    req.user = null;
    return next();
  }
}
