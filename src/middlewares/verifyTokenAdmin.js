import jwt from "jsonwebtoken";

export function verifyTokenAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access Denied: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const secretKey = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secretKey);

    if (decoded.rol === "admin") {
      req.user = decoded;

      next();
    } else {
      return res.status(401).json({ message: "Access Denied: Your Admin This Not Available For You" });
    }

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    res.status(401).json({ message: "Invalid token" });
  }

}
