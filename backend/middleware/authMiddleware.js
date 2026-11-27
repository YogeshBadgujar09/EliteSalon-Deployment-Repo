const jwt = require("jsonwebtoken");

/**
 * Verifies the Bearer JWT from the Authorization header and sets `req.data`.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization header missing",
    });
  }

  const parts = authHeader.split(" ");
  const token = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;

  if (!token) {
    return res.status(401).json({
      message: "Token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.data = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

/**
 * Restricts route access to callers whose JWT `role` matches one of `allowedRoles`.
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.data?.role;
  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({
      message: "Forbidden: insufficient permissions",
    });
  }
  return next();
};

authMiddleware.requireRole = requireRole;

module.exports = authMiddleware;
